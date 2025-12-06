'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ArrowLeft } from 'lucide-react';
import { authService } from '@/lib/auth-service';
import { UserRole } from '@/lib/auth-types';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    role: UserRole.OPERADOR,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    // Registra usuário
    const result = authService.register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      company: formData.company,
      role: formData.role,
    });

    if (result.success && result.user) {
      // Faz login automático
      const loginResult = authService.login({
        email: formData.email,
        password: formData.password,
      });

      if (loginResult.success) {
        router.push('/dashboard');
      }
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2C5282] to-[#3B82F6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Botão Voltar */}
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 text-[#6B7280] hover:text-[#1F2937] mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar para login</span>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2C5282] to-[#3B82F6] rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1F2937]">
                Logi<span className="text-[#3B82F6]">Box</span>
              </h1>
              <p className="text-xs text-[#6B7280]">Sistema de Alocação</p>
            </div>
          </div>

          {/* Título */}
          <h2 className="text-3xl font-bold text-[#1F2937] mb-2">Criar Conta</h2>
          <p className="text-[#6B7280] mb-8">Preencha os dados para se cadastrar</p>

          {/* Formulário */}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Nome */}
            <div>
              <label className="block text-[#374151] text-sm font-medium mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-[#1F2937]"
                placeholder="João Silva"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[#374151] text-sm font-medium mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-[#1F2937]"
                placeholder="seu@email.com"
                required
              />
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-[#374151] text-sm font-medium mb-2">
                Empresa
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-[#1F2937]"
                placeholder="Nome da empresa"
              />
            </div>

            {/* Nível de Acesso */}
            <div>
              <label className="block text-[#374151] text-sm font-medium mb-2">
                Nível de Acesso
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-[#1F2937]"
              >
                <option value={UserRole.OPERADOR}>Operador (Padrão)</option>
                <option value={UserRole.VISUALIZADOR}>Visualizador (Apenas Leitura)</option>
              </select>
              <p className="text-xs text-[#6B7280] mt-1">
                💡 Conta Admin deve ser criada pelo administrador do sistema
              </p>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-[#374151] text-sm font-medium mb-2">
                Senha
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-[#1F2937]"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-[#374151] text-sm font-medium mb-2">
                Confirmar Senha
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-[#1F2937]"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                ❌ {error}
              </div>
            )}

            {/* Termos */}
            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-1 text-[#3B82F6] border-[#D1D5DB] rounded focus:ring-[#3B82F6]"
              />
              <span className="ml-2 text-sm text-[#6B7280]">
                Concordo com os termos de uso e política de privacidade
              </span>
            </div>

            {/* Botão Cadastrar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Cadastrando...' : 'Criar Conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
