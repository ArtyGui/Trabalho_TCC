'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, Trash2, Edit, Layers } from 'lucide-react';

interface Patio {
  id: number;
  nome: string;
  ativo: boolean;
  niveis_maximos: number;
  equipamento: string;
  largura: number;
  comprimento: number;
}

export default function GerenciarPatiosPage() {
  const router = useRouter();
  const [patios, setPatios] = useState<Patio[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    largura: '',
    comprimento: '',
    blocos: '',
    ruas: '',
    lotes: '',
    posicoes: '',
    equipamento: 'reach_stacker',
    niveis_maximos: ''
  });

  useEffect(() => {
    carregarPatios();
  }, []);

  const carregarPatios = async () => {
    try {
      const response = await fetch('http://localhost:8000/patios');
      const data = await response.json();
      setPatios(data.patios || []);
    } catch (error) {
      console.error('Erro ao carregar pátios:', error);
    }
  };

  const handleCriarPatio = async () => {
    // Validação
    if (!formData.nome || !formData.largura || !formData.comprimento || 
        !formData.blocos || !formData.ruas || !formData.lotes || 
        !formData.posicoes || !formData.niveis_maximos) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    try {
      setLoading(true);

      const config = {
        nome: formData.nome,
        largura: parseInt(formData.largura),
        comprimento: parseInt(formData.comprimento),
        areaTotal: parseInt(formData.largura) * parseInt(formData.comprimento),
        numeroBlocos: parseInt(formData.blocos),
        ruasPorBloco: parseInt(formData.ruas),
        lotesPorRua: parseInt(formData.lotes),
        posicoesPorLote: parseInt(formData.posicoes),
        totalPosicoes: parseInt(formData.blocos) * parseInt(formData.ruas) * parseInt(formData.lotes) * parseInt(formData.posicoes),
        equipamento: formData.equipamento,
        niveis_maximos: parseInt(formData.niveis_maximos)
      };

      console.log('📤 Enviando para API:', config);

      const response = await fetch('http://localhost:8000/patios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro do backend:', data);
        throw new Error(data.detail || 'Erro ao criar pátio');
      }

      console.log('✅ Pátio criado:', data);

      setFormData({
        nome: '',
        largura: '',
        comprimento: '',
        blocos: '',
        ruas: '',
        lotes: '',
        posicoes: '',
        equipamento: 'reach_stacker',
        niveis_maximos: ''
      });
      setShowForm(false);
      await carregarPatios();
      alert('Pátio criado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro completo:', error);
      alert(`Erro ao criar pátio: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletar = async (id: number) => {
    if (!confirm('Deseja realmente deletar este pátio?')) return;

    try {
      await fetch(`http://localhost:8000/patios/${id}`, {
        method: 'DELETE'
      });
      await carregarPatios();
      alert('Pátio deletado com sucesso!');
    } catch (error) {
      alert('Erro ao deletar pátio');
    }
  };

  const calcularCapacidade = () => {
    const blocos = parseInt(formData.blocos) || 0;
    const ruas = parseInt(formData.ruas) || 0;
    const lotes = parseInt(formData.lotes) || 0;
    const posicoes = parseInt(formData.posicoes) || 0;
    const niveis = parseInt(formData.niveis_maximos) || 0;
    return blocos * ruas * lotes * posicoes * niveis;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Pátios</h1>
          <p className="text-gray-400">Configure múltiplos pátios com empilhamento 3D</p>
        </div>
      </div>

      {/* Lista de Pátios */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-500" />
          Pátios Cadastrados
        </h2>

        {patios.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
            <Layers className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Nenhum pátio cadastrado</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
            >
              Criar Primeiro Pátio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {patios.map(patio => (
              <div key={patio.id} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{patio.nome}</h3>
                    <p className="text-sm text-gray-400">Pátio #{patio.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    patio.ativo ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {patio.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{patio.largura}m × {patio.comprimento}m</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Layers className="w-4 h-4" />
                    <span>{patio.niveis_maximos} níveis - {patio.equipamento.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/patio/visualizar?id=${patio.id}`)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Ver Pátio
                  </button>
                  <button
                    onClick={() => handleDeletar(patio.id)}
                    className="bg-red-900 hover:bg-red-800 text-red-300 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botão Criar Novo */}
      {patios.length > 0 && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors mb-6"
        >
          <Plus className="w-5 h-5" />
          Criar Novo Pátio
        </button>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-500" />
            Criar Novo Pátio
          </h3>

          <div className="space-y-6">
            {/* Informações Básicas */}
            <div>
              <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Informações Básicas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nome do Pátio *"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>

            {/* Dimensões */}
            <div>
              <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Dimensões Físicas</h4>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 200"
                  value={formData.largura}
                  onChange={(e) => setFormData({ ...formData, largura: e.target.value })}
                  className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 150"
                  value={formData.comprimento}
                  onChange={(e) => setFormData({ ...formData, comprimento: e.target.value })}
                  className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>

            {/* Estrutura */}
            <div>
              <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Estrutura do Pátio</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Blocos</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.blocos}
                    onChange={(e) => setFormData({ ...formData, blocos: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Ruas/Bloco</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.ruas}
                    onChange={(e) => setFormData({ ...formData, ruas: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Lotes/Rua</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.lotes}
                    onChange={(e) => setFormData({ ...formData, lotes: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Posições/Lote</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.posicoes}
                    onChange={(e) => setFormData({ ...formData, posicoes: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            {/* Equipamento */}
            <div>
              <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Equipamento e Altura</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={formData.equipamento}
                  onChange={(e) => setFormData({ ...formData, equipamento: e.target.value })}
                  className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="top_loader">Top Loader (4 níveis)</option>
                  <option value="reach_stacker">Reach Stacker (6 níveis)</option>
                  <option value="rtg">RTG (7 níveis)</option>
                </select>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Níveis Máximos (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.niveis_maximos}
                    onChange={(e) => setFormData({ ...formData, niveis_maximos: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            {/* Capacidade */}
            <div className="bg-blue-900 bg-opacity-20 border border-blue-600 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                <strong>Capacidade Total:</strong> {calcularCapacidade()} posições
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={handleCriarPatio}
                disabled={loading || !formData.nome || !formData.largura || !formData.comprimento || 
                         !formData.blocos || !formData.ruas || !formData.lotes || 
                         !formData.posicoes || !formData.niveis_maximos}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Criando...' : 'Criar Pátio'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}