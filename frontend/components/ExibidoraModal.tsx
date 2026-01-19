// ... imports
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/lib/store';
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

    const handleClose = () => {
        setModalOpen(false);
        setEditingExibidora(null);
    };

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center gap-2">
                    <Building2 size={24} />
                    {editingExibidora ? 'Editar Exibidora' : 'Nova Exibidora'}
                </div>
            }
            maxWidth="2xl"
            maxWidth="2xl"
            className="flex flex-col max-h-[90vh]"
            zIndex={zIndex}
        >
            <ExibidoraForm
                onSuccess={() => handleClose()}
                onCancel={handleClose}
                initialData={editingExibidora}
            />
        </Modal>
    );
}
