import { useState, useEffect } from 'react';
import { Search, MapPin, FileText, Users, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface SearchResult {
    id: string | number;
    type: 'proposta' | 'cliente' | 'ponto';
    title: string;
    subtitle?: string;
    icon: any;
    action: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const router = useRouter();
    const { setCurrentView, setSelectedProposta } = useStore();

    // Mock search logic - replace with API call
    useEffect(() => {
        if (!searchTerm) {
            setResults([]);
            return;
        }

        const mockResults: SearchResult[] = [
            {
                id: 1,
                type: 'proposta',
                title: 'Campanha Verão 2024',
                subtitle: 'Coca-Cola • R$ 150.000',
                icon: FileText,
                action: () => {
                    // setSelectedProposta(id... fetch real obj)
                    router.push('/?id=1'); // classic navigation
                    onClose();
                }
            },
            {
                id: 2,
                type: 'cliente',
                title: 'Coca-Cola Brasil',
                subtitle: 'Cliente Ouro',
                icon: Users,
                action: () => {
                    setCurrentView('clientes');
                    onClose();
                }
            },
            {
                id: 3,
                type: 'ponto',
                title: 'Av. Paulista, 1000',
                subtitle: 'Painel Digital • São Paulo, SP',
                icon: MapPin,
                action: () => {
                    setCurrentView('map');
                    // navigate to map loc
                    onClose();
                }
            }
        ];

        setResults(mockResults.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase())));
    }, [searchTerm]);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (!isOpen) onClose(); // Actually this toggles elsewhere, checking here logic
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center border-b border-gray-100 p-4">
                    <Search className="text-gray-400 mr-3" size={20} />
                    <input
                        autoFocus
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar propostas, clientes, pontos..."
                        className="flex-1 text-lg outline-none placeholder:text-gray-400 text-gray-900"
                    />
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">ESC</span>
                        <span>para fechar</span>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {/* Categories */}
                    {results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((result, idx) => {
                                const Icon = result.icon;
                                return (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        onClick={result.action}
                                        className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 group transition-colors text-left"
                                    >
                                        <div className={`p-2 rounded-lg mr-4 ${result.type === 'proposta' ? 'bg-blue-50 text-blue-600' :
                                                result.type === 'cliente' ? 'bg-green-50 text-green-600' :
                                                    'bg-purple-50 text-purple-600'
                                            }`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 group-hover:text-emidias-primary transition-colors">
                                                {result.title}
                                            </h4>
                                            {result.subtitle && (
                                                <p className="text-sm text-gray-500">{result.subtitle}</p>
                                            )}
                                        </div>
                                        <CornerDownLeft size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                );
                            })}
                        </div>
                    ) : searchTerm ? (
                        <div className="p-8 text-center text-gray-500">
                            Nenhum resultado encontrado para "{searchTerm}"
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            Digite para buscar em todo o sistema
                        </div>
                    )}
                </div>

                {/* Footer Hints */}
                <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="font-bold">↑↓</span> navegar</span>
                    <span className="flex items-center gap-1"><span className="font-bold">↵</span> selecionar</span>
                </div>
            </div>
        </div>
    );
}
