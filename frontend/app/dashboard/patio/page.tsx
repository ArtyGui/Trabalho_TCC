'use client';

import { useEffect, useState } from 'react';
import { MapPin, Package, RefreshCw, Settings, Eye, EyeOff, User, Calendar, Truck, X } from 'lucide-react';
import { patioAPI, containerAPI } from '@/lib/api';

interface Container {
  id: string;
  tipo: '20GP' | '40GP' | '40HC';
  cliente: string;
  data_entrada: string;
  status: 'aguardando' | 'alocado';
  endereco?: string;
  bloco?: string;
  rua?: string;
  lote?: string;
  posicao?: string;
}

interface Posicao {
  id: string;
  nome: string;
  loteId: string;
  blocoNome: string;
  ruaNome: string;
  loteNome: string;
  ocupada: boolean;
  containerId?: string;
}

export default function PatioPage() {
  const [patio, setPatio] = useState<any>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocoSelecionado, setBlocoSelecionado] = useState<string | null>(null);
  const [mostrarPlanta, setMostrarPlanta] = useState(false);
  const [containerSelecionado, setContainerSelecionado] = useState<Container | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [patioData, containersData] = await Promise.all([
        patioAPI.obter(),
        containerAPI.listar()
      ]);
      setPatio(patioData);
      setContainers(containersData.containers || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContainerByPosicao = (posicao: Posicao): Container | null => {
    if (!posicao.containerId) return null;
    return containers.find(c => c.id === posicao.containerId) || null;
  };

  const handleClickPosicao = (posicao: Posicao) => {
    if (posicao.ocupada && posicao.containerId) {
      const container = getContainerByPosicao(posicao);
      if (container) {
        setContainerSelecionado(container);
        setMostrarModal(true);
      }
    }
  };

  const fecharModal = () => {
    setMostrarModal(false);
    setContainerSelecionado(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando pátio...</p>
        </div>
      </div>
    );
  }

  if (!patio) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Pátio não configurado</h2>
          <p className="text-gray-400 mb-6">Configure a estrutura do pátio primeiro</p>
          <a
            href="/dashboard/config"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Settings className="w-5 h-5" />
            Configurar Pátio
          </a>
        </div>
      </div>
    );
  }

  // Agrupa posições por bloco
  const blocos = patio.posicoes.reduce((acc: any, posicao: Posicao) => {
    if (!acc[posicao.blocoNome]) {
      acc[posicao.blocoNome] = [];
    }
    acc[posicao.blocoNome].push(posicao);
    return acc;
  }, {});

  // Estatísticas por bloco
  const estatisticasBlocos = Object.keys(blocos).map((blocoNome) => {
    const posicoesBloco = blocos[blocoNome];
    const ocupadas = posicoesBloco.filter((p: Posicao) => p.ocupada).length;
    const total = posicoesBloco.length;
    const livres = total - ocupadas;
    const percentual = (ocupadas / total) * 100;

    return { blocoNome, total, ocupadas, livres, percentual };
  });

  // Detalhes do bloco selecionado
  const detalhesBloco = blocoSelecionado ? blocos[blocoSelecionado] : null;

  // Agrupa por rua e lote
  const agruparPorRuaLote = (posicoes: Posicao[]) => {
    const ruas: any = {};
    
    posicoes.forEach((posicao) => {
      if (!ruas[posicao.ruaNome]) {
        ruas[posicao.ruaNome] = {};
      }
      if (!ruas[posicao.ruaNome][posicao.loteNome]) {
        ruas[posicao.ruaNome][posicao.loteNome] = [];
      }
      ruas[posicao.ruaNome][posicao.loteNome].push(posicao);
    });

    return ruas;
  };

  const ruasLotes = detalhesBloco ? agruparPorRuaLote(detalhesBloco) : null;

  // Renderiza posição com lógica especial para containers 40GP/40HC
  const renderPosicao = (posicao: Posicao, index: number, posicoesLote: Posicao[]) => {
    const container = getContainerByPosicao(posicao);
    
    // Se não está ocupada, renderiza normalmente
    if (!posicao.ocupada || !container) {
      return (
        <div
          key={posicao.id}
          className="aspect-square rounded-lg flex flex-col items-center justify-center transition-all bg-green-600 hover:bg-green-500"
          title={posicao.id}
        >
          <span className="text-xs text-white font-medium">
            {posicao.nome.replace('Pos ', '')}
          </span>
        </div>
      );
    }

    // Container 40GP ou 40HC ocupa 2 posições
    const ocupa2Posicoes = container.tipo === '40GP' || container.tipo === '40HC';
    
    if (ocupa2Posicoes) {
      // Verifica se é a primeira posição do container
      const posicaoIndex = parseInt(posicao.nome.replace('Pos ', ''));
      const proximaPosicao = posicoesLote[index + 1];
      
      // Se a próxima posição também pertence ao mesmo container, esta é a primeira
      const ehPrimeiraPosicao = proximaPosicao && proximaPosicao.containerId === container.id;
      
      if (ehPrimeiraPosicao) {
        // Renderiza container expandido ocupando 2 posições
        return (
          <button
            key={posicao.id}
            onClick={() => handleClickPosicao(posicao)}
            className="col-span-2 aspect-[2/1] rounded-lg flex items-center justify-center gap-2 transition-all bg-red-600 hover:bg-red-500 cursor-pointer group"
            title={`${container.id} - ${container.tipo}`}
          >
            <Package className="w-5 h-5 text-white" />
            <div className="text-center">
              <p className="text-sm text-white font-bold">{container.tipo}</p>
              <p className="text-xs text-white opacity-90">{posicao.nome.replace('Pos ', '')}-{proximaPosicao.nome.replace('Pos ', '')}</p>
            </div>
          </button>
        );
      } else {
        // Se é a segunda posição, não renderiza (já foi renderizada junto com a primeira)
        const posicaoAnterior = posicoesLote[index - 1];
        if (posicaoAnterior && posicaoAnterior.containerId === container.id) {
          return null;
        }
      }
    }

    // Container 20GP ocupa 1 posição apenas
    return (
      <button
        key={posicao.id}
        onClick={() => handleClickPosicao(posicao)}
        className="aspect-square rounded-lg flex flex-col items-center justify-center transition-all bg-red-600 hover:bg-red-500 cursor-pointer"
        title={`${container.id} - ${container.tipo}`}
      >
        <Package className="w-4 h-4 text-white mb-1" />
        <p className="text-xs text-white font-medium">{container.tipo}</p>
        <p className="text-xs text-white opacity-75">{posicao.nome.replace('Pos ', '')}</p>
      </button>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Visualização do Pátio</h1>
          <p className="text-gray-400">{patio.config.nome}</p>
        </div>
        <div className="flex gap-3">
          {patio.config.imagemPlanta && (
            <button
              onClick={() => setMostrarPlanta(!mostrarPlanta)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors border border-gray-700"
            >
              {mostrarPlanta ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              {mostrarPlanta ? 'Ocultar' : 'Ver'} Planta
            </button>
          )}
          <button
            onClick={carregarDados}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors border border-gray-700"
          >
            <RefreshCw className="w-5 h-5" />
            Atualizar
          </button>
          <a
            href="/dashboard/config"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
            Reconfigurar
          </a>
        </div>
      </div>

      {/* Planta do Pátio */}
      {mostrarPlanta && patio.config.imagemPlanta && (
        <div className="mb-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Planta do Pátio</h3>
          <img
            src={patio.config.imagemPlanta}
            alt="Planta do Pátio"
            className="w-full max-h-96 object-contain rounded-lg"
          />
        </div>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-400">Total de Posições</span>
          </div>
          <p className="text-3xl font-bold text-white">{patio.estatisticas.totalPosicoes}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-400">Posições Ocupadas</span>
          </div>
          <p className="text-3xl font-bold text-white">{patio.estatisticas.posicoesOcupadas}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-400">Posições Livres</span>
          </div>
          <p className="text-3xl font-bold text-white">{patio.estatisticas.posicoesLivres}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-400">Taxa de Ocupação</span>
          </div>
          <p className="text-3xl font-bold text-white">{patio.estatisticas.percentualOcupacao.toFixed(1)}%</p>
        </div>
      </div>

      {/* Informações da Estrutura */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Estrutura do Pátio</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-400">Dimensões</p>
            <p className="text-lg font-semibold text-white">
              {patio.config.largura}m × {patio.config.comprimento}m
            </p>
            <p className="text-xs text-gray-500">{patio.config.areaTotal.toLocaleString()} m²</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Blocos</p>
            <p className="text-lg font-semibold text-white">{patio.config.numeroBlocos}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Ruas por Bloco</p>
            <p className="text-lg font-semibold text-white">{patio.config.ruasPorBloco}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Lotes por Rua</p>
            <p className="text-lg font-semibold text-white">{patio.config.lotesPorRua}</p>
          </div>
        </div>
      </div>

      {/* Blocos */}
      <h2 className="text-2xl font-bold text-white mb-4">Blocos do Pátio</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {estatisticasBlocos.map((bloco) => (
          <button
            key={bloco.blocoNome}
            onClick={() => setBlocoSelecionado(blocoSelecionado === bloco.blocoNome ? null : bloco.blocoNome)}
            className={`bg-gray-900 border-2 rounded-lg p-6 transition-all hover:scale-105 ${
              blocoSelecionado === bloco.blocoNome ? 'border-blue-500' : 'border-gray-800'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Bloco {bloco.blocoNome}</h3>
              <span className="text-2xl font-bold text-blue-500">{bloco.blocoNome}</span>
            </div>
            <div className="space-y-2 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total:</span>
                <span className="text-white font-semibold">{bloco.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Ocupadas:</span>
                <span className="text-green-400 font-semibold">{bloco.ocupadas}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Livres:</span>
                <span className="text-purple-400 font-semibold">{bloco.livres}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Ocupação:</span>
                <span className="text-white font-semibold">{bloco.percentual.toFixed(0)}%</span>
              </div>
            </div>
            <div className="mt-4 bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all"
                style={{ width: `${bloco.percentual}%` }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Detalhes do Bloco */}
      {blocoSelecionado && ruasLotes && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Detalhes - Bloco {blocoSelecionado}</h2>

          {Object.keys(ruasLotes).map((ruaNome) => (
            <div key={ruaNome} className="mb-8">
              <h3 className="text-lg font-semibold text-blue-400 mb-4">{ruaNome}</h3>

              {Object.keys(ruasLotes[ruaNome]).map((loteNome) => {
                const posicoesLote = ruasLotes[ruaNome][loteNome];
                
                return (
                  <div key={loteNome} className="mb-6">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">{loteNome}</h4>

                    <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2">
                      {posicoesLote.map((posicao: Posicao, index: number) => 
                        renderPosicao(posicao, index, posicoesLote)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legenda */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded" />
              <span className="text-sm text-gray-400">Posição Livre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-red-600 rounded" />
              <span className="text-sm text-gray-400">Container 20GP (1 posição)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-4 bg-red-600 rounded" />
              <span className="text-sm text-gray-400">Container 40GP/40HC (2 posições)</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Container */}
      {mostrarModal && containerSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Detalhes do Contêiner</h2>
                  <p className="text-sm text-gray-400">Informações completas</p>
                </div>
              </div>
              <button
                onClick={fecharModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 space-y-6">
              {/* Identificação */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">IDENTIFICAÇÃO</h3>
                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">ID do Contêiner:</span>
                    <span className="text-white font-mono font-semibold">{containerSelecionado.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Tipo:</span>
                    <span className="bg-blue-900 text-blue-300 px-3 py-1 rounded font-medium">
                      {containerSelecionado.tipo}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded font-medium ${
                      containerSelecionado.status === 'alocado'
                        ? 'bg-green-900 text-green-300'
                        : 'bg-yellow-900 text-yellow-300'
                    }`}>
                      {containerSelecionado.status === 'alocado' ? '✓ Alocado' : '⏱ Aguardando'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cliente */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">CLIENTE</h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{containerSelecionado.cliente}</p>
                      <p className="text-sm text-gray-400">Proprietário do contêiner</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data de Entrada */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">ENTRADA NO PÁTIO</h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {new Date(containerSelecionado.data_entrada).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(containerSelecionado.data_entrada).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Localização */}
              {containerSelecionado.endereco && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">LOCALIZAÇÃO</h3>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{containerSelecionado.endereco}</p>
                        <p className="text-sm text-gray-400">Endereço completo no pátio</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-700">
                      <div>
                        <p className="text-xs text-gray-500">Bloco</p>
                        <p className="text-sm text-white font-semibold">{containerSelecionado.bloco}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Rua</p>
                        <p className="text-sm text-white font-semibold">{containerSelecionado.rua}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Lote</p>
                        <p className="text-sm text-white font-semibold">{containerSelecionado.lote}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Posição</p>
                        <p className="text-sm text-white font-semibold">{containerSelecionado.posicao}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Especificações Técnicas */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">ESPECIFICAÇÕES TÉCNICAS</h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Truck className="w-5 h-5 text-gray-400" />
                    <span className="text-white font-semibold">
                      {containerSelecionado.tipo === '20GP' && 'Container de 20 pés (GP)'}
                      {containerSelecionado.tipo === '40GP' && 'Container de 40 pés (GP)'}
                      {containerSelecionado.tipo === '40HC' && 'Container de 40 pés High Cube (HC)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Comprimento</p>
                      <p className="text-white">
                        {containerSelecionado.tipo === '20GP' && '6.06m'}
                        {(containerSelecionado.tipo === '40GP' || containerSelecionado.tipo === '40HC') && '12.19m'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Largura</p>
                      <p className="text-white">2.44m</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Altura</p>
                      <p className="text-white">
                        {containerSelecionado.tipo === '40HC' ? '2.90m' : '2.59m'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Posições Ocupadas</p>
                      <p className="text-white">
                        {containerSelecionado.tipo === '20GP' ? '1' : '2'} posição(ões)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
              <button
                onClick={fecharModal}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
