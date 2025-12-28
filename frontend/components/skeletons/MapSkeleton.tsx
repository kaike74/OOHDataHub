import { Skeleton } from "@/components/ui/Skeleton";

export function MapSkeleton() {
    return (
        <div className="relative h-full w-full bg-gray-50 overflow-hidden flex">
            {/* Sidebar Skeleton (Desktop) */}
            <div className="hidden lg:block w-80 h-full border-r border-gray-200 bg-white p-4 space-y-4 shrink-0">
                <div className="flex gap-2 mb-6">
                    <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2 p-3 border border-gray-100 rounded-lg">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-32 w-full rounded-md" />
                        <div className="flex gap-2 mt-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                <div className="absolute inset-0 bg-gray-200 animate-pulse opacity-50" />

                {/* Floating Elements Simulation */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 h-10 bg-white/50 rounded-lg" />
                <div className="absolute top-4 right-4 w-10 h-10 bg-white/50 rounded-lg" />

                {/* Fake Pins */}
                <div className="absolute top-1/4 left-1/3 w-8 h-8 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0.3s' }} />
                <div className="absolute bottom-1/3 right-1/4 w-8 h-8 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0.5s' }} />
            </div>
        </div>
    );
}
