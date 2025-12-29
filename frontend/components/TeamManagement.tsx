import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Users, Mail, Shield, ShieldAlert, BadgeCheck, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TeamManagementProps {
    user: any;
}

export default function TeamManagement({ user }: TeamManagementProps) {
    // 1. External User View (SaaS Wall)
    if (user.type !== 'internal') {
        return (
            <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20 transform -rotate-6">
                    <Sparkles className="text-white" size={32} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Faça Upgrade</h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                        Convide colaboradores para trabalharem no mesmo espaço de trabalho com o plano Pro.
                    </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-left space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                        <CheckIcon /> Acesso compartilhado a propostas
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <CheckIcon /> Permissões personalizadas
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <CheckIcon /> Histórico de atividades
                    </div>
                </div>
                <Button className="w-full bg-emidias-accent hover:scale-[1.02] transition-transform">
                    Ver Planos
                </Button>
            </div>
        );
    }

    // 2. Internal User View
    const [team, setTeam] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);

    // Invite Form
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('viewer'); // viewer or admin (editor)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const isMaster = user.role === 'master';

    const loadTeam = async () => {
        try {
            setIsLoading(true);
            const data = await api.getUsers();
            setTeam(data);
        } catch (error) {
            console.error('Failed to load team:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTeam();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsInviting(true);

        try {
            if (!inviteEmail.endsWith('@hubradios.com')) {
                throw new Error('Apenas emails @hubradios.com são permitidos.');
            }

            await api.inviteUser(inviteEmail, inviteRole);
            setMessage({ type: 'success', text: 'Convite enviado com sucesso!' });
            setInviteEmail('');
            loadTeam(); // Refresh list
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Erro ao enviar convite.' });
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <div className="p-4 space-y-6">
            {/* Invite Section (Master Only) */}
            {isMaster ? (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                        <Mail size={14} /> Convidar Interno
                    </h3>
                    <form onSubmit={handleInvite} className="space-y-3">
                        <input
                            type="email"
                            placeholder="email@hubradios.com"
                            required
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-emidias-primary outline-none"
                        />
                        <div className="flex gap-2">
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none cursor-pointer"
                            >
                                <option value="viewer">Somente Ver</option>
                                <option value="admin">Editor</option>
                            </select>
                            <Button
                                type="submit"
                                isLoading={isInviting}
                                className="bg-emidias-primary whitespace-nowrap"
                            >
                                Convidar
                            </Button>
                        </div>
                    </form>
                    {message && (
                        <div className={`text-xs p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    Apenas usuários Master podem convidar novos membros.
                </div>
            )}

            {/* Team List */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase px-1">Equipe (@hubradios.com)</h3>

                {isLoading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="animate-spin text-gray-300" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {team.map((member) => (
                            <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                    {member.name ? member.name[0].toUpperCase() : '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {member.name}
                                        </p>
                                        {member.role === 'master' && (
                                            <BadgeCheck size={14} className="text-emidias-accent" title="Master" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                </div>
                                <div className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200 uppercase">
                                    {member.role === 'admin' ? 'Editor' : member.role === 'viewer' ? 'Leitor' : member.role}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function CheckIcon() {
    return (
        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Check size={10} className="text-green-600" />
        </div>
    );
}
