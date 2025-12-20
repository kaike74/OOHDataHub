'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { CustomMarker, MapLayer } from '@/lib/types';
import { Layers, Upload, X, Eye, EyeOff, Trash2, FileSpreadsheet, MapPin, Check, ChevronRight, Loader2, AlertCircle, Palette, Table as TableIcon, Edit2, Maximize2, Minimize2, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

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
    const updateLayerData = useStore((state) => state.updateLayerData);
    const updateCustomMarkerPosition = useStore((state) => state.updateCustomMarkerPosition);
    const selectedProposta = useStore((state) => state.selectedProposta);

    const [isOpen, setIsOpen] = useState(false);

    // Import Wizard State
    // NEW STEP: 'table-preview'
    const [step, setStep] = useState<'upload' | 'table-preview' | 'address' | 'name'>('upload');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [excelData, setExcelData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [selectedAddressCols, setSelectedAddressCols] = useState<string[]>([]);
    const [selectedNameCol, setSelectedNameCol] = useState<string>('');

    // Table View State (Non-blocking Drawer)
    const [isTableOpen, setIsTableOpen] = useState(false);
    const [viewingLayerId, setViewingLayerId] = useState<string | null>(null);
    const [tableHeight, setTableHeight] = useState<'half' | 'full'>('half');

    // Layer Renaming State
    const [renamingLayerId, setRenamingLayerId] = useState<string | null>(null);
    const [tempLayerName, setTempLayerName] = useState('');

    // Processing State (Per Layer)
    const [processingStatus, setProcessingStatus] = useState<Record<string, { total: number, current: number, error?: boolean }>>({});

    // Config needed for re-geocoding
    const [layerConfigs, setLayerConfigs] = useState<Record<string, { addressCols: string[], nameCol: string }>>({});

    // Color Picker State
    const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);

    // Sync with Backend
    useEffect(() => {
        if (selectedProposta?.id) {
            api.getProposalLayers(selectedProposta.id)
                .then(layers => {
                    setCustomLayers(layers);
                    // Load configs
                    const configs: any = {};
                    layers.forEach((l: MapLayer) => {
                        if (l.config) configs[l.id] = l.config;
                    });
                    setLayerConfigs(configs);
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
                // Add unique ID to each row for tracking
                const enhancedData = data.map((row: any) => ({ ...row, _id: uuidv4() }));
                setExcelData(enhancedData);
                const headers = Object.keys(data[0] as object);
                setHeaders(headers);

                // Initialize Wizard directly to Address selection
                setViewingLayerId(null);
                setStep('address');
            }
        } catch (error) {
            console.error('Erro ao ler arquivo:', error);
            alert('Erro ao ler arquivo Excel/CSV');
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
        setIsTableOpen(false); // Close table to focus on configuration
        setViewingLayerId(null);
        setStep('address');
    };

    // --- BACKGROUND GEOCODING LOGIC ---

    const startBackgroundGeocoding = async (layerId: string, data: any[], addressCols: string[], nameCol: string) => {
        if (!selectedProposta?.id) return;

        // Initialize progress
        setProcessingStatus(prev => ({ ...prev, [layerId]: { total: data.length, current: 0 } }));

        const geocoder = new google.maps.Geocoder();
        const markers: CustomMarker[] = [];
        let errors = 0;

        // Clone data to avoid mutation issues during async
        const rowsToProcess = [...data];

        for (let i = 0; i < rowsToProcess.length; i++) {
            // Check if layer still exists (user might have deleted it)
            const currentLayer = useStore.getState().customLayers.find(l => l.id === layerId);
            if (!currentLayer) break; // Stop if deleted

            const row = rowsToProcess[i];
            const addressParts = addressCols.map(col => row[col]).filter(Boolean);
            const address = addressParts.join(', ');

            if (!address) {
                setProcessingStatus(prev => ({ ...prev, [layerId]: { ...prev[layerId], current: i + 1 } }));
                continue;
            }

            try {
                const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                    geocoder.geocode({ address }, (results, status) => {
                        if (status === 'OK' && results) {
                            resolve(results);
                        } else if (status === 'OVER_QUERY_LIMIT') {
                            reject('RATE_LIMIT');
                        } else {
                            resolve([]);
                        }
                    });
                });

                if (result && result.length > 0) {
                    const location = result[0].geometry.location;
                    const marker: CustomMarker = {
                        id: uuidv4(),
                        lat: location.lat(),
                        lng: location.lng(),
                        title: nameCol ? row[nameCol] : address,
                        description: address
                    };
                    markers.push(marker);

                    // Update Store Incrementally (Batch every 5 or so? For now every 1 for visual effect)
                    // Efficiently: We should probably batch updates to avoid too many renders, 
                    // but for "Instant" feel, seeing them pop 1 by 1 is cool.
                    const layer = useStore.getState().customLayers.find(l => l.id === layerId);
                    if (layer) {
                        updateLayerData(layerId, { markers: [...layer.markers, marker] });
                    }
                } else {
                    errors++;
                }

                setProcessingStatus(prev => ({ ...prev, [layerId]: { ...prev[layerId], current: i + 1 } }));
                await delay(300); // Respect generic rate limit

            } catch (error) {
                if (error === 'RATE_LIMIT') {
                    await delay(2500);
                    i--; // Retry this index
                } else {
                    errors++;
                    setProcessingStatus(prev => ({ ...prev, [layerId]: { ...prev[layerId], current: i + 1 } }));
                }
            }
        }

        // Final Save to Backend to ensure persistence of all markers
        const finalLayer = useStore.getState().customLayers.find(l => l.id === layerId);
        if (finalLayer) {
            try {
                await api.updateProposalLayer(selectedProposta.id, layerId, { markers: finalLayer.markers });
            } catch (e) {
                console.error('Final save failed', e);
            }
        }

        // Clear processing status
        setProcessingStatus(prev => {
            const newState = { ...prev };
            delete newState[layerId];
            return newState;
        });
    };

    const handleCreateLayer = async () => {
        if (!selectedProposta?.id) return;

        // 1. Create Initial Layer Object
        const newLayerId = uuidv4();
        const initialLayer = {
            id: newLayerId,
            name: selectedFile?.name.replace(/\.[^/.]+$/, "") || 'Nova Camada',
            visible: true,
            color: getRandomColor(),
            markers: [], // Start empty
            data: excelData,
            headers: headers,
            config: {
                addressCols: selectedAddressCols,
                nameCol: selectedNameCol,
                headers // Persist headers here for reliability
            }
        };

        // 2. Add to Store Immediately (Optimistic)
        addCustomLayer(initialLayer);
        setLayerConfigs(prev => ({ ...prev, [newLayerId]: initialLayer.config }));

        // 3. Reset Wizard UI
        resetState();
        setIsOpen(true); // Keep list open to show progress

        // 4. Persist Initial Shell
        try {
            await api.addProposalLayer(selectedProposta.id, initialLayer);

            // 5. Start Background Geocoding
            startBackgroundGeocoding(newLayerId, excelData, selectedAddressCols, selectedNameCol);

        } catch (e) {
            console.error("Failed to create layer", e);
            alert('Erro ao criar camada.');
            removeLayer(newLayerId);
        }
    };

    const resetState = () => {
        setStep('upload');
        setSelectedFile(null);
        setExcelData([]);
        setHeaders([]);
        setSelectedAddressCols([]);
        setSelectedNameCol('');
        setIsTableOpen(false);
        setViewingLayerId(null);
    };

    const getRandomColor = () => {
        const colors = PRESET_COLORS;
        return colors[Math.floor(Math.random() * colors.length)];
    };

    // --- LAYER ACTIONS ---

    const handleOpenTable = (layerId: string) => {
        const layer = customLayers.find(l => l.id === layerId);
        if (!layer || !layer.data) return;
        setViewingLayerId(layerId);
        setIsTableOpen(true);
    };

    const handleRenameLayer = (layerId: string, currentName: string) => {
        setRenamingLayerId(layerId);
        setTempLayerName(currentName);
    };

    const saveLayerName = async () => {
        if (renamingLayerId && tempLayerName.trim()) {
            updateLayerData(renamingLayerId, { name: tempLayerName });
            if (selectedProposta?.id) {
                api.updateProposalLayer(selectedProposta.id, renamingLayerId, { name: tempLayerName }).catch(console.error);
            }
        }
        setRenamingLayerId(null);
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
        if (!confirm('Tem certeza que deseja excluir esta camada?')) return;
        removeLayer(layerId);
        if (selectedProposta?.id) {
            api.deleteProposalLayer(selectedProposta.id, layerId).catch(console.error);
        }
        if (viewingLayerId === layerId) setIsTableOpen(false);
    };

    // --- TABLE EDITING LOGIC ---

    const handleCellChange = async (rowIndex: number, col: string, newValue: string) => {
        // Only allow editing actual layers, not preview
        if (!viewingLayerId || viewingLayerId === 'preview') return;

        const layer = customLayers.find(l => l.id === viewingLayerId);
        if (!layer || !layer.data) return;

        // 1. Update Data in Memory
        const newData = [...layer.data];
        const oldRow = newData[rowIndex]; // Keep reference to old row for matching
        newData[rowIndex] = { ...newData[rowIndex], [col]: newValue };

        updateLayerData(viewingLayerId, { data: newData });

        // 2. Check if we need to re-geocode
        const config = layer.config || layerConfigs[viewingLayerId];
        if (config && (config.addressCols.includes(col) || col === config.nameCol)) {
            // It affects address or name -> Geocode Row
            const row = newData[rowIndex];
            const addressParts = config.addressCols.map(c => row[c]).filter(Boolean);
            const address = addressParts.join(', ');
            const title = config.nameCol ? row[config.nameCol] : address;

            if (address) {
                // Remove old marker for this "line" (Logic gap: we don't track which marker corresponds to which row index easily unless we map them.
                // Simplified approach: Re-geocode and ADD.

                const geocoder = new google.maps.Geocoder();
                try {
                    const results = await geocoder.geocode({ address });
                    if (results && results.results[0]) {
                        const location = results.results[0].geometry.location;
                        const rowId = row._id;

                        // Find existing marker linked to this row
                        let existingMarkerIndex = layer.markers.findIndex(m => m.rowId === rowId);

                        // Fallback: If not found by ID (legacy data), try matching by previous title/address
                        if (existingMarkerIndex === -1) {
                            const oldAddressParts = config.addressCols.map(c => oldRow[c]).filter(Boolean);
                            const oldAddress = oldAddressParts.join(', ');
                            const oldTitle = config.nameCol ? oldRow[config.nameCol] : oldAddress;

                            existingMarkerIndex = layer.markers.findIndex(m => m.title === oldTitle || m.description === oldAddress);
                        }

                        const newMarker: CustomMarker = {
                            id: existingMarkerIndex >= 0 ? layer.markers[existingMarkerIndex].id : uuidv4(),
                            lat: location.lat(),
                            lng: location.lng(),
                            title: title,
                            description: address,
                            rowId: rowId // Determine RowID linkage permanently now
                        };

                        let newMarkers = [...layer.markers];
                        if (existingMarkerIndex >= 0) {
                            // Update existing
                            newMarkers[existingMarkerIndex] = newMarker;
                        } else {
                            // Append new
                            newMarkers.push(newMarker);
                        }

                        updateLayerData(viewingLayerId, { markers: newMarkers });

                        // Update Backend
                        api.updateProposalLayer(selectedProposta!.id, viewingLayerId, {
                            data: newData,
                            markers: newMarkers
                        });
                    }
                } catch (e) {
                    console.error("Geocode failed", e);
                }
            }
        } else {
            // Just save data change
            if (selectedProposta?.id) {
                api.updateProposalLayer(selectedProposta.id, viewingLayerId, { data: newData }).catch(console.error);
            }
        }
    };

    if (!selectedProposta) return null;

    // Determine current table data
    const activeLayer = viewingLayerId === 'preview'
        ? { name: 'Pré-visualização', data: excelData, headers }
        : customLayers.find(l => l.id === viewingLayerId);

    // Fallback for missing headers (persistence issue fix)
    if (activeLayer && !activeLayer.headers && activeLayer.data && activeLayer.data.length > 0) {
        // @ts-ignore
        activeLayer.headers = Object.keys(activeLayer.data[0]);
    }

    return (
        <>
            {/* --- LAYERS BUTTON & DRAWER --- */}
            <div className="absolute top-20 left-4 z-10 font-sans">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-white p-3 rounded-xl shadow-emidias-md hover:bg-gray-50 transition-colors group border border-gray-100"
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
                    <div className="absolute top-14 left-0 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-emidias-2xl border border-white/20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white/50">
                            <h3 className="font-semibold text-emidias-primary flex items-center gap-2">
                                <Layers size={18} className="text-emidias-accent" />
                                Minhas Camadas
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full">
                                <X size={16} />
                            </Button>
                        </div>

                        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                            {/* UPLOAD / WIZARD STEPS */}
                            {step === 'upload' && (
                                <>
                                    <div className="space-y-2">
                                        {/* Header removed as it's redundant inside "Minhas Camadas" logic if empty */}
                                        {customLayers.length === 0 && (
                                            <div className="text-center py-8 text-gray-400 text-sm italic">
                                                Nenhuma camada adicionada.
                                            </div>
                                        )}
                                        {customLayers.map(layer => {
                                            const progress = processingStatus[layer.id];
                                            return (
                                                <div key={layer.id} className="relative flex flex-col p-3 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-sm transition-all group">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                            <button
                                                                onClick={() => setActiveColorPicker(activeColorPicker === layer.id ? null : layer.id)}
                                                                className="w-4 h-4 rounded-full flex-shrink-0 border border-black/10 hover:scale-110 transition-transform shadow-sm"
                                                                style={{ backgroundColor: layer.color }}
                                                                title="Mudar cor"
                                                            />

                                                            {/* Renaming Input */}
                                                            {renamingLayerId === layer.id ? (
                                                                <input
                                                                    autoFocus
                                                                    value={tempLayerName}
                                                                    onChange={(e) => setTempLayerName(e.target.value)}
                                                                    onBlur={saveLayerName}
                                                                    onKeyDown={(e) => e.key === 'Enter' && saveLayerName()}
                                                                    className="text-sm font-medium text-gray-700 bg-white border border-emidias-primary/30 rounded px-1.5 py-0.5 min-w-0 w-full outline-none ring-1 ring-emidias-primary"
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="min-w-0 flex-1 cursor-pointer"
                                                                    onDoubleClick={() => handleRenameLayer(layer.id, layer.name)}
                                                                    title="Clique duplo para renomear"
                                                                >
                                                                    <p className="text-sm font-medium text-gray-700 truncate">{layer.name}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-1">
                                                            {progress ? (
                                                                <Loader2 size={14} className="animate-spin text-emidias-accent" />
                                                            ) : (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleToggleVisibility(layer.id, layer.visible)}
                                                                        className="h-7 w-7 text-gray-400 hover:text-emidias-primary"
                                                                    >
                                                                        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleOpenTable(layer.id)}
                                                                        className="h-7 w-7 text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                                                                        title="Abrir Tabela"
                                                                    >
                                                                        <TableIcon size={14} />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleRemoveLayer(layer.id)}
                                                                        className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Color Picker */}
                                                    {activeColorPicker === layer.id && (
                                                        <div className="absolute top-10 left-0 z-20 bg-white p-3 rounded-xl shadow-xl border border-gray-200 grid grid-cols-5 gap-2 animate-in zoom-in-95 duration-200">
                                                            {PRESET_COLORS.map(color => (
                                                                <button
                                                                    key={color}
                                                                    className="w-6 h-6 rounded-full hover:scale-110 transition-transform border border-black/10 shadow-sm"
                                                                    style={{ backgroundColor: color }}
                                                                    onClick={() => handleColorChange(layer.id, color)}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Progress Bar */}
                                                    {progress && (
                                                        <div className="mt-2 w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                                                            <div
                                                                className="bg-emidias-accent h-full transition-all duration-300"
                                                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* ADD BUTTON (Bottom) */}
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <div {...getRootProps()}>
                                            <input {...getInputProps()} />
                                            <Button
                                                variant="outline"
                                                className="w-full border-dashed border-gray-300 hover:border-emidias-accent hover:text-emidias-accent hover:bg-emidias-accent/5 backdrop-blur-none"
                                            >
                                                <Upload size={16} className="mr-2" />
                                                Adicionar Nova Camada
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* WIZARD: ADDRESS & NAME SELECTION */}
                            {step === 'address' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-start gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <MapPin className="text-blue-600" size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-blue-900">Localização</h4>
                                            <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">Selecione as colunas que compõem o endereço (ex: Rua, Cidade, Numero).</p>
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-gray-50/50">
                                        {headers.map(header => (
                                            <div
                                                key={header}
                                                className={cn(
                                                    "p-3 flex items-center cursor-pointer transition-colors hover:bg-white",
                                                    selectedAddressCols.includes(header) && "bg-blue-50/50"
                                                )}
                                                onClick={() => toggleAddressCol(header)}
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 rounded border flex items-center justify-center mr-3 transition-all",
                                                    selectedAddressCols.includes(header) ? "bg-blue-500 border-blue-500" : "border-gray-300 bg-white"
                                                )}>
                                                    {selectedAddressCols.includes(header) && <Check size={12} className="text-white" />}
                                                </div>
                                                <span className="text-sm text-gray-700 font-medium">{header}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="ghost" size="sm" onClick={resetState} className="flex-1">
                                            Cancelar
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => setStep('name')}
                                            disabled={selectedAddressCols.length === 0}
                                            className="flex-1"
                                            rightIcon={<ChevronRight size={16} />}
                                        >
                                            Próximo
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 'name' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-start gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                                        <div className="p-2 bg-indigo-100 rounded-lg">
                                            <FileSpreadsheet className="text-indigo-600" size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-indigo-900">Identificação</h4>
                                            <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">Selecione a coluna que contém o nome do local.</p>
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-gray-50/50">
                                        {headers.map(header => (
                                            <div
                                                key={header}
                                                className={cn(
                                                    "p-3 flex items-center cursor-pointer transition-colors hover:bg-white",
                                                    selectedNameCol === header && "bg-indigo-50/50"
                                                )}
                                                onClick={() => setSelectedNameCol(header)}
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full border flex items-center justify-center mr-3 transition-all",
                                                    selectedNameCol === header ? "border-indigo-500" : "border-gray-300 bg-white"
                                                )}>
                                                    {selectedNameCol === header && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                                                </div>
                                                <span className="text-sm text-gray-700 font-medium">{header}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="ghost" size="sm" onClick={() => setStep('address')} className="flex-1">
                                            Voltar
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleCreateLayer}
                                            disabled={!selectedNameCol}
                                            className="flex-1"
                                            rightIcon={<Check size={16} />}
                                        >
                                            Concluir
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div >
                )
                }
            </div >

            {/* --- TABLE WINDOW (FLOATING) --- */}
            {
                isTableOpen && activeLayer && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-[900px] max-w-[90vw] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gray-50/80 border-b border-gray-100 rounded-t-2xl cursor-move backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                                    <TableIcon size={20} className="text-emidias-accent" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg tracking-tight">{activeLayer.name}</h3>
                                    <p className="text-xs text-gray-500 font-medium">{activeLayer.data?.length || 0} registros encontrados</p>
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => setIsTableOpen(false)} className="rounded-full hover:bg-red-50 hover:text-red-500">
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Table Content */}
                        <div className="flex-1 overflow-auto custom-scrollbar p-1">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="sticky top-0 bg-white shadow-sm z-10 text-xs uppercase tracking-wider text-gray-500 font-bold">
                                    <tr>
                                        {activeLayer.headers?.map(header => (
                                            <th key={header} className="px-6 py-3 border-b border-gray-100 whitespace-nowrap bg-gray-50/50">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {activeLayer.data?.slice(0, 500).map((row, i) => (
                                        <tr key={i} className="hover:bg-blue-50/30 group transition-colors odd:bg-gray-50/30">
                                            {activeLayer.headers?.map(header => (
                                                <td key={header} className="p-0 border-r border-transparent min-w-[150px]">
                                                    {viewingLayerId === 'preview' ? (
                                                        <div className="px-6 py-3 truncate text-gray-700">{row[header]}</div>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            defaultValue={row[header]}
                                                            onBlur={(e) => handleCellChange(i, header, e.target.value)}
                                                            className="w-full px-6 py-3 bg-transparent focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none truncate text-gray-700 placeholder-transparent transition-all"
                                                        />
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {activeLayer.data && activeLayer.data.length > 500 && (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    <p>Renderizando apenas as primeiras 500 linhas para performance.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions (Only for Wizard) */}
                        {step === 'table-preview' && (
                            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-between items-center">
                                <p className="text-sm text-gray-500 font-medium">Verifique se os dados estão corretos antes de continuar.</p>
                                <Button
                                    onClick={handleContinueFromTable}
                                    rightIcon={<ChevronRight size={18} />}
                                >
                                    Configurar Geocodificação
                                </Button>
                            </div>
                        )}
                    </div>
                )
            }
        </>
    );
}
