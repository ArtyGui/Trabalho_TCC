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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    largura: '',
    comprimento: '',
    blocos: '',
    ruas: '',
    lotes: '',
    posicoes: '',
    equipamento: 'reach_stacker',
    niveis_maximos: '',
    imagemPlanta: ''
  });

  useEffect(() => {
    carregarPatios();
  }, []);

  const carregarPatios = async () => {
    try {
      // Busca apenas pátios ativos
      const response = await fetch('http://localhost:8000/patios?ativo=true');
      const data = await response.json();
      setPatios(data.patios || []);
    } catch (error) {
      console.error('Erro ao carregar pátios:', error);
    }
  };

  const handleImagemUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande! Máximo 10MB');
      return;
    }

    setUploadingImage(true);

    try {
      // Converte para base64 para preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagemPreview(base64String);
        setFormData({ ...formData, imagemPlanta: base64String });
      };
      reader.readAsDataURL(file);

      // Simula processamento (você pode adicionar OCR ou análise aqui)
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao processar imagem');
    } finally {
      setUploadingImage(false);
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
        niveis_maximos: '',
        imagemPlanta: ''
      });
      setImagemPreview(null);
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
    if (!confirm('⚠️ ATENÇÃO!\n\nDeseja realmente EXCLUIR este pátio?\n\nEsta ação não pode ser desfeita!\nTodos os dados do pátio serão permanentemente removidos.')) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/patios/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao deletar pátio');
      }
      
      await carregarPatios();
      alert('✅ Pátio excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao deletar:', error);
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Largura */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2 font-medium">
                    📏 Largura (metros)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ex: 200"
                    value={formData.largura}
                    onChange={(e) => setFormData({ ...formData, largura: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">Largura do pátio em metros</p>
                </div>

                {/* Comprimento */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2 font-medium">
                    📐 Comprimento (metros)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ex: 150"
                    value={formData.comprimento}
                    onChange={(e) => setFormData({ ...formData, comprimento: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comprimento do pátio em metros</p>
                </div>
              </div>

              {/* Área Calculada */}
              {formData.largura && formData.comprimento && (
                <div className="mt-4 p-4 bg-blue-900 bg-opacity-20 border border-blue-600 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                      <span className="text-sm text-gray-300">Área Total:</span>
                    </div>
                    <span className="text-lg font-bold text-blue-400">
                      {(parseInt(formData.largura) * parseInt(formData.comprimento)).toLocaleString('pt-BR')} m²
                    </span>
                  </div>
                  <p className="text-xs text-blue-300 mt-2">
                    {formData.largura}m × {formData.comprimento}m
                  </p>
                </div>
              )}
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

            {/* Imagem da Planta */}
            <div>
              <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Imagem da Planta do Pátio</h4>
              
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  id="imagemPatio"
                  accept="image/*"
                  onChange={handleImagemUpload}
                  className="hidden"
                />
                
                {uploadingImage ? (
                  <div className="py-8">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">Processando imagem...</p>
                    <p className="text-xs text-gray-500 mt-2">Extraindo informações da planta</p>
                  </div>
                ) : imagemPreview ? (
                  <div className="space-y-4">
                    <img 
                      src={imagemPreview} 
                      alt="Preview da planta" 
                      className="max-h-64 mx-auto rounded-lg border border-gray-700"
                    />
                    <div className="flex gap-3 justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setImagemPreview(null);
                          setFormData({ ...formData, imagemPlanta: '' });
                        }}
                        className="text-red-400 hover:text-red-300 text-sm font-medium"
                      >
                        Remover imagem
                      </button>
                      <label
                        htmlFor="imagemPatio"
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium cursor-pointer"
                      >
                        Trocar imagem
                      </label>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="imagemPatio" className="cursor-pointer block">
                    <div className="py-8">
                      <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-400 font-medium mb-2">Clique para adicionar a planta do pátio</p>
                      <p className="text-xs text-gray-500">PNG, JPG ou PDF até 10MB</p>
                    </div>
                  </label>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                📸 A imagem da planta será usada como referência visual do layout do pátio
              </p>
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