'use client';

import { useAuth } from '@/lib/auth-context';
import { LogOut, Settings, User, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function UserMenu() {
    const { user, logout, isMaster } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <div className="relative" ref={menuRef}>
            {/* User Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                {/* Avatar */}
                {user.picture ? (
                    <img
                        src={user.picture}
                        alt={user.name || user.email}
                        className="w-8 h-8 rounded-full"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-emidias-primary flex items-center justify-center">
                        <User size={18} className="text-white" />
                    </div>
                )}

                {/* User Name */}
                <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-900">
                        {user.name || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500">
                        {isMaster() ? 'Master' : 'Visualizador'}
                    </p>
                </div>

                <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emidias-primary/10 text-emidias-primary">
                            {isMaster() ? 'Master' : 'Visualizador'}
                        </span>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                // TODO: Navigate to settings
                                alert('Página de configurações em desenvolvimento');
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Settings size={16} />
                            Configurações
                        </button>

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                logout();
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                            <LogOut size={16} />
                            Sair
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
