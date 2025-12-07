'use client';

import { useEffect, useState } from 'react';
import { Package, Plus, Trash2, Scale, Calendar, Clock, MapPin, Target } from 'lucide-react';

interface Container {
  id: string;
  tipo: '20GP' | '40GP' | '40HC';
  cliente: string;
  peso: number;
  data_entrada: string;
  data_saida_prevista: string;
  status: 'aguardando' | 'alocado';
  patio_id?: number;
  endereco?: string;
  nivel?: number;
}

interface Patio {
  id: number;
  nome: string;
  ativo: boolean;
}

export default function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [patios, setPatios] = useState<Patio[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAlocacao, setShowAlocacao] = useState(false);
  
  // Seleção para alocação
  const [containersSelecionados, setContainersSelecionados] = useState<string[]>([]);
  const [patioSelecionado, setPatioSelecionado] = useState<number | null>(null);
  
  const hoje = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    id: '',
    tipo: '20GP',
    cliente: '',
    peso: '',
    data_entrada: hoje,
    data_saida_prevista: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [containersRes, patiosRes] = await Promise.all([
        fetch('http://localhost:8000/containers'),
        fetch('http://localhost:8000/patios?ativo=true')
      ]);
      
      const containersData = await containersRes.json();
      const patiosData = await patiosRes.json();
      
      setContainers(containersData.containers || []);
      setPatios(patiosData.patios || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleAdd = async () => {
    try {
      setLoading(true);

      const container = {
        id: formData.id,
        tipo: formData.tipo,
        cliente: formData.cliente,
        peso: parseFloat(formData.peso),
        data_entrada: new Date(formData.data_entrada).toISOString(),
        data_saida_prevista: new Date(formData.data_saida_prevista).toISOString()
      };

      const response = await fetch('http://localhost:8000/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(container)
      });

      if (!response.ok) throw new Error('Erro ao adicionar');

      setFormData({ 
        id: '', 
        tipo: '20GP', 
        cliente: '', 
        peso: '', 
        data_entrada: hoje,
        data_saida_prevista: '' 
      });
      setShowForm(false);
      await carregarDados();
    } catch (error) {
      alert('Erro ao adicionar container');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja remover este container?')) return;

    try {
      await fetch(`http://localhost:8000/containers/${id}`, {
        method: 'DELETE'
      });
      await carregarDados();
    } catch (error) {
      alert('Erro ao remover container');
    }
  };

  const toggleSelecao = (id: string) => {
    setContainersSelecionados(prev => 
      prev.includes(id) 
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  const handleAlocarSelecionados = async () => {
    if (containersSelecionados.length === 0) {
      alert('Selecione pelo menos um container');
      return;
    }

    if (!patioSelecionado) {
      alert('Selecione um pátio');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:8000/patios/${patioSelecionado}/alocar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containersSelecionados)
      });

      const result = await response.json();
      
      const sucesso = result.resultados.filter((r: any) => r.sucesso).length;
      const falha = result.resultados.filter((r: any) => !r.sucesso).length;
      
      alert(`Alocação concluída!\n✓ Sucesso: ${sucesso}\n✗ Falha: ${falha}`);
      
      setContainersSelecionados([]);
      setPatioSelecionado(null);
      setShowAlocacao(false);
      await carregarDados();
    } catch (error) {
      alert('Erro ao alocar containers');
    } finally {
      setLoading(false);
    }
  };

  const aguardando = containers.filter(c => c.status === 'aguardando').length;
  const alocados = containers.filter(c => c.status === 'alocado').length;

  const saindoEmBreve = containers.filter(c => {
    const saida = new Date(c.data_saida_prevista);
    const hoje = new Date();
    const diff = (saida.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;

  const isDataAgendada = formData.data_entrada !== hoje;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Contêineres</h1>
          <p className="text-gray-400">Gerencie os contêineres do sistema</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            <MapPin className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-400">Alocados</span>
          </div>
          <p className="text-3xl font-bold text-white">{alocados}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-400">Saindo em Breve</span>
          </div>
          <p className="text-3xl font-bold text-white">{saindoEmBreve}</p>
          <p className="text-xs text-gray-500 mt-1">Próximos 7 dias</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {aguardando > 0 && (
          <button
            onClick={() => setShowAlocacao(!showAlocacao)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Target className="w-5 h-5" />
            Alocar Selecionados ({containersSelecionados.length})
          </button>
        )}
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Contêiner
        </button>
      </div>

      {/* Painel de Alocação */}
      {showAlocacao && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" />
            Alocar Containers Selecionados
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Containers Selecionados: {containersSelecionados.length}
            </label>
            <div className="flex flex-wrap gap-2">
              {containersSelecionados.map(id => {
                const container = containers.find(c => c.id === id);
                return (
                  <span key={id} className="bg-blue-900 text-blue-300 px-3 py-1 rounded text-sm">
                    {container?.tipo} - {id}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Selecione o Pátio de Destino:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {patios.map(patio => (
                <button
                  key={patio.id}
                  onClick={() => setPatioSelecionado(patio.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    patioSelecionado === patio.id
                      ? 'bg-blue-900 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <div className="font-semibold">{patio.nome}</div>
                  <div className="text-xs text-gray-400">Pátio #{patio.id}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAlocarSelecionados}
              disabled={loading || containersSelecionados.length === 0 || !patioSelecionado}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Alocando...' : 'Confirmar Alocação'}
            </button>
            <button
              onClick={() => {
                setShowAlocacao(false);
                setContainersSelecionados([]);
                setPatioSelecionado(null);
              }}
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Adicionar Contêiner</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="ID (ex: ABC-123456-7)"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="20GP">20GP (Container 20 pés)</option>
              <option value="40GP">40GP (Container 40 pés)</option>
              <option value="40HC">40HC (Container 40 High Cube)</option>
            </select>
            
            <input
              type="text"
              placeholder="Cliente"
              value={formData.cliente}
              onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Peso (toneladas) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="Ex: 22.5"
                value={formData.peso}
                onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Containers mais pesados vão para a base
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data de Entrada *
              </label>
              <input
                type="date"
                value={formData.data_entrada}
                onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                required
              />
              {isDataAgendada ? (
                <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Agendado para {new Date(formData.data_entrada).toLocaleDateString('pt-BR')}
                </p>
              ) : (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  ✓ Entrada HOJE
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data de Saída Prevista *
              </label>
              <input
                type="date"
                min={formData.data_entrada}
                value={formData.data_saida_prevista}
                onChange={(e) => setFormData({ ...formData, data_saida_prevista: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Saída próxima = alocado no topo
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              disabled={loading || !formData.id || !formData.cliente || !formData.peso || !formData.data_entrada || !formData.data_saida_prevista}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Adicionando...' : 'Adicionar Container'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setFormData({
                  id: '',
                  tipo: '20GP',
                  cliente: '',
                  peso: '',
                  data_entrada: hoje,
                  data_saida_prevista: ''
                });
              }}
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Sel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Peso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Entrada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Saída Prevista</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Localização</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((container) => {
                const saida = new Date(container.data_saida_prevista);
                const hojeDate = new Date();
                const diasParaSaida = Math.ceil((saida.getTime() - hojeDate.getTime()) / (1000 * 60 * 60 * 24));
                const isSelecionado = containersSelecionados.includes(container.id);

                return (
                  <tr key={container.id} className={`border-t border-gray-800 hover:bg-gray-850 ${isSelecionado ? 'bg-blue-900 bg-opacity-20' : ''}`}>
                    <td className="px-6 py-4">
                      {container.status === 'aguardando' && (
                        <input
                          type="checkbox"
                          checked={isSelecionado}
                          onChange={() => toggleSelecao(container.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-mono">{container.id}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-xs font-medium">
                        {container.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">{container.cliente}</td>
                    <td className="px-6 py-4 text-sm text-white">
                      <span className="flex items-center gap-1">
                        <Scale className="w-3 h-3 text-gray-400" />
                        {container.peso}t
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(container.data_entrada).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="text-white">
                          {new Date(container.data_saida_prevista).toLocaleDateString('pt-BR')}
                        </p>
                        <p className={`text-xs ${
                          diasParaSaida <= 3 ? 'text-red-400' :
                          diasParaSaida <= 7 ? 'text-orange-400' :
                          'text-gray-400'
                        }`}>
                          {diasParaSaida === 0 ? 'Hoje!' :
                           diasParaSaida < 0 ? 'Atrasado!' :
                           `Em ${diasParaSaida} dia${diasParaSaida > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        container.status === 'alocado'
                          ? 'bg-green-900 text-green-300'
                          : 'bg-yellow-900 text-yellow-300'
                      }`}>
                        {container.status === 'alocado' ? '✓ Alocado' : '⏱ Aguardando'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {container.endereco ? (
                        <div>
                          <p className="text-white text-xs">{container.endereco}</p>
                          {container.patio_id && (
                            <p className="text-gray-500 text-xs">Pátio #{container.patio_id}</p>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(container.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Remover container"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {containers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nenhum container cadastrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
