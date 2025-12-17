'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { CustomMarker } from '@/lib/types';
import { Layers, Upload, X, Eye, EyeOff, Trash2, FileSpreadsheet, MapPin, Check, ChevronRight, Loader2, AlertCircle, Palette, Table as TableIcon, Edit2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Rate Limiter Helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const PRESET_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#000000', '#78716c'];

export default function MapLayers() {
    const customLayers = useStore((state) => state.customLayers);
    const setCustomLayers = useStore((state) => state.setCustomLayers);
    const addCustomLayer = useStore((state) => state.addCustomLayer);
    const toggleLayerVisibility = useStore((state) => state.toggleLayerVisibility);
    const removeLayer = useStore((state) => state.removeLayer);
    const updateLayerColor = useStore((state) => state.updateLayerColor);
    const selectedProposta = useStore((state) => state.selectedProposta);

    const [isOpen, setIsOpen] = useState(false);

    // Import Wizard State
    // NEW STEP: 'table-preview'
    const [step, setStep] = useState<'upload' | 'table-preview' | 'address' | 'name' | 'processing'>('upload');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [excelData, setExcelData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [selectedAddressCols, setSelectedAddressCols] = useState<string[]>([]);
    const [selectedNameCol, setSelectedNameCol] = useState<string>('');

    // Table View State
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const [viewingLayerData, setViewingLayerData] = useState<{ id: string, name: string, data: any[], headers: string[] } | null>(null);

    // Processing State
    const [processedCount, setProcessedCount] = useState(0);
    const [totalToProcess, setTotalToProcess] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    const isProcessingRef = useRef(false);

    // Color Picker State
    const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);

    // Sync with Backend
    useEffect(() => {
        if (selectedProposta?.id) {
            api.getProposalLayers(selectedProposta.id)
                .then(layers => {
                    setCustomLayers(layers);
                })
                .catch(err => console.error('Erro ao carregar camadas:', err));
        } else {
            setCustomLayers([]);
        }
    }, [selectedProposta?.id, setCustomLayers]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setSelectedFile(file);

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet);

            if (data.length > 0) {
                setExcelData(data);
                const headers = Object.keys(data[0] as object);
                setHeaders(headers);

                // Show Data Table Preview IMMEDIATELY
                setViewingLayerData({
                    id: 'new',
                    name: file.name,
                    data: data,
                    headers: headers
                });
                setIsTableModalOpen(true);
                setStep('table-preview'); // Logical step, but modal is overlay
            }
        } catch (error) {
            console.error('Erro ao ler arquivo:', error);
            setErrors(prev => [...prev, 'Erro ao ler arquivo Excel/CSV']);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv']
        },
        multiple: false
    });

    const toggleAddressCol = (header: string) => {
        setSelectedAddressCols(prev =>
            prev.includes(header)
                ? prev.filter(h => h !== header)
                : [...prev, header]
        );
    };

    const handleContinueFromTable = () => {
        setIsTableModalOpen(false);
        setStep('address');
    };

    const startGeocoding = async () => {
        if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
            setErrors(prev => [...prev, 'API Key do Google Maps não configurada']);
            return;
        }

        setStep('processing');
        setProcessedCount(0);
        setTotalToProcess(excelData.length);
        isProcessingRef.current = true;
        setErrors([]);

        const markers: CustomMarker[] = [];
        const geocoder = new google.maps.Geocoder();

        for (let i = 0; i < excelData.length; i++) {
            if (!isProcessingRef.current) break;

            const row = excelData[i];

            const addressParts = selectedAddressCols.map(col => row[col]).filter(Boolean);
            const address = addressParts.join(', ');

            if (!address) {
                setProcessedCount(prev => prev + 1);
                continue;
            }

            try {
                const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                    geocoder.geocode({ address }, (results, status) => {
                        if (status === 'OK' && results) {
                            resolve(results);
                        } else {
                            if (status === 'OVER_QUERY_LIMIT') {
                                reject('RATE_LIMIT');
                            } else {
                                resolve([]);
                            }
                        }
                    });
                });

                if (result && result.length > 0) {
                    const location = result[0].geometry.location;
                    markers.push({
                        id: uuidv4(),
                        lat: location.lat(),
                        lng: location.lng(),
                        title: selectedNameCol ? row[selectedNameCol] : address,
                        description: address
                    });
                } else {
                    // Mark error in data?
                }

                setProcessedCount(prev => prev + 1);
                await delay(300);

            } catch (error) {
                if (error === 'RATE_LIMIT') {
                    await delay(2500);
                    i--;
                } else {
                    setProcessedCount(prev => prev + 1);
                }
            }
        }

        if (markers.length > 0) {
            const newLayer = {
                id: uuidv4(),
                name: selectedFile?.name.replace(/\.[^/.]+$/, "") || 'Nova Camada',
                visible: true,
                color: getRandomColor(),
                markers,
                data: excelData, // Save raw data
                headers: headers
            };

            addCustomLayer(newLayer);

            if (selectedProposta?.id) {
                try {
                    await api.addProposalLayer(selectedProposta.id, newLayer);
                } catch (e) {
                    console.error("Failed to save layer", e);
                    setErrors(prev => [...prev, 'Erro ao salvar camada.']);
                }
            }
            resetState();
        } else {
            setErrors(prev => [...prev, 'Nenhum endereço localizado.']);
            setTimeout(() => setStep('upload'), 2000);
        }

        isProcessingRef.current = false;
    };

    const resetState = () => {
        setStep('upload');
        setSelectedFile(null);
        setExcelData([]);
        setProcessedCount(0);
        setTotalToProcess(0);
    };

    const cancelProcessing = () => {
        isProcessingRef.current = false;
        resetState();
    };

    const getRandomColor = () => {
        const colors = PRESET_COLORS;
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const handleOpenTable = (layer: any) => {
        if (!layer.data || layer.data.length === 0) {
            alert('Sem dados brutos disponíveis para esta camada.');
            return;
        }
        setViewingLayerData({
            id: layer.id,
            name: layer.name,
            data: layer.data,
            headers: layer.headers || Object.keys(layer.data[0] || {})
        });
        setIsTableModalOpen(true);
    };

    const handleColorChange = async (layerId: string, color: string) => {
        updateLayerColor(layerId, color);
        setActiveColorPicker(null);
        if (selectedProposta?.id) {
            api.updateProposalLayer(selectedProposta.id, layerId, { color }).catch(console.error);
        }
    };

    const handleToggleVisibility = async (layerId: string, currentVisible: boolean) => {
        toggleLayerVisibility(layerId);
        if (selectedProposta?.id) {
            api.updateProposalLayer(selectedProposta.id, layerId, { visible: !currentVisible }).catch(console.error);
        }
    };

    const handleRemoveLayer = async (layerId: string) => {
        removeLayer(layerId);
        if (selectedProposta?.id) {
            api.deleteProposalLayer(selectedProposta.id, layerId).catch(console.error);
        }
    };

    if (!selectedProposta) return null;

    return (
        <>
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
                    <div className="absolute top-14 left-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Layers size={18} className="text-emidias-accent" />
                                Minhas Camadas
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                            {/* STEP: UPLOAD */}
                            {step === 'upload' && (
                                <div className="space-y-4">
                                    <div
                                        {...getRootProps()}
                                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-emidias-accent bg-emidias-accent/5' : 'border-gray-300 hover:border-emidias-accent/50 hover:bg-gray-50'}`}
                                    >
                                        <input {...getInputProps()} />
                                        <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                                        <p className="text-sm text-gray-600 font-medium">
                                            Arraste sua planilha aqui
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            XLSX ou CSV
                                        </p>
                                    </div>

                                    <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Camadas Ativas</h4>
                                        {customLayers.length === 0 && (
                                            <div className="text-center py-2 text-gray-400 text-xs italic">
                                                Nenhuma camada importada
                                            </div>
                                        )}
                                        {customLayers.map(layer => (
                                            <div key={layer.id} className="relative flex flex-col p-2 bg-gray-50 border border-gray-200 rounded-md hover:bg-white transition-colors group">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <button
                                                            onClick={() => setActiveColorPicker(activeColorPicker === layer.id ? null : layer.id)}
                                                            className="w-4 h-4 rounded-full flex-shrink-0 border border-black/10 hover:scale-110 transition-transform"
                                                            style={{ backgroundColor: layer.color }}
                                                            title="Mudar cor"
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-gray-700 truncate max-w-[120px]" title={layer.name}>{layer.name}</p>
                                                        </div>
                                                    </div>

                                                    {/* Color Picker Popover */}
                                                    {activeColorPicker === layer.id && (
                                                        <div className="absolute top-8 left-0 z-20 bg-white p-2 rounded-lg shadow-xl border border-gray-200 grid grid-cols-5 gap-1 animate-in zoom-in-95 duration-200">
                                                            {PRESET_COLORS.map(color => (
                                                                <button
                                                                    key={color}
                                                                    className="w-5 h-5 rounded-full hover:scale-110 transition-transform border border-black/10"
                                                                    style={{ backgroundColor: color }}
                                                                    onClick={() => handleColorChange(layer.id, color)}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => handleToggleVisibility(layer.id, layer.visible)} className="p-1 hover:bg-gray-200 rounded text-gray-500">
                                                            {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                                        </button>
                                                        <button onClick={() => handleOpenTable(layer)} className="p-1 hover:bg-blue-100 hover:text-blue-500 rounded text-gray-500" title="Ver tabela de dados">
                                                            <TableIcon size={14} />
                                                        </button>
                                                        <button onClick={() => handleRemoveLayer(layer.id)} className="p-1 hover:bg-red-100 hover:text-red-500 rounded text-gray-500">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP: TABLE PREVIEW (Handled by Modal usually, but step tracker keeps basic state) */}

                            {/* STEP: ADDRESS COLUMNS */}
                            {step === 'address' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
                                        <MapPin className="text-blue-600 mt-0.5" size={18} />
                                        <div>
                                            <h4 className="text-sm font-bold text-blue-900">Endereço</h4>
                                            <p className="text-xs text-blue-700 mt-1">
                                                Selecione as colunas de endereço.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                                        {headers.map(header => (
                                            <div
                                                key={header}
                                                className={`p-2.5 flex items-center cursor-pointer hover:bg-gray-50 transition-colors ${selectedAddressCols.includes(header) ? 'bg-blue-50/50' : ''}`}
                                                onClick={() => toggleAddressCol(header)}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${selectedAddressCols.includes(header) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                                                    {selectedAddressCols.includes(header) && <Check size={10} className="text-white" strokeWidth={4} />}
                                                </div>
                                                <span className="text-sm text-gray-700 font-medium">{header}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button onClick={resetState} className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md">
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => setStep('name')}
                                            disabled={selectedAddressCols.length === 0}
                                            className="flex-1 bg-emidias-accent text-white py-2 rounded-md text-sm font-medium hover:bg-emidias-accent-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                                        >
                                            Próximo <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP: NAME COLUMN */}
                            {step === 'name' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-start gap-3 bg-indigo-50 p-3 rounded-lg">
                                        <FileSpreadsheet className="text-indigo-600 mt-0.5" size={18} />
                                        <div>
                                            <h4 className="text-sm font-bold text-indigo-900">Nome</h4>
                                            <p className="text-xs text-indigo-700 mt-1">
                                                Coluna para o nome do local.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                                        {headers.map(header => (
                                            <div
                                                key={header}
                                                className={`p-2.5 flex items-center cursor-pointer hover:bg-gray-50 transition-colors ${selectedNameCol === header ? 'bg-indigo-50/50' : ''}`}
                                                onClick={() => setSelectedNameCol(header)}
                                            >
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 transition-colors ${selectedNameCol === header ? 'border-indigo-500' : 'border-gray-300 bg-white'}`}>
                                                    {selectedNameCol === header && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                                </div>
                                                <span className="text-sm text-gray-700 font-medium">{header}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button onClick={() => setStep('address')} className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md">
                                            Voltar
                                        </button>
                                        <button
                                            onClick={startGeocoding}
                                            disabled={!selectedNameCol}
                                            className="flex-1 bg-emidias-accent text-white py-2 rounded-md text-sm font-medium hover:bg-emidias-accent-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                                        >
                                            <MapPin size={16} /> Mapear Pontos
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP: PROCESSING */}
                            {step === 'processing' && (
                                <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in-95 duration-300">
                                    <div className="relative">
                                        <Loader2 size={48} className="text-emidias-accent animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                            {Math.round((processedCount / totalToProcess) * 100)}%
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <h4 className="font-semibold text-gray-800">Localizando endereços...</h4>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Aguarde o processamento.
                                        </p>
                                        <p className="text-sm font-bold text-emidias-accent mt-2">
                                            {processedCount} / {totalToProcess}
                                        </p>
                                    </div>
                                    <button
                                        onClick={cancelProcessing}
                                        className="text-xs text-red-500 hover:underline mt-4"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}

                            {/* Errors */}
                            {errors.length > 0 && (
                                <div className="mt-4 p-3 bg-red-50 rounded-lg text-xs text-red-600 space-y-1 border border-red-100">
                                    <div className="flex items-center gap-2 font-bold mb-1">
                                        <AlertCircle size={14} /> Erros encontrados:
                                    </div>
                                    {errors.map((err, i) => (
                                        <p key={i}>• {err}</p>
                                    ))}
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>

            {/* TABLE DATA MODAL */}
            {isTableModalOpen && viewingLayerData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-gray-800">{viewingLayerData.name}</h3>
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">
                                    {viewingLayerData.data.length} linhas
                                </span>
                            </div>
                            <button onClick={() => setIsTableModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-0">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        {viewingLayerData.headers.map(header => (
                                            <th key={header} className="px-4 py-3 font-semibold text-gray-600 border-b border-r last:border-r-0 border-gray-200 whitespace-nowrap">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {viewingLayerData.data.slice(0, 500).map((row, i) => (
                                        <tr key={i} className="hover:bg-blue-50/50 even:bg-white odd:bg-gray-50/50">
                                            {viewingLayerData.headers.map(header => (
                                                <td key={header} className="px-4 py-2 border-r last:border-r-0 border-gray-100 max-w-[200px] truncate" title={row[header]}>
                                                    {row[header]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {viewingLayerData.data.length > 500 && (
                                        <tr>
                                            <td colSpan={viewingLayerData.headers.length} className="p-4 text-center text-gray-400 italic">
                                                Mostrando apenas as primeiras 500 linhas.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Action */}
                        {step === 'table-preview' && (
                            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50 rounded-b-xl">
                                <button
                                    onClick={handleContinueFromTable}
                                    className="bg-emidias-accent text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-emidias-accent-dark shadow-lg shadow-emidias-accent/20 transition-all flex items-center gap-2"
                                >
                                    Configurar Colunas <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
