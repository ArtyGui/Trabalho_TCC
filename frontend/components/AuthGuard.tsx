'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/lib/auth-service';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      // Rotas públicas
      const publicRoutes = ['/login', '/register'];
      const isPublicRoute = publicRoutes.includes(pathname);

      // Verifica se está autenticado
      const authenticated = authService.isAuthenticated();

      if (!authenticated && !isPublicRoute) {
        // Não está logado e tentou acessar rota protegida
        router.push('/login');
      } else if (authenticated && isPublicRoute) {
        // Está logado e tentou acessar login/register
        router.push('/dashboard');
      } else {
        setIsAuthenticated(true);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
