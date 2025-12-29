import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Loader2, Check } from 'lucide-react';

interface UserProfileProps {
    user: any;
}

export default function UserProfile({ user }: UserProfileProps) {
    const [name, setName] = useState(user.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSaveName = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await api.updateUser({ name });
            // Update local storage user state roughly or wait for reload?
            // Ideally useStore should update.
            const stored = JSON.parse(localStorage.getItem('ooh-auth-storage') || '{}');
            if (stored.state?.user) {
                stored.state.user.name = name;
                localStorage.setItem('ooh-auth-storage', JSON.stringify(stored));
                // Reload to reflect changes globally if no simpler way
                window.location.reload();
            }
            setMessage({ type: 'success', text: 'Nome atualizado com sucesso!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Erro ao atualizar nome' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        try {
            await api.changePassword(currentPassword, newPassword);
            setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            setCurrentPassword('');
            setNewPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Erro ao alterar senha' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 space-y-6">
            {/* Basic Info */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase">Dados Pessoais</label>

                <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <input
                        type="text"
                        value={user.email}
                        disabled
                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                    />
                </div>

                <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Nome</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-emidias-primary outline-none transition-all"
                        />
                        <Button
                            onClick={handleSaveName}
                            isLoading={isSaving}
                            disabled={name === user.name}
                            size="sm"
                            className="bg-emidias-primary"
                        >
                            Salvar
                        </Button>
                    </div>
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Password */}
            <form onSubmit={handleChangePassword} className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase">Alterar Senha</label>

                <input
                    type="password"
                    placeholder="Senha atual"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-emidias-primary outline-none transition-all"
                />

                <input
                    type="password"
                    placeholder="Nova senha (min. 6 caracteres)"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-emidias-primary outline-none transition-all"
                />

                <Button
                    type="submit"
                    isLoading={isSaving}
                    disabled={!currentPassword || !newPassword}
                    className="w-full bg-gray-900 text-white hover:bg-black"
                >
                    Atualizar Senha
                </Button>
            </form>

            {message && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.type === 'success' && <Check size={16} />}
                    {message.text}
                </div>
            )}
        </div>
    );
}
