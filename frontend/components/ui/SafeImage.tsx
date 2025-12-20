'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { ImageOff } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallback?: React.ReactNode;
}

export function SafeImage({ src, alt, className, fallback, ...props }: SafeImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    return (
        <div className={cn("relative overflow-hidden", className)}>
            {(isLoading) && (
                <Skeleton className="absolute inset-0 w-full h-full z-10" />
            )}

            {!hasError ? (
                <img
                    src={src}
                    alt={alt}
                    className={cn(
                        "w-full h-full object-cover transition-opacity duration-300",
                        isLoading ? "opacity-0" : "opacity-100",
                        className // Apply className to img as well to ensure fit
                    )}
                    onLoad={handleLoad}
                    onError={handleError}
                    {...props}
                />
            ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    {fallback || <ImageOff size={24} />}
                </div>
            )}
        </div>
    );
}
