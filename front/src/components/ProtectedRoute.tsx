'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  permission: string;
  children: ReactNode;
}

export function ProtectedRoute({ permission, children }: ProtectedRouteProps) {
  const router = useRouter();
  const { can } = usePermissions();
  const { loading, user } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated
        router.push('/signin');
      } else if (!can(permission)) {
        // Not authorized
        setAuthorized(false);
      } else {
        // Authorized
        setAuthorized(true);
      }
    }
  }, [loading, user, can, permission, router]);

  // Optionally show a loading skeleton or indicator
  if (loading || authorized === null) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-900">
         <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-400 font-medium">Validation des permissions...</p>
         </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-screen bg-slate-900 border-t border-white/10">
        <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20 shadow-2xl shadow-rose-500/20">
          <span className="text-4xl">🛡️</span>
        </div>
        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Accès Refusé</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm">
          Vous n'avez pas l'autorisation d'accéder à ce noeud du système. L'autorisation requise 
          <strong className="text-rose-400 mx-1 px-2 py-0.5 bg-rose-500/10 rounded-md border border-rose-500/20">{permission}</strong> 
          est absente de votre profil.
        </p>
        <button 
          onClick={() => router.push('/admin')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95"
        >
          Retourner au Command Center
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
