'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Eye, Edit, Shield } from 'lucide-react';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    userType: 'internal' | 'external';
    onSuccess?: () => void;
}

export default function CreateUserModal({ isOpen, onClose, userType, onSuccess }: CreateUserModalProps) {
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        role: 'viewer' as 'viewer' | 'editor' | 'admin',
        plan: 'Gratuito'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (userType === 'internal') {
                // Validate email domain for internal users
                if (!formData.email.endsWith('@hubradios.com')) {
                    toast.error('Email deve ser @hubradios.com para usuários internos');
                    setLoading(false);
                    return;
                }

                await api.createInternalUser({
                    email: formData.email,
                    name: formData.name,
                    password: formData.password,
                    role: formData.role
                });
                toast.success('Usuário interno criado com sucesso!');
            } else {
                await api.createExternalUser({
                    email: formData.email,
                    name: formData.name,
                    password: formData.password,
                    plan: formData.plan
                });
                toast.success('Usuário externo criado com sucesso!');
            }

            // Reset form
            setFormData({
                email: '',
                name: '',
                password: '',
                role: 'viewer',
                plan: 'Gratuito'
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error creating user:', error);
            toast.error(error.message || 'Erro ao criar usuário');
        } finally {
            setLoading(false);
        }
    };

    const roleOptions = [
        { value: 'viewer', label: 'Visualizador', icon: Eye, description: 'Apenas visualiza' },
        { value: 'editor', label: 'Editor', icon: Edit, description: 'Visualiza e edita' },
        { value: 'admin', label: 'Administrador', icon: Shield, description: 'Acesso completo' }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Criar Usuário ${userType === 'internal' ? 'Interno' : 'Externo'}`}
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={userType === 'internal' ? 'usuario@hubradios.com' : 'usuario@exemplo.com'}
                        required
                    />
                    {userType === 'internal' && (
                        <p className="text-xs text-gray-500 mt-1">
                            Apenas emails @hubradios.com são permitidos
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome
                    </label>
                    <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nome completo"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Senha
                    </label>
                    <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                        required
                    />
                </div>

                {userType === 'internal' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nível de Acesso
                        </label>
                        <div className="space-y-2">
                            {roleOptions.map((option) => {
                                const Icon = option.icon;
                                return (
                                    <label
                                        key={option.value}
                                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${formData.role === option.value
                                                ? 'border-plura-primary bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={option.value}
                                            checked={formData.role === option.value}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                            className="text-plura-primary focus:ring-plura-primary"
                                        />
                                        <Icon className="w-5 h-5 text-gray-600" />
                                        <div className="flex-1">
                                            <p className="font-medium text-sm text-gray-900">{option.label}</p>
                                            <p className="text-xs text-gray-500">{option.description}</p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plano
                        </label>
                        <select
                            value={formData.plan}
                            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-plura-primary"
                        >
                            <option value="Gratuito">Gratuito</option>
                            <option value="Pro">Pro (futuro)</option>
                            <option value="Enterprise">Enterprise (futuro)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Por enquanto, todos os planos têm as mesmas funcionalidades
                        </p>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-plura-primary hover:bg-plura-primary/90"
                    >
                        {loading ? 'Criando...' : 'Criar Usuário'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
