import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning'; // error = red (blocks), warning = yellow (doesn't block)
}

export interface BulkPoint {
    // Mapped data from Excel
    codigo_ooh: string;
    endereco: string;
    latitude: number | null;
    longitude: number | null;
    cidade?: string;
    uf?: string;
    pais?: string;
    medidas?: string;
    fluxo?: number;
    tipos?: string; // comma-separated
    observacoes?: string;
    ponto_referencia?: string;

    // Products/Costs
    produtos?: Array<{
        tipo: string; // "Locação", "Papel", "Lona"
        valor: number;
        periodo?: string; // "bissemanal" or "mensal" (only for Locação)
    }>;

    // Images (stored in memory until final save)
    imagens?: Array<{
        file: File;
        preview: string; // base64 or blob URL
        ordem: number;
        eh_capa: boolean;
    }>;

    // Validation status
    validationStatus: 'valid' | 'warning' | 'error';
    validationErrors: ValidationError[];
    skipImport?: boolean; // User can mark error rows to skip
}

export interface BulkImportSession {
    sessionId: string;
    idExibidora: number;
    exibidoraNome: string;
    createdAt: string;
    currentStep: 1 | 2 | 3 | 4 | 5;
    currentPointIndex: number;

    // Excel data
    excelData: any[][]; // Normalized rows from Excel
    originalExcelData: any[][]; // Original raw rows (before normalization)
    columnHeaders: string[]; // First row headers
    columnMapping: Record<string, string>; // { "A": "codigo_ooh", "B": "endereco", ... }

    // Cell corrections tracking: "rowIndex-colIndex" -> { original, corrected, field }
    cellCorrections: Record<string, { original: any; corrected: any; field: string }>;

    // Parsed points
    pontos: BulkPoint[];

    // Saved point IDs (for resume functionality)
    pontosSalvos: number[];
}


interface BulkImportState {
    // Current session
    session: BulkImportSession | null;

    // UI state
    isModalOpen: boolean;

    // Actions
    startImport: (idExibidora: number, exibidoraNome: string) => void;
    setModalOpen: (open: boolean) => void;
    setExcelData: (columnHeaders: string[], data: any[][]) => void;
    setColumnMapping: (mapping: Record<string, string>) => void;
    setCurrentStep: (step: 1 | 2 | 3 | 4 | 5) => void;
    setPontos: (pontos: BulkPoint[]) => void;
    updatePoint: (index: number, data: Partial<BulkPoint>) => void;
    updateCellValue: (rowIndex: number, colIndex: number, value: any) => void;
    navigateToPoint: (index: number) => void;
    toggleSkipImport: (index: number) => void;
    addPointImage: (pointIndex: number, file: File, preview: string) => void;
    removePointImage: (pointIndex: number, imageIndex: number) => void;
    clearSession: () => void;
    resumeSession: () => boolean; // Returns true if session was resumed
}

// Helper: Generate UUID
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// Helper: Check if session is expired (>24h)
function isSessionExpired(createdAt: string): boolean {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 24;
}

