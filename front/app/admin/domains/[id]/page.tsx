'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function DomainOverview() {
    const { id } = useParams();
    const router = useRouter();

    useEffect(() => {
        if (id) {
            router.push(`/admin/domains/${id}/modules`);
        }
    }, [id, router]);

    return (
        <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
            <div className="flex flex-col items-center gap-6">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] animate-pulse">Initialising Matrix Connection...</p>
            </div>
        </div>
    );
}
