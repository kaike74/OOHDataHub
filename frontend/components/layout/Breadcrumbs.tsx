'use client';

import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface BreadcrumbItem {
    label: string;
    href?: string;
    active?: boolean;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
    return (
        <nav className={cn("flex items-center text-sm text-gray-500", className)} aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 flex-wrap">
                <li>
                    <div className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
                        <Home size={14} />
                        <span className="sr-only">Home</span>
                    </div>
                </li>

                {items.map((item, index) => (
                    <li key={index} className="flex items-center gap-1.5">
                        <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />

                        {item.href && !item.active ? (
                            <Link
                                href={item.href}
                                className="hover:text-plura-primary hover:underline transition-colors font-medium truncate max-w-[150px]"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span
                                className={cn(
                                    "font-medium truncate max-w-[200px]",
                                    item.active ? "text-gray-900" : "text-gray-600"
                                )}
                            >
                                {item.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
