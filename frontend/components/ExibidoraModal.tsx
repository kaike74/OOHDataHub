// ... imports
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Building2 } from 'lucide-react';
import ExibidoraForm from './ExibidoraForm';

interface ExibidoraModalProps {
    zIndex?: number;
}

export default function ExibidoraModal({ zIndex }: ExibidoraModalProps) {
    const isModalOpen = useStore((state) => state.isExibidoraModalOpen);
    const setModalOpen = useStore((state) => state.setExibidoraModalOpen);
    const editingExibidora = useStore((state) => state.editingExibidora);
    const setEditingExibidora = useStore((state) => state.setEditingExibidora);
    const formMode = useStore((state) => state.exibidoraFormMode || 'full'); // Default to full

    const handleClose = () => {
        setModalOpen(false);
        setEditingExibidora(null);
    };

    const handleDelete = async () => {
        if (!editingExibidora?.id) return;
        try {
            await api.deleteExibidora(editingExibidora.id);

            // Refresh stores
            const updatedExibidoras = await api.getExibidoras();
            useStore.getState().setExibidoras(updatedExibidoras);

            // Refresh points as they might be cascade deleted
            const updatedPontos = await api.getPontos();
            useStore.getState().setPontos(updatedPontos);

            handleClose();
        } catch (error) {
            console.error('Failed to delete exhibitor:', error);
            alert('Erro ao excluir exibidora. Tente novamente.');
        }
    };

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center gap-2">
                    <Building2 size={24} />
                    {formMode === 'contacts' ? 'Gerenciar Contatos' : (editingExibidora ? 'Editar Exibidora' : 'Nova Exibidora')}
                </div>
            }
            maxWidth="2xl"
            className="flex flex-col max-h-[90vh]"
            zIndex={zIndex}
        >
            <ExibidoraForm
                onSuccess={() => handleClose()}
                onCancel={handleClose}
                initialData={editingExibidora}
                mode={formMode}
                onDelete={editingExibidora ? handleDelete : undefined}
            />
        </Modal>
    );
}
