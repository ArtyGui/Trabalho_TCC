'use client';

import { useState } from 'react';
import { User, Lock, Mail, Save, Eye, EyeOff } from 'lucide-react';

export default function ConfiguracoesPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [perfilData, setPerfilData] = useState({
    nome: 'Administrador',
    email: 'admin@logibox.com',
    cargo: 'Administrador do Sistema'
  });

  const [senhaData, setSenhaData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });

  const handleSalvarPerfil = async () => {
    try {
      setLoading(true);
      // Aqui você implementaria a chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleAlterarSenha = async () => {
    if (senhaData.novaSenha !== senhaData.confirmarSenha) {
      alert('As senhas não conferem!');
      return;
    }

    if (senhaData.novaSenha.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      // Aqui você implementaria a chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Senha alterada com sucesso!');
      setSenhaData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
    } catch (error) {
      alert('Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
        <p className="text-gray-400">Gerencie suas informações pessoais e preferências</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Perfil do Usuário */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Informações do Perfil
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nome Completo</label>
              <input
                type="text"
                value={perfilData.nome}
                onChange={(e) => setPerfilData({ ...perfilData, nome: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                E-mail
              </label>
              <input
                type="email"
                value={perfilData.email}
                onChange={(e) => setPerfilData({ ...perfilData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Cargo</label>
              <input
                type="text"
                value={perfilData.cargo}
                onChange={(e) => setPerfilData({ ...perfilData, cargo: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleSalvarPerfil}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        {/* Alterar Senha */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-500" />
            Segurança
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Senha Atual</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={senhaData.senhaAtual}
                  onChange={(e) => setSenhaData({ ...senhaData, senhaAtual: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Nova Senha</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={senhaData.novaSenha}
                  onChange={(e) => setSenhaData({ ...senhaData, novaSenha: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirmar Nova Senha</label>
              <input
                type="password"
                value={senhaData.confirmarSenha}
                onChange={(e) => setSenhaData({ ...senhaData, confirmarSenha: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleAlterarSenha}
              disabled={loading || !senhaData.senhaAtual || !senhaData.novaSenha || !senhaData.confirmarSenha}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>
        </div>
      </div>

      {/* Preferências */}
      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Preferências do Sistema</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div>
              <p className="text-white font-medium">Tema Escuro</p>
              <p className="text-sm text-gray-400">Usar interface escura (padrão)</p>
            </div>
            <input
              type="checkbox"
              checked
              disabled
              className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div>
              <p className="text-white font-medium">Notificações</p>
              <p className="text-sm text-gray-400">Receber alertas do sistema</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div>
              <p className="text-white font-medium">Idioma</p>
              <p className="text-sm text-gray-400">Português (Brasil)</p>
            </div>
            <select className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm">
              <option>Português (BR)</option>
              <option>English (US)</option>
              <option>Español</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div>
              <p className="text-white font-medium">Fuso Horário</p>
              <p className="text-sm text-gray-400">América/São Paulo (GMT-3)</p>
            </div>
            <select className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm">
              <option>GMT-3 (Brasília)</option>
              <option>GMT-4 (Manaus)</option>
              <option>GMT-5 (Acre)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Info do Sistema */}
      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Informações do Sistema</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Versão</p>
            <p className="text-white font-medium">LogiBox v1.0.0</p>
          </div>
          <div>
            <p className="text-gray-400">Último Acesso</p>
            <p className="text-white font-medium">Hoje, 14:32</p>
          </div>
          <div>
            <p className="text-gray-400">Tipo de Conta</p>
            <p className="text-white font-medium">Administrador</p>
          </div>
          <div>
            <p className="text-gray-400">Status</p>
            <p className="text-green-400 font-medium">● Online</p>
          </div>
        </div>
      </div>
    </div>
  );
}
