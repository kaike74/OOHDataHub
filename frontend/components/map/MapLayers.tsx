'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { kml } from '@tmcw/togeojson';
import { useStore } from '@/lib/store';
import { MapLayer, CustomMarker } from '@/lib/types';
import { Layers, Upload, X, Eye, EyeOff, Trash2, FileSpreadsheet, FileCode, Check, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function MapLayers() {
    const customLayers = useStore((state) => state.customLayers);
    const addCustomLayer = useStore((state) => state.addCustomLayer);
    const toggleLayerVisibility = useStore((state) => state.toggleLayerVisibility);
    const removeLayer = useStore((state) => state.removeLayer);

    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Excel Import State
    const [excelData, setExcelData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [showColumnMapper, setShowColumnMapper] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [columnMapping, setColumnMapping] = useState({
        lat: '',
        lng: '',
        title: '',
        description: ''
    });

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsProcessing(true);
        setSelectedFile(file);

        try {
            if (file.name.endsWith('.kml')) {
                const text = await file.text();
                const parser = new DOMParser();
                const kmlDoc = parser.parseFromString(text, 'text/xml');
                const geoJSON = kml(kmlDoc);

                const markers: CustomMarker[] = [];
                geoJSON.features.forEach((feature: any) => {
                    if (feature.geometry?.type === 'Point') {
                        markers.push({
                            id: uuidv4(),
                            lat: feature.geometry.coordinates[1],
                            lng: feature.geometry.coordinates[0],
                            title: feature.properties?.name || 'Sem nome',
                            description: feature.properties?.description || '',
                        });
                    }
                });

                if (markers.length > 0) {
                    addCustomLayer({
                        id: uuidv4(),
                        name: file.name.replace('.kml', ''),
                        visible: true,
                        color: getRandomColor(),
                        markers
                    });
                }
                setIsProcessing(false);
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                const buffer = await file.arrayBuffer();
                const workbook = XLSX.read(buffer);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet);

                if (data.length > 0) {
                    setExcelData(data);
                    setHeaders(Object.keys(data[0] as object));
                    setShowColumnMapper(true);

                    // Auto-detect columns
                    const keys = Object.keys(data[0] as object).map(k => k.toLowerCase());
                    const latKey = keys.find(k => k.includes('lat') || k.includes('latitude')) || '';
                    const lngKey = keys.find(k => k.includes('lng') || k.includes('long') || k.includes('longitude')) || '';
                    const titleKey = keys.find(k => k.includes('nome') || k.includes('name') || k.includes('titulo') || k.includes('loja')) || '';

                    // Map back to original case
                    const originalKeys = Object.keys(data[0] as object);
                    setColumnMapping({
                        lat: originalKeys.find(k => k.toLowerCase() === latKey) || '',
                        lng: originalKeys.find(k => k.toLowerCase() === lngKey) || '',
                        title: originalKeys.find(k => k.toLowerCase() === titleKey) || '',
                        description: ''
                    });
                }
                setIsProcessing(false);
            }
        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            setIsProcessing(false);
        }
    }, [addCustomLayer]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.google-earth.kml+xml': ['.kml'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        multiple: false
    });

    const handleConfirmExcelImport = () => {
        if (!excelData.length || !columnMapping.lat || !columnMapping.lng) return;

        const markers: CustomMarker[] = excelData.map((row) => ({
            id: uuidv4(),
            lat: parseFloat(row[columnMapping.lat]),
            lng: parseFloat(row[columnMapping.lng]),
            title: columnMapping.title ? row[columnMapping.title] : 'Sem nome',
            description: columnMapping.description ? row[columnMapping.description] : '',
        })).filter(m => !isNaN(m.lat) && !isNaN(m.lng));

        addCustomLayer({
            id: uuidv4(),
            name: selectedFile?.name.replace(/\.[^/.]+$/, "") || 'Nova Camada',
            visible: true,
            color: getRandomColor(),
            markers
        });

        setShowColumnMapper(false);
        setExcelData([]);
        setSelectedFile(null);
    };

    const getRandomColor = () => {
        const colors = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    return (
        <div className="absolute top-20 left-4 z-10 font-sans">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors group"
                title="Camadas Personalizadas"
            >
                <Layers className="text-gray-700 group-hover:text-emidias-accent transition-colors" size={24} />
                {customLayers.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emidias-accent text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                        {customLayers.filter(l => l.visible).length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-14 left-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Layers size={18} className="text-emidias-accent" />
                            Minhas Camadas
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                        {/* Dropzone */}
                        {!showColumnMapper ? (
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-emidias-accent bg-emidias-accent/5' : 'border-gray-300 hover:border-emidias-accent/50 hover:bg-gray-50'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                                <p className="text-sm text-gray-600 font-medium">
                                    {isProcessing ? 'Processando...' : 'Arraste XLSX ou KML aqui'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    ou clique para selecionar
                                </p>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <FileSpreadsheet size={16} className="text-green-600" />
                                    Mapear Colunas
                                </h4>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-600">Latitude *</label>
                                        <select
                                            value={columnMapping.lat}
                                            onChange={(e) => setColumnMapping(prev => ({ ...prev, lat: e.target.value }))}
                                            className="w-full text-sm border-gray-300 rounded-md focus:ring-emidias-accent focus:border-emidias-accent"
                                        >
                                            <option value="">Selecione...</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-600">Longitude *</label>
                                        <select
                                            value={columnMapping.lng}
                                            onChange={(e) => setColumnMapping(prev => ({ ...prev, lng: e.target.value }))}
                                            className="w-full text-sm border-gray-300 rounded-md focus:ring-emidias-accent focus:border-emidias-accent"
                                        >
                                            <option value="">Selecione...</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-600">Nome (Título)</label>
                                        <select
                                            value={columnMapping.title}
                                            onChange={(e) => setColumnMapping(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full text-sm border-gray-300 rounded-md focus:ring-emidias-accent focus:border-emidias-accent"
                                        >
                                            <option value="">Selecione...</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => {
                                                setShowColumnMapper(false);
                                                setExcelData([]);
                                                setSelectedFile(null);
                                            }}
                                            className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleConfirmExcelImport}
                                            disabled={!columnMapping.lat || !columnMapping.lng}
                                            className="flex-1 px-3 py-2 text-xs font-medium text-white bg-emidias-accent rounded-md hover:bg-emidias-accent-dark disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            Importar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Layers List */}
                        <div className="space-y-2">
                            {customLayers.length === 0 && !showColumnMapper && (
                                <div className="text-center py-4 text-gray-400 text-xs italic">
                                    Nenhuma camada importada
                                </div>
                            )}
                            {customLayers.map(layer => (
                                <div key={layer.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: layer.color }}
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-700 truncate">{layer.name}</p>
                                            <p className="text-xs text-gray-500">{layer.markers.length} pontos</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => toggleLayerVisibility(layer.id)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                                            title={layer.visible ? "Ocultar" : "Mostrar"}
                                        >
                                            {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>
                                        <button
                                            onClick={() => removeLayer(layer.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
