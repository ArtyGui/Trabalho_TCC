'use client';

import { useEffect, useState } from 'react';
import { Plus, Zap, Trash2, Package, AlertCircle, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { containerAPI, alocacaoAPI, patioAPI } from '@/lib/api';

interface Container {
  id: string;
  tipo: '20GP' | '40GP' | '40HC';
  cliente: string;
  data_entrada: string;
  status: 'aguardando' | 'alocado';
  endereco?: string;
}

export default function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContainers, setSelectedContainers] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patioConfigurado, setPatioConfigurado] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    id: '',
    tipo: '20GP' as '20GP' | '40GP' | '40HC',
    cliente: '',
    data_entrada: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadContainers();
    checkPatio();
  }, []);

  const checkPatio = async () => {
    try {
      await patioAPI.obter();
      setPatioConfigurado(true);
    } catch (error) {
      setPatioConfigurado(false);
    }
  };

  const loadContainers = async () => {
    try {
      setLoading(true);
      const data = await containerAPI.listar();
      setContainers(data.containers || []);
    } catch (error: any) {
      console.error('Erro ao carregar containers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddContainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const container = {
        ...formData,
        data_entrada: new Date(formData.data_entrada).toISOString(),
      };

      await containerAPI.adicionar(container);
      
      setSuccess('Contêiner adicionado com sucesso!');
      setShowAddModal(false);
      setFormData({
        id: '',
        tipo: '20GP',
        cliente: '',
        data_entrada: new Date().toISOString().split('T')[0],
      });
      
      await loadContainers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Erro ao adicionar contêiner');
    }
  };

  const handleAlocarSelecionados = async () => {
    if (selectedContainers.length === 0) {
      setError('Selecione pelo menos um contêiner');
      return;
    }

    if (!patioConfigurado) {
      setError('⚠️ Pátio não configurado! Configure o pátio antes de alocar contêineres.');
      return;
    }

    try {
      setError('');
      const result = await alocacaoAPI.alocar(selectedContainers);
      
      // Trata diferentes formatos de resposta
      let sucesso = 0;
      if (result.resultados && Array.isArray(result.resultados)) {
        sucesso = result.resultados.filter((r: any) => r.sucesso).length;
      } else if (result.sucesso !== undefined) {
        sucesso = result.sucesso;
      } else {
        sucesso = selectedContainers.length; // Assume que todos foram alocados
      }
      
      setSuccess(`${sucesso} contêiner(es) alocado(s) com sucesso!`);
      setSelectedContainers([]);
      await loadContainers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      if (error.message.includes('não configurado')) {
        setError('⚠️ Pátio não configurado! Vá em "Configurações" e configure o pátio primeiro.');
      } else {
        setError(error.message || 'Erro ao alocar contêineres');
      }
    }
  };

  const handleAlocarTodos = async () => {
    const aguardando = containers.filter(c => c.status === 'aguardando');
    
    if (aguardando.length === 0) {
      setError('Nenhum contêiner aguardando alocação');
      return;
    }

    if (!patioConfigurado) {
      setError('⚠️ Pátio não configurado! Configure o pátio antes de alocar contêineres.');
      return;
    }

    try {
      setError('');
      const result = await alocacaoAPI.alocarTodos();
      
      // Trata diferentes formatos de resposta
      let sucesso = 0;
      if (result.resultados && Array.isArray(result.resultados)) {
        sucesso = result.resultados.filter((r: any) => r.sucesso).length;
      } else if (result.sucesso !== undefined) {
        sucesso = result.sucesso;
      } else {
        sucesso = aguardando.length; // Assume que todos foram alocados
      }
      
      setSuccess(`${sucesso} contêiner(es) alocado(s) com sucesso!`);
      await loadContainers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      if (error.message.includes('não configurado')) {
        setError('⚠️ Pátio não configurado! Vá em "Configurações" e configure o pátio primeiro.');
      } else {
        setError(error.message || 'Erro ao alocar contêineres');
      }
    }
  };

  const handleRemoveContainer = async (id: string) => {
    if (!confirm('Deseja realmente remover este contêiner?')) return;

    try {
      await containerAPI.remover(id);
      setSuccess('Contêiner removido com sucesso!');
      await loadContainers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Erro ao remover contêiner');
    }
  };

  const toggleSelectContainer = (id: string) => {
    setSelectedContainers(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const aguardando = containers.filter(c => c.status === 'aguardando').length;
  const alocados = containers.filter(c => c.status === 'alocado').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando contêineres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Contêineres</h1>
        <p className="text-gray-400">Gerencie os contêineres do sistema</p>
      </div>

      {/* Alerta: Pátio não configurado */}
      {!patioConfigurado && (
        <div className="mb-6 bg-yellow-900 bg-opacity-20 border border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-yellow-500 font-semibold mb-1">Pátio não configurado</h3>
              <p className="text-yellow-200 text-sm">
                Configure a estrutura do pátio antes de alocar contêineres.
              </p>
              <a
                href="/dashboard/config"
                className="inline-block mt-3 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Configurar Pátio
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Mensagens */}
      {error && (
        <div className="mb-6 bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-900 bg-opacity-20 border border-green-800 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="text-green-400">{success}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-400">Total</span>
          </div>
          <p className="text-3xl font-bold text-white">{containers.length}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-400">Aguardando</span>
          </div>
          <p className="text-3xl font-bold text-white">{aguardando}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-400">Alocados</span>
          </div>
          <p className="text-3xl font-bold text-white">{alocados}</p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleAlocarTodos}
          disabled={aguardando === 0 || !patioConfigurado}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Zap className="w-5 h-5" />
          Alocar Todos ({aguardando})
        </button>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Contêiner
        </button>
      </div>

      {/* Selecionados */}
      {selectedContainers.length > 0 && (
        <div className="mb-6 bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4 flex items-center justify-between">
          <span className="text-blue-400">
            {selectedContainers.length} contêiner(es) selecionado(s)
          </span>
          <button
            onClick={handleAlocarSelecionados}
            disabled={!patioConfigurado}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Alocar Selecionados
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="text-left p-4 text-gray-400 font-medium">SELEÇÃO</th>
              <th className="text-left p-4 text-gray-400 font-medium">ID</th>
              <th className="text-left p-4 text-gray-400 font-medium">TIPO</th>
              <th className="text-left p-4 text-gray-400 font-medium">CLIENTE</th>
              <th className="text-left p-4 text-gray-400 font-medium">DATA ENTRADA</th>
              <th className="text-left p-4 text-gray-400 font-medium">STATUS</th>
              <th className="text-left p-4 text-gray-400 font-medium">POSIÇÃO</th>
              <th className="text-left p-4 text-gray-400 font-medium">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {containers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-500">
                  Nenhum contêiner cadastrado
                </td>
              </tr>
            ) : (
              containers.map((container) => (
                <tr key={container.id} className="border-t border-gray-800 hover:bg-gray-800">
                  <td className="p-4">
                    {container.status === 'aguardando' && (
                      <input
                        type="checkbox"
                        checked={selectedContainers.includes(container.id)}
                        onChange={() => toggleSelectContainer(container.id)}
                        className="w-4 h-4 rounded border-gray-700 bg-gray-800"
                      />
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="text-white font-mono">{container.id}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-sm font-medium">
                      {container.tipo}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{container.cliente}</td>
                  <td className="p-4 text-gray-400">
                    {new Date(container.data_entrada).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4">
                    {container.status === 'aguardando' ? (
                      <span className="flex items-center gap-2 text-yellow-400">
                        <Clock className="w-4 h-4" />
                        Aguardando
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Alocado
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {container.endereco ? (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        {container.endereco}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">LNaN, CNaN</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleRemoveContainer(container.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Adicionar */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Adicionar Contêiner</h2>

            <form onSubmit={handleAddContainer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ID do Contêiner
                </label>
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleInputChange}
                  placeholder="Ex: ABCD 123456-7"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="20GP">20GP</option>
                  <option value="40GP">40GP</option>
                  <option value="40HC">40HC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cliente</label>
                <input
                  type="text"
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleInputChange}
                  placeholder="Nome do cliente"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data de Entrada
                </label>
                <input
                  type="date"
                  name="data_entrada"
                  value={formData.data_entrada}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}