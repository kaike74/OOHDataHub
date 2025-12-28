import { Shield, Users, Lock, UserPlus } from 'lucide-react';
import { SkeletonTable } from './skeletons/SkeletonTable';

export default function AccountsView() {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Contas e Permissões</h2>
                <p className="text-gray-500">Gerencie usuários e níveis de acesso do sistema.</p>
            </div>

            {/* Placeholder Content */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="font-semibold text-gray-700 flex items-center gap-2">
                        <Users size={18} />
                        Usuários Ativos
                    </div>
                </div>
                <div className="p-6 text-center text-gray-400 py-12">
                    <Shield size={48} className="mx-auto mb-4 text-gray-200" />
                    <p>Funcionalidade de gestão de contas em desenvolvimento.</p>
                    <p className="text-sm mt-2">Em breve você poderá gerenciar permissões aqui.</p>
                </div>
            </div>
        </div>
    );
}
