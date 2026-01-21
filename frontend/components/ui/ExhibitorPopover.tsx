import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/lib/store';
import { Building2, Phone, Mail, Filter, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ExhibitorPopoverProps {
    exhibitorId: number;
    exhibitorName: string;
    children: React.ReactNode;
    className?: string;
    onFilter?: (exhibitorId: number) => void;
}

export function ExhibitorPopover({ exhibitorId, exhibitorName, children, className, onFilter }: ExhibitorPopoverProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { exibidoras } = useStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Update position when opening
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY, // Just below the element
                left: rect.left + window.scrollX + (rect.width / 2) // Center horizontally
            });
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if click is on the trigger container
            if (containerRef.current && containerRef.current.contains(event.target as Node)) {
                return;
            }
            // Check if click is on the portal content (we'll add an ID or class to check)
            const portal = document.getElementById(`popover-${exhibitorId}`);
            if (portal && portal.contains(event.target as Node)) {
                return;
            }
            setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [exhibitorId]);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (!isOpen) {
            setIsOpen(true);
            if (!details) {
                loadDetails();
            }
        }
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 300); // delay close
    };

    const loadDetails = async () => {
        setLoading(true);
        try {
            // Fetch contacts
            const contacts = await api.getContatos(exhibitorId);
            setDetails({ contacts });
        } catch (error) {
            console.error('Failed to load exhibitor details', error);
        } finally {
            setLoading(false);
        }
    };

    const popoverContent = (
        <div
            id={`popover-${exhibitorId}`}
            className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-100 p-4 w-72 animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: `${position.top + 8}px`,
                left: `${position.left}px`,
                transform: 'translateX(-50%)'
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        <Building2 size={16} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm leading-tight">{exhibitorName}</h3>
                        <p className="text-[10px] text-gray-500">Parceiro OOH</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="py-2 text-center">
                    <p className="text-xs text-gray-400">Carregando...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {details?.contacts && details.contacts.length > 0 ? (
                        <div className="space-y-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contatos</p>
                            {details.contacts.slice(0, 2).map((c: any) => (
                                <div key={c.id} className="text-xs text-gray-600">
                                    <p className="font-semibold text-gray-800">{c.nome}</p>
                                    <div className="flex flex-col gap-0.5 mt-0.5 ml-1">
                                        {c.telefone && (
                                            <a href={`tel:${c.telefone}`} className="flex items-center gap-1.5 hover:text-plura-primary">
                                                <Phone size={10} /> {c.telefone}
                                            </a>
                                        )}
                                        {c.email && (
                                            <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-plura-primary">
                                                <Mail size={10} /> {c.email}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 italic text-center py-1">Sem contatos extras.</p>
                    )}

                    {onFilter && (
                        <div className="pt-2 border-t border-gray-100">
                            <Button
                                onClick={() => {
                                    onFilter(exhibitorId);
                                    setIsOpen(false);
                                }}
                                size="sm"
                                variant="outline"
                                className="w-full text-xs h-7"
                                leftIcon={<Filter size={12} />}
                            >
                                Filtrar no Mapa
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Arrow */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-2 border-4 border-transparent border-b-white" />
        </div>
    );

    return (
        <>
            <div
                ref={containerRef}
                className={cn("relative inline-block", className)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div
                    className="cursor-pointer hover:text-plura-accent transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                        if (!isOpen && !details) loadDetails();
                    }}
                >
                    {children}
                </div>
            </div>
            {isOpen && createPortal(popoverContent, document.body)}
        </>
    );
}
