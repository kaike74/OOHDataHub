import { Skeleton } from "@/components/ui/Skeleton";

interface SkeletonTableProps {
    rows?: number;
    columns?: number;
    className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
    return (
        <div className={`w-full ${className}`}>
            {/* Header */}
            <div className="flex gap-4 mb-4 border-b border-gray-100 pb-2">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={`head-${i}`} className="h-4 w-24" />
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={`row-${i}`} className="flex gap-4 mb-3 items-center">
                    {Array.from({ length: columns }).map((_, j) => (
                        <Skeleton key={`cell-${i}-${j}`} className={`h-10 w-full rounded-md ${j === 0 ? 'w-1/3' : ''}`} />
                    ))}
                </div>
            ))}
        </div>
    );
}
