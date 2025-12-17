'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { MessageSquare, Send, Paperclip, X, Minimize2, Maximize2, Loader2, FileText, MapPin } from 'lucide-react';
import * as XLSX from 'xlsx';
// We'll import pdfjs dynamically to avoid build issues

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: { name: string; type: string }[];
}

export default function AIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Olá! Sou seu assistente de planejamento OOH. Posso ajudar a encontrar pontos baseados em briefings ou listas de endereços. Como posso ajudar hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Context from store
    const customLayers = useStore(state => state.customLayers);
    const setFilters = useStore(state => state.setFilterCidade); // Example actions
    const setFilterUF = useStore(state => state.setFilterUF);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Prepare context
            const context = {
                customLayersSummary: customLayers.map(l => ({ name: l.name, count: l.markers.length })),
                // Add more context if needed, e.g. current viewport center
            };

            const response = await api.chatAI([...messages, userMessage], context);

            // Check for search intent
            if (response.intent === 'search' && response.search_params) {
                // Apply filters if present
                if (response.search_params.city) {
                    // This is a simplified filter application. 
                    // In a real app we might need to map "Sao Paulo" to "São Paulo" roughly or precise match
                    setFilters([response.search_params.city]);
                }
                if (response.search_params.uf) {
                    setFilterUF([response.search_params.uf]);
                }
                // Handle radius search manually or via store update if supported
            }

            setMessages(prev => [...prev, { role: 'assistant', content: response.reply || "Entendido." }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um erro ao processar sua solicitação.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        let textContent = '';

        try {
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                textContent = `[Arquivo Excel Anexado: ${file.name}]\nConteúdo (primeiras 50 linhas): ${JSON.stringify(jsonData.slice(0, 50))}`;
            } else if (file.name.endsWith('.pdf')) {
                // Dynamic import for PDF.js
                const pdfjs = await import('pdfjs-dist');
                // Set worker src - this is tricky in Next.js, often needs a public file or CDN
                pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';

                for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
                    const page = await pdf.getPage(i);
                    const textContentPage = await page.getTextContent();
                    const pageText = textContentPage.items.map((item: any) => item.str).join(' ');
                    fullText += `Página ${i}: ${pageText}\n`;
                }
                textContent = `[Arquivo PDF Anexado: ${file.name}]\nResumo do conteúdo: ${fullText}`;
            } else {
                textContent = `[Arquivo Anexado: ${file.name}] (Conteúdo não lido)`;
            }

            const userMessage: Message = {
                role: 'user',
                content: `Anexei este arquivo: ${textContent}. Por favor analise.`,
                attachments: [{ name: file.name, type: file.type }]
            };

            setMessages(prev => [...prev, userMessage]);

            // Auto-send or wait? Let's auto-send context to AI
            const context = { customLayersSummary: customLayers.map(l => ({ name: l.name, count: l.markers.length })) };
            const response = await api.chatAI([...messages, userMessage], context);
            setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);

        } catch (error) {
            console.error("Erro ao ler arquivo:", error);
            setMessages(prev => [...prev, { role: 'system', content: 'Erro ao ler o arquivo. Tente novamente ou verifique o formato.' }]);
        } finally {
            setIsLoading(false);
            // Reset input
            e.target.value = '';
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[60] p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 text-white flex items-center gap-2 group"
            >
                <div className="relative">
                    <MessageSquare size={24} />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                    </span>
                </div>
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap">
                    Assistente IA
                </span>
            </button>
        );
    }

    return (
        <div
            className={`fixed z-[60] bg-white shadow-2xl transition-all duration-300 flex flex-col border border-gray-200
                ${isMinimized
                    ? 'bottom-6 right-6 w-72 h-14 rounded-lg overflow-hidden cursor-pointer'
                    : 'bottom-6 right-6 w-96 h-[600px] rounded-2xl'
                }
            `}
            onClick={isMinimized ? () => setIsMinimized(false) : undefined}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white shrink-0">
                <div className="flex items-center gap-2 font-medium">
                    <MessageSquare size={18} />
                    <span>OOH Assistant</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                        className="p-1 hover:bg-white/20 rounded transition"
                    >
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        className="p-1 hover:bg-white/20 rounded transition"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : msg.role === 'system'
                                                ? 'bg-red-50 text-red-600 border border-red-100'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                        }`}
                                >
                                    {msg.attachments && (
                                        <div className="mb-2 space-y-1">
                                            {msg.attachments.map((att, i) => (
                                                <div key={i} className="flex items-center gap-1 bg-black/10 px-2 py-1 rounded text-xs truncate">
                                                    <Paperclip size={12} />
                                                    {att.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white rounded-2xl rounded-bl-none p-4 shadow-sm border border-gray-100">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                            <label className="p-2 text-gray-400 hover:text-blue-600 cursor-pointer transition rounded-lg hover:bg-gray-200 shrink-0">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.xlsx,.xls"
                                    onChange={handleFileUpload}
                                    disabled={isLoading}
                                />
                                <Paperclip size={20} />
                            </label>

                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Digite sua mensagem..."
                                className="w-full bg-transparent border-none focus:ring-0 text-sm max-h-32 min-h-[24px] resize-none py-2"
                                rows={1}
                                disabled={isLoading}
                            />

                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isLoading}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <div className="text-[10px] text-gray-400 text-center mt-2">
                            I.A. pode cometer erros. Verifique as informações importantes.
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
