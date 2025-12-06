'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Upload, MapPin, Ruler, Building2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { patioAPI } from '@/lib/api';

export default function ConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '',
    largura: '',
    comprimento: '',
    numeroBlocos: '',
    ruasPorBloco: '',
    lotesPorRua: '',
    posicoesPorLote: '',
    observacoes: '',
  });
  
  const [imagemPlanta, setImagemPlanta] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validação do tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setErro('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      // Validação do tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErro('Imagem muito grande. Máximo: 5MB');
        return;
      }

      setNomeArquivo(file.name);
      setErro('');

      // Converte para base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemPlanta(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const simularProcessamentoImagem = async () => {
    setProcessando(true);
    // Simula análise da imagem
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessando(false);
  };

  const calcularTotais = () => {
    const blocos = parseInt(formData.numeroBlocos) || 0;
    const ruas = parseInt(formData.ruasPorBloco) || 0;
    const lotes = parseInt(formData.lotesPorRua) || 0;
    const posicoes = parseInt(formData.posicoesPorLote) || 0;
    const largura = parseFloat(formData.largura) || 0;
    const comprimento = parseFloat(formData.comprimento) || 0;

    return {
      totalPosicoes: blocos * ruas * lotes * posicoes,
      areaTotal: largura * comprimento
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso(false);

    // Validações
    if (!formData.nome) {
      setErro('Nome do pátio é obrigatório');
      return;
    }

    const largura = parseFloat(formData.largura);
    const comprimento = parseFloat(formData.comprimento);
    const numeroBlocos = parseInt(formData.numeroBlocos);
    const ruasPorBloco = parseInt(formData.ruasPorBloco);
    const lotesPorRua = parseInt(formData.lotesPorRua);
    const posicoesPorLote = parseInt(formData.posicoesPorLote);

    if (!largura || largura <= 0) {
      setErro('Largura inválida');
      return;
    }

    if (!comprimento || comprimento <= 0) {
      setErro('Comprimento inválido');
      return;
    }

    if (!numeroBlocos || numeroBlocos < 1) {
      setErro('Número de blocos inválido');
      return;
    }

    if (!ruasPorBloco || ruasPorBloco < 1) {
      setErro('Número de ruas inválido');
      return;
    }

    if (!lotesPorRua || lotesPorRua < 1) {
      setErro('Número de lotes inválido');
      return;
    }

    if (!posicoesPorLote || posicoesPorLote < 1) {
      setErro('Número de posições inválido');
      return;
    }

    try {
      setLoading(true);

      // Simula processamento da imagem se foi enviada
      if (imagemPlanta) {
        await simularProcessamentoImagem();
      }

      // Envia configuração para API
      const config = {
        nome: formData.nome,
        largura,
        comprimento,
        numeroBlocos,
        ruasPorBloco,
        lotesPorRua,
        posicoesPorLote,
        imagemPlanta: imagemPlanta || undefined,
        observacoes: formData.observacoes || undefined
      };

      await patioAPI.configurar(config);

      setSucesso(true);
      
      // Redireciona após sucesso
      setTimeout(() => {
        router.push('/dashboard/patio');
      }, 2000);

    } catch (error: any) {
      setErro(error.message || 'Erro ao configurar pátio');
    } finally {
      setLoading(false);
    }
  };

  const totais = calcularTotais();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Configurar Pátio</h1>
        <p className="text-gray-400">Configure a estrutura do seu pátio de contêineres</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Informações Básicas */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-white">Informações Básicas</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome do Pátio *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Ex: Pátio Santos - Terminal A"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Dimensões Físicas */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Ruler className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-white">Dimensões Físicas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Largura (metros) *
              </label>
              <input
                type="number"
                name="largura"
                value={formData.largura}
                onChange={handleInputChange}
                placeholder="200"
                min="1"
                step="0.1"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Comprimento (metros) *
              </label>
              <input
                type="number"
                name="comprimento"
                value={formData.comprimento}
                onChange={handleInputChange}
                placeholder="150"
                min="1"
                step="0.1"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Área Total
              </label>
              <div className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white">
                {totais.areaTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²
              </div>
            </div>
          </div>
        </div>

        {/* Estrutura Organizacional */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold text-white">Estrutura Organizacional</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Número de Blocos *
              </label>
              <input
                type="number"
                name="numeroBlocos"
                value={formData.numeroBlocos}
                onChange={handleInputChange}
                placeholder="4"
                min="1"
                max="10"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">Blocos serão nomeados: A, B, C, D...</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ruas por Bloco *
              </label>
              <input
                type="number"
                name="ruasPorBloco"
                value={formData.ruasPorBloco}
                onChange={handleInputChange}
                placeholder="3"
                min="1"
                max="20"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">Ex: Rua 1, Rua 2, Rua 3...</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lotes por Rua *
              </label>
              <input
                type="number"
                name="lotesPorRua"
                value={formData.lotesPorRua}
                onChange={handleInputChange}
                placeholder="5"
                min="1"
                max="50"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">Ex: Lote 1, Lote 2, Lote 3...</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Posições por Lote *
              </label>
              <input
                type="number"
                name="posicoesPorLote"
                value={formData.posicoesPorLote}
                onChange={handleInputChange}
                placeholder="4"
                min="1"
                max="10"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">Posições onde containers serão alocados</p>
            </div>
          </div>

          {/* Total de Posições */}
          <div className="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-medium">Total de Posições:</span>
              <span className="text-3xl font-bold text-blue-400">
                {totais.totalPosicoes.toLocaleString('pt-BR')}
              </span>
            </div>
            <p className="text-xs text-blue-300 mt-2">
              {formData.numeroBlocos} blocos × {formData.ruasPorBloco} ruas × {formData.lotesPorRua} lotes × {formData.posicoesPorLote} posições
            </p>
          </div>
        </div>

        {/* Upload de Imagem */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Upload className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-white">Planta do Pátio</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Anexar Imagem da Planta (Opcional)
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center gap-3 px-6 py-8 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-yellow-500 transition-colors">
                  <Upload className="w-6 h-6 text-gray-400" />
                  <div className="text-center">
                    <p className="text-sm text-gray-400">
                      {nomeArquivo || 'Clique para selecionar uma imagem'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImagemChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Preview da Imagem */}
            {imagemPlanta && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-300 mb-2">Preview:</p>
                <div className="relative rounded-lg overflow-hidden border border-gray-700">
                  <img
                    src={imagemPlanta}
                    alt="Planta do pátio"
                    className="w-full h-64 object-contain bg-gray-800"
                  />
                </div>
              </div>
            )}

            {/* Indicador de Processamento */}
            {processando && (
              <div className="bg-yellow-900 bg-opacity-20 border border-yellow-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                  <span className="text-yellow-400 font-medium">
                    Analisando planta do pátio...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Observações */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Observações</h2>
          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleInputChange}
            placeholder="Informações adicionais sobre o pátio..."
            rows={4}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Mensagens */}
        {erro && (
          <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-400">{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="bg-green-900 bg-opacity-20 border border-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-green-400">Pátio configurado com sucesso! Redirecionando...</span>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Configuração
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}