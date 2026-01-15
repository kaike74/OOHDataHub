import { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps extends ComponentPropsWithoutRef<'div'> {
    size?: number;
}

export function LoadingSpinner({ size = 24, className, ...props }: LoadingSpinnerProps) {
    return (
        <div className={cn("flex justify-center items-center", className)} {...props}>
            <div
                className="animate-spin rounded-full border-t-2 border-b-2 border-current"
                style={{ width: size, height: size }}
            />
        </div>
    );
}
