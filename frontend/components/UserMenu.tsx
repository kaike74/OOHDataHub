import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { User, LogOut, Users, Settings, ChevronRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserProfile from './UserProfile';
import TeamManagement from './TeamManagement';

export default function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'account' | 'team'>('account');
    const menuRef = useRef<HTMLDivElement>(null);
    const user = useStore((state) => state.user);
    const router = useRouter();

    const toggleMenu = () => setIsOpen(!isOpen);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleLogout = () => {
        localStorage.removeItem('ooh-auth-storage');
        window.location.href = '/login';
    };

    if (!user) return null;

    // Get initials
    const initials = user.name
        ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'U';

    return (
        <div className="relative z-50" ref={menuRef}>
            {/* Trigger Avatar */}
            <button
                onClick={toggleMenu}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-emidias-primary to-emidias-primary/80 text-white flex items-center justify-center text-sm font-bold shadow-md hover:shadow-lg transition-all ring-2 ring-white cursor-pointer"
            >
                {initials}
            </button>

            {/* Menu Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">

                    {/* Header */}
                    <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emidias-primary/10 text-emidias-primary flex items-center justify-center text-lg font-bold">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-gray-900 font-bold truncate">{user.name}</h3>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                                {user.type === 'internal' ? 'Interno' : 'Externo'} • {user.role === 'master' ? 'Master' : user.role === 'admin' ? 'Editor' : 'Visualizador'}
                            </span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 p-1">
                        <button
                            onClick={() => setActiveTab('account')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'account'
                                    ? 'bg-white text-emidias-primary shadow-sm border border-gray-100'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <User size={16} />
                            Minha Conta
                        </button>
                        <button
                            onClick={() => setActiveTab('team')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'team'
                                    ? 'bg-white text-emidias-primary shadow-sm border border-gray-100'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <Users size={16} />
                            Colaboradores
                        </button>
                    </div>

                    {/* Content */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {activeTab === 'account' && <UserProfile user={user} />}
                        {activeTab === 'team' && <TeamManagement user={user} />}
                    </div>

                    {/* Footer */}
                    <div className="p-2 border-t border-gray-100 bg-gray-50/30">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 p-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut size={16} />
                            Sair da conta
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