export const useBulkImportStore = create<BulkImportState>()(
    persist(
        (set, get) => ({
            session: null,
            isModalOpen: false,

            startImport: (idExibidora, exibidoraNome) => {
                const sessionId = generateUUID();
                const newSession: BulkImportSession = {
                    sessionId,
                    idExibidora,
                    exibidoraNome,
                    createdAt: new Date().toISOString(),
                    currentStep: 1,
                    currentPointIndex: 0,
                    excelData: [],
                    originalExcelData: [],
                    columnHeaders: [],
                    columnMapping: {},
                    cellCorrections: {},
                    pontos: [],
                    pontosSalvos: [],
                };

                set({ session: newSession, isModalOpen: true });
            },

            setModalOpen: (open) => {
                set({ isModalOpen: open });
                // If closing modal, don't clear session (for "continue where you left off")
            },

            setExcelData: (columnHeaders, data) => {
                const { session } = get();
                if (!session) return;

                set({
                    session: {
                        ...session,
                        excelData: data,
                        columnHeaders: columnHeaders,
                    },
                });
            },

            updateCellValue: (rowIndex, colIndex, value) => {
                const { session } = get();
                if (!session) return;

                const updatedData = [...session.excelData];
                if (!updatedData[rowIndex]) return;

                updatedData[rowIndex] = [...updatedData[rowIndex]];
                updatedData[rowIndex][colIndex] = value;

                set({
                    session: {
                        ...session,
                        excelData: updatedData,
                    },
                });
            },

            setColumnMapping: (mapping) => {
                const { session } = get();
                if (!session) return;

                set({
                    session: {
                        ...session,
                        columnMapping: mapping,
                    },
                });
            },

            setCurrentStep: (step) => {
                const { session } = get();
                if (!session) return;

                set({
                    session: {
                        ...session,
                        currentStep: step,
                    },
                });
            },

            setPontos: (pontos) => {
                const { session } = get();
                if (!session) return;

                set({
                    session: {
                        ...session,
                        pontos,
                    },
                });
            },

            updatePoint: (index, data) => {
                const { session } = get();
                if (!session) return;

                const updatedPontos = [...session.pontos];
                updatedPontos[index] = {
                    ...updatedPontos[index],
                    ...data,
                };

                set({
                    session: {
                        ...session,
                        pontos: updatedPontos,
                    },
                });
            },

            navigateToPoint: (index) => {
                const { session } = get();
                if (!session) return;

                set({
                    session: {
                        ...session,
                        currentPointIndex: index,
                    },
                });
            },

            toggleSkipImport: (index) => {
                const { session } = get();
                if (!session) return;

                const updatedPontos = [...session.pontos];
                updatedPontos[index] = {
                    ...updatedPontos[index],
                    skipImport: !updatedPontos[index].skipImport,
                };

                set({
                    session: {
                        ...session,
                        pontos: updatedPontos,
                    },
                });
            },

            addPointImage: (pointIndex, file, preview) => {
                const { session } = get();
                if (!session) return;

                const updatedPontos = [...session.pontos];
                const point = updatedPontos[pointIndex];
                const currentImages = point.imagens || [];

                updatedPontos[pointIndex] = {
                    ...point,
                    imagens: [
                        ...currentImages,
                        {
                            file,
                            preview,
                            ordem: currentImages.length,
                            eh_capa: currentImages.length === 0, // First image is cover
                        },
                    ],
                };

                set({
                    session: {
                        ...session,
                        pontos: updatedPontos,
                    },
                });
            },

            removePointImage: (pointIndex, imageIndex) => {
                const { session } = get();
                if (!session) return;

                const updatedPontos = [...session.pontos];
                const point = updatedPontos[pointIndex];
                const updatedImages = (point.imagens || []).filter((_, i) => i !== imageIndex);

                // Reorder and reassign cover if needed
                const reorderedImages = updatedImages.map((img, i) => ({
                    ...img,
                    ordem: i,
                    eh_capa: i === 0,
                }));

                updatedPontos[pointIndex] = {
                    ...point,
                    imagens: reorderedImages,
                };

                set({
                    session: {
                        ...session,
                        pontos: updatedPontos,
                    },
                });
            },

            clearSession: () => {
                set({ session: null, isModalOpen: false });
            },

            resumeSession: () => {
                const { session } = get();

                // Check if there's a session and it's not expired
                if (session && !isSessionExpired(session.createdAt)) {
                    set({ isModalOpen: true });
                    return true;
                }

                // If expired, clear it
                if (session && isSessionExpired(session.createdAt)) {
                    set({ session: null });
                }

                return false;
            },
        }),
        {
            name: 'ooh-bulk-import-storage',
            partialize: (state) => ({
                session: state.session, // Persist session only
            }),
        }
    )
);
