import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import styles from './AnimatedSearchBar.module.css';
import { cn } from '@/lib/utils';

interface AnimatedSearchBarProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    onSearch?: (value: string) => void;
    width?: string;
}

export function AnimatedSearchBar({
    value = '',
    onChange,
    placeholder = 'Buscar...',
    className,
    onSearch,
    width = '300px'
}: AnimatedSearchBarProps) {
    const [isOpen, setIsOpen] = useState(!!value);
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync with controlled value if provided
    useEffect(() => {
        if (value !== localValue) {
            setLocalValue(value);
        }
    }, [value]);

    useEffect(() => {
        if (value && !isOpen) {
            setIsOpen(true);
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        if (onChange) onChange(newValue);
    };

    const handleToggle = () => {
        if (!isOpen) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
        } else if (!localValue) {
            setIsOpen(false);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLocalValue('');
        if (onChange) onChange('');
        if (inputRef.current) inputRef.current.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && onSearch) {
            onSearch(localValue);
        }
        if (e.key === 'Escape') {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    // Click outside to close if empty
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                !localValue &&
                isOpen
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [localValue, isOpen]);

    return (
        <div
            ref={containerRef}
            className={cn(styles.finderBox, isOpen && styles.open, className)}
        >
            <div
                className={styles.fieldHolder}
                style={isOpen ? { width } : undefined}
            >
                <div
                    className={styles.iconButton}
                    onClick={handleToggle}
                >
                    <Search size={20} />
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    className={styles.input}
                    placeholder={placeholder}
                    value={localValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsOpen(true)}
                />

                <div
                    className={styles.closeButton}
                    onClick={handleClear}
                >
                    <X size={16} />
                </div>
            </div>
        </div>
    );
}
