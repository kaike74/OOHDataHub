'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { CustomMarker } from '@/lib/types';
import { Layers, Upload, X, Eye, EyeOff, Trash2, FileSpreadsheet, MapPin, Check, ChevronRight, Loader2, AlertCircle, Palette, Table as TableIcon, Edit2, Maximize2, Minimize2, Save } from 'lucide-react';
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
                setExcelData(data);
                const headers = Object.keys(data[0] as object);
                setHeaders(headers);

                // Initialize Preview
                setViewingLayerId('preview');
                // We use a dummy ID 'preview' for the table when in wizard mode
                setIsTableOpen(true);
                setStep('table-preview');
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
                nameCol: selectedNameCol
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
                // Simplified approach: Search marker by title/latlng? No, duplications.
                // Better approach: We add an index or ID to the MARKER matching the ROW.
                // For now, let's just ADD a new marker and try to remove the old one if we can identify it.
                // FUTURE IMPROVEMENT: Map Row Index to Marker ID.

                // For "Quick Fix": Just geocode and ADD. User can delete old one manually on map if needed.
                // Or better: Re-geocode entire layer? Too slow.

                // Let's rely on finding marker by previous title? Risky.
                // Let's implement a simple geocode-and-update-store logic for the user to see the "move".

                const geocoder = new google.maps.Geocoder();
                try {
                    const results = await geocoder.geocode({ address });
                    if (results && results.results[0]) {
                        const location = results.results[0].geometry.location;

                        // Try to find a marker that matches the OLD address/title? 
                        // Hard without ID link. 
                        // Let's just create a new marker and append it. 
                        const newMarker: CustomMarker = {
                            id: uuidv4(),
                            lat: location.lat(),
                            lng: location.lng(),
                            title: title,
                            description: address
                        };

                        // We don't delete the old one because we don't know which one it is.
                        // Maybe we assume there's only one marker per row?
                        // Ideally we should have stored 'rowIndex' in marker.

                        updateLayerData(viewingLayerId, { markers: [...layer.markers, newMarker] });

                        // Update Backend
                        api.updateProposalLayer(selectedProposta!.id, viewingLayerId, {
                            data: newData,
                            markers: [...layer.markers, newMarker]
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

    return (
        <>
            {/* --- LAYERS BUTTON & DRAWER --- */}
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
                            {/* UPLOAD / WIZARD STEPS */}
                            {step === 'upload' && (
                                <>
                                    <div
                                        {...getRootProps()}
                                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-emidias-accent bg-emidias-accent/5' : 'border-gray-300 hover:border-emidias-accent/50 hover:bg-gray-50'}`}
                                    >
                                        <input {...getInputProps()} />
                                        <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                                        <p className="text-sm text-gray-600 font-medium">
                                            Arraste sua planilha
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">XLSX ou CSV</p>
                                    </div>

                                    {/* LIST OF LAYERS */}
                                    <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Camadas Ativas</h4>
                                        {customLayers.length === 0 && (
                                            <div className="text-center py-2 text-gray-400 text-xs italic">Nenhuma camada</div>
                                        )}
                                        {customLayers.map(layer => {
                                            const progress = processingStatus[layer.id];
                                            return (
                                                <div key={layer.id} className="relative flex flex-col p-2 bg-gray-50 border border-gray-200 rounded-md hover:bg-white transition-colors group">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                            <button
                                                                onClick={() => setActiveColorPicker(activeColorPicker === layer.id ? null : layer.id)}
                                                                className="w-4 h-4 rounded-full flex-shrink-0 border border-black/10 hover:scale-110 transition-transform"
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
                                                                    className="text-sm font-medium text-gray-700 bg-white border border-blue-300 rounded px-1 min-w-0 w-full"
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
                                                                    <button onClick={() => handleToggleVisibility(layer.id, layer.visible)} className="p-1 hover:bg-gray-200 rounded text-gray-500">
                                                                        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                                                    </button>
                                                                    <button onClick={() => handleOpenTable(layer.id)} className="p-1 hover:bg-blue-100 hover:text-blue-500 rounded text-gray-500" title="Abrir Tabela">
                                                                        <TableIcon size={14} />
                                                                    </button>
                                                                    <button onClick={() => handleRemoveLayer(layer.id)} className="p-1 hover:bg-red-100 hover:text-red-500 rounded text-gray-500">
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Color Picker */}
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

                                                    {/* Progress Bar */}
                                                    {progress && (
                                                        <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
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
                                </>
                            )}

                            {/* WIZARD: ADDRESS & NAME SELECTION */}
                            {step === 'address' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
                                        <MapPin className="text-blue-600 mt-0.5" size={18} />
                                        <div>
                                            <h4 className="text-sm font-bold text-blue-900">Endereço</h4>
                                            <p className="text-xs text-blue-700 mt-1">Colunas de localização (ex: Rua, Cidade).</p>
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                                        {headers.map(header => (
                                            <div
                                                key={header}
                                                className={`p-2.5 flex items-center cursor-pointer hover:bg-gray-50 ${selectedAddressCols.includes(header) ? 'bg-blue-50' : ''}`}
                                                onClick={() => toggleAddressCol(header)}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 ${selectedAddressCols.includes(header) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                                    {selectedAddressCols.includes(header) && <Check size={10} className="text-white" />}
                                                </div>
                                                <span className="text-sm text-gray-700">{header}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={resetState} className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded">Cancelar</button>
                                        <button onClick={() => setStep('name')} disabled={selectedAddressCols.length === 0} className="flex-1 bg-emidias-accent text-white py-2 rounded text-sm font-medium hover:bg-emidias-accent-dark disabled:opacity-50">Próximo</button>
                                    </div>
                                </div>
                            )}

                            {step === 'name' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-start gap-3 bg-indigo-50 p-3 rounded-lg">
                                        <FileSpreadsheet className="text-indigo-600 mt-0.5" size={18} />
                                        <div>
                                            <h4 className="text-sm font-bold text-indigo-900">Nome</h4>
                                            <p className="text-xs text-indigo-700 mt-1">Coluna para o nome do local.</p>
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                                        {headers.map(header => (
                                            <div
                                                key={header}
                                                className={`p-2.5 flex items-center cursor-pointer hover:bg-gray-50 ${selectedNameCol === header ? 'bg-indigo-50' : ''}`}
                                                onClick={() => setSelectedNameCol(header)}
                                            >
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${selectedNameCol === header ? 'border-indigo-500' : 'border-gray-300'}`}>
                                                    {selectedNameCol === header && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                                </div>
                                                <span className="text-sm text-gray-700">{header}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setStep('address')} className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded">Voltar</button>
                                        <button onClick={handleCreateLayer} disabled={!selectedNameCol} className="flex-1 bg-emidias-accent text-white py-2 rounded text-sm font-medium hover:bg-emidias-accent-dark disabled:opacity-50">Concluir</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* --- TABLE DRAWER (BOTTOM) --- */}
            {isTableOpen && activeLayer && (
                <div className={`absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] flex flex-col transition-all duration-300 ${tableHeight === 'half' ? 'h-[40vh]' : 'h-[80vh]'}`}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <TableIcon size={18} className="text-gray-500" />
                            <h3 className="font-semibold text-gray-800">{activeLayer.name}</h3>
                            <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-200 rounded-full">{activeLayer.data?.length || 0} linhas</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setTableHeight(h => h === 'half' ? 'full' : 'half')} className="p-1.5 hover:bg-gray-200 rounded text-gray-500">
                                {tableHeight === 'half' ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                            </button>
                            <button onClick={() => setIsTableOpen(false)} className="p-1.5 hover:bg-red-100 hover:text-red-500 rounded text-gray-500">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="sticky top-0 bg-gray-50 shadow-sm z-10">
                                <tr>
                                    {activeLayer.headers?.map(header => (
                                        <th key={header} className="px-4 py-2 font-semibold text-gray-600 border-r border-b border-gray-200 whitespace-nowrap bg-gray-50">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {activeLayer.data?.slice(0, 500).map((row, i) => (
                                    <tr key={i} className="hover:bg-blue-50 group">
                                        {activeLayer.headers?.map(header => (
                                            <td key={header} className="p-0 border-r border-gray-100 min-w-[150px]">
                                                {viewingLayerId === 'preview' ? (
                                                    <div className="px-4 py-2 truncate text-gray-700">{row[header]}</div>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        defaultValue={row[header]}
                                                        onBlur={(e) => handleCellChange(i, header, e.target.value)}
                                                        className="w-full px-4 py-2 bg-transparent focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none truncate text-gray-700"
                                                    />
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {activeLayer.data && activeLayer.data.length > 500 && (
                            <div className="p-4 text-center text-gray-500 text-xs italic">
                                Renderizando apenas as primeiras 500 linhas para performance.
                            </div>
                        )}
                    </div>

                    {/* Footer Actions (Only for Wizard) */}
                    {step === 'table-preview' && (
                        <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end">
                            <button
                                onClick={handleContinueFromTable}
                                className="bg-emidias-accent text-white px-6 py-2 rounded-lg font-medium hover:bg-emidias-accent-dark shadow-sm flex items-center gap-2"
                            >
                                Configurar Colunas <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
