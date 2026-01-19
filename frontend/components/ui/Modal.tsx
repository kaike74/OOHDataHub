import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
    className?: string;
    zIndex?: number;
    hideCloseButton?: boolean;
    noPadding?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    footer,
    maxWidth = 'md',
    className,
    zIndex = 60,
    hideCloseButton = false,
    noPadding = false
}: ModalProps) {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setVisible(false), 300); // Wait for exit animation
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted || (!isOpen && !visible)) return null;

    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl',
        'full': 'max-w-full mx-4',
    };

    return createPortal(
        <div
            className={cn(
                "fixed inset-0 flex items-center justify-center p-4 transition-all duration-300",
                isOpen ? "bg-black/40 backdrop-blur-sm opacity-100" : "bg-black/0 backdrop-blur-none opacity-0 pointer-events-none"
            )}
            style={{ zIndex }}
        >
            <div
                className={cn(
                    "w-full bg-white rounded-2xl shadow-emidias-2xl overflow-hidden relative transition-all duration-300 flex flex-col max-h-[90vh]",
                    maxWidthClasses[maxWidth],
                    isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4",
                    className
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {(title || subtitle) && (
                    <div className="bg-gradient-to-r from-emidias-primary to-emidias-primary-light p-6 text-white shrink-0 relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                        >
                            <X size={20} />
                        </button>
                        {title && <h2 className="text-xl font-bold">{title}</h2>}
                        {subtitle && <p className="text-white/80 text-sm mt-1">{subtitle}</p>}
                    </div>
                )}
                {!title && !subtitle && !hideCloseButton && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 z-10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}

                {/* Content */}
                <div className={cn(
                    "overflow-y-auto custom-scrollbar flex-1",
                    noPadding ? "p-0" : "p-6"
                )}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-4 border-t border-emidias-gray-100 bg-emidias-gray-50 flex justify-end gap-3 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
