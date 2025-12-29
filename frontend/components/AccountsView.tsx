import { useStore } from '@/lib/store';
import TeamManagement from './TeamManagement';

export default function AccountsView() {
    const user = useStore((state) => state.user);

    if (!user) return null;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Contas e Permissões</h2>
                    <p className="text-gray-500 text-sm">Gerencie o acesso e colaboradores da sua conta.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                <TeamManagement user={user} />
            </div>
        </div>
    );
}
