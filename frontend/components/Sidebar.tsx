'use client';

import { LayoutDashboard, Package, MapPin, Settings, LogOut, User, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { authService } from '@/lib/auth-service';
import { AuthUser, UserRole } from '@/lib/auth-types';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', requiredRole: UserRole.VISUALIZADOR },
  { icon: Package, label: 'Contêineres', href: '/dashboard/containers', requiredRole: UserRole.VISUALIZADOR },
  { icon: MapPin, label: 'Pátio', href: '/dashboard/patio', requiredRole: UserRole.VISUALIZADOR },
  { icon: Settings, label: 'Configurações', href: '/dashboard/config', requiredRole: UserRole.ADMIN },
];

const roleLabels = {
  [UserRole.ADMIN]: { label: 'Administrador', color: 'text-red-400', badge: 'bg-red-900' },
  [UserRole.OPERADOR]: { label: 'Operador', color: 'text-blue-400', badge: 'bg-blue-900' },
  [UserRole.VISUALIZADOR]: { label: 'Visualizador', color: 'text-gray-400', badge: 'bg-gray-700' },
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    if (confirm('Deseja realmente sair?')) {
      authService.logout();
      router.push('/login');
    }
  };

  // Filtra menu items baseado na permissão do usuário
  const visibleMenuItems = menuItems.filter(item => {
    if (!user) return false;
    return authService.hasPermission(item.requiredRole);
  });

  const roleInfo = user ? roleLabels[user.role] : null;

  return (
    <div className="w-64 bg-[#2C5282] border-r border-[#1e3a5f] flex flex-col shadow-xl">
      {/* Logo */}
      <div className="p-6 border-b border-[#1e3a5f]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] rounded-lg flex items-center justify-center shadow-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">LogiBox</h1>
            <p className="text-xs text-[#93C5FD]">Sistema de Alocação</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-[#3B82F6] text-white shadow-lg'
                  : 'text-[#BFDBFE] hover:bg-[#1e3a5f] hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Usuário e Logout */}
      <div className="p-4 border-t border-[#1e3a5f]">
        {user && (
          <div className="bg-[#1e3a5f] rounded-lg p-3 mb-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#3B82F6] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.name}</p>
                <p className="text-[#93C5FD] text-xs truncate">{user.email}</p>
              </div>
            </div>
            
            {/* Badge de Role */}
            {roleInfo && (
              <div className={`${roleInfo.badge} rounded px-2 py-1 flex items-center gap-1 justify-center`}>
                <Shield className="w-3 h-3 text-white" />
                <span className={`text-xs font-medium text-white`}>
                  {roleInfo.label}
                </span>
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-[#FCA5A5] hover:bg-red-900 hover:bg-opacity-30 hover:text-red-300 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#1e3a5f]">
        <p className="text-xs text-[#93C5FD] text-center">
          LogiBox v1.0.0
        </p>
      </div>
    </div>
  );
}
