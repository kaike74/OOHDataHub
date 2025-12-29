'use client';

import { useStore } from '@/lib/store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const user = useStore(state => state.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else {
      router.replace('/inicio');
    }
  }, [user, router]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
