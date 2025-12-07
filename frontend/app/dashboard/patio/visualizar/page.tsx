'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MapPin, Package, RefreshCw, Settings, Layers, Clock, X, ArrowLeft, Scale, Calendar, User, Box } from 'lucide-react';

interface Container {
  id: string;
  tipo: '20GP' | '40GP' | '40HC';
  cliente: string;
  peso: number;
  data_entrada: string;
  data_saida_prevista: string;
  status: 'aguardando' | 'alocado';
  endereco?: string;
  bloco?: string;
  rua?: string;
  lote?: string;
  posicao?: string;
  nivel?: number;
}

interface Posicao {
  id: string;
  nome: string;
  loteId: string;
  blocoNome: string;
  ruaNome: string;
  loteNome: string;
  nivel: number;
  patio_id: number;
  ocupada: boolean;
  containerId?: string;
}

export default function PatioVisualizarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patioId = searchParams.get('id');
  
  const [patio, setPatio] = useState<any>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocoSelecionado, setBlocoSelecionado] = useState<string | null>(null);
  const [containerSelecionado, setContainerSelecionado] = useState<Container | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    if (patioId) {
      carregarDados();
    } else {
      router.push('/dashboard/patio');
    }
  }, [patioId]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [patioData, containersData] = await Promise.all([
        fetch(`http://localhost:8000/patios/${patioId}`).then(r => r.json()),
        fetch('http://localhost:8000/containers').then(r => r.json())
      ]);
      
      console.log('📊 PÁTIO CARREGADO:', patioData);
      console.log('📦 Total de posições:', patioData.posicoes.length);
      
      setPatio(patioData);
      setContainers(containersData.containers || []);
      
      if (patioData && patioData.posicoes.length > 0) {
        setBlocoSelecionado(patioData.posicoes[0].blocoNome);
      }
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

  const isContainerAgendado = (container: Container): boolean => {
    const saida = new Date(container.data_saida_prevista);
    const hoje = new Date();
    const diff = (saida.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  const getDiasParaSaida = (container: Container): number => {
    const saida = new Date(container.data_saida_prevista);
    const hoje = new Date();
    return Math.ceil((saida.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getCorPorNivel = (nivel: number, ocupada: boolean, container?: Container | null) => {
    if (!ocupada) {
      const intensidades = ['bg-green-700', 'bg-green-600', 'bg-green-500', 'bg-green-400', 'bg-green-300', 'bg-green-200', 'bg-green-100'];
      return intensidades[nivel - 1] || 'bg-green-500';
    }
    
    if (container && isContainerAgendado(container)) {
      return 'bg-orange-500 animate-pulse';
    }
    
    const intensidades = ['bg-red-700', 'bg-red-600', 'bg-red-500', 'bg-red-400', 'bg-pink-500', 'bg-pink-400', 'bg-pink-300'];
    return intensidades[nivel - 1] || 'bg-red-600';
  };

  const getCorBordaPorNivel = (nivel: number, ocupada: boolean, container?: Container | null) => {
    if (!ocupada) {
      const intensidades = ['border-green-800', 'border-green-700', 'border-green-600', 'border-green-500', 'border-green-400', 'border-green-300', 'border-green-200'];
      return intensidades[nivel - 1] || 'border-green-600';
    }
    
    if (container && isContainerAgendado(container)) {
      return 'border-orange-600';
    }
    
    const intensidades = ['border-red-800', 'border-red-700', 'border-red-600', 'border-red-500', 'border-pink-600', 'border-pink-500', 'border-pink-400'];
    return intensidades[nivel - 1] || 'border-red-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando pátio...</p>
        </div>
      </div>
    );
  }

  if (!patio) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Pátio não encontrado</h2>
          <a
            href="/dashboard/patio"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors mt-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </a>
        </div>
      </div>
    );
  }

  const blocos = patio.posicoes.reduce((acc: any, posicao: Posicao) => {
    if (!acc[posicao.blocoNome]) {
      acc[posicao.blocoNome] = [];
    }
    acc[posicao.blocoNome].push(posicao);
    return acc;
  }, {});

  const estatisticasBlocos = Object.keys(blocos).map((blocoNome) => {
    const posicoesBloco = blocos[blocoNome];
    const ocupadas = posicoesBloco.filter((p: Posicao) => p.ocupada).length;
    const total = posicoesBloco.length;
    const livres = total - ocupadas;
    const percentual = (ocupadas / total) * 100;
    return { blocoNome, total, ocupadas, livres, percentual };
  });

  // NOVA FUNÇÃO: Organiza grid garantindo TODAS as posições
  const organizarGrid3DCompleto = (posicoesBloco: Posicao[]) => {
    console.log('🔍 Organizando grid para', posicoesBloco.length, 'posições');
    
    // Primeiro, descobre a estrutura completa
    const ruas = new Set<string>();
    const lotes = new Set<string>();
    const posicoes = new Set<string>();
    
    posicoesBloco.forEach(pos => {
      ruas.add(pos.ruaNome);
      lotes.add(pos.loteNome);
      posicoes.add(pos.nome);
    });
    
    const ruasOrdenadas = Array.from(ruas).sort();
    const lotesOrdenados = Array.from(lotes).sort();
    const posicoesOrdenadas = Array.from(posicoes).sort((a, b) => {
      const numA = parseInt(a.replace('Pos ', ''));
      const numB = parseInt(b.replace('Pos ', ''));
      return numA - numB;
    });
    
    console.log('📋 Estrutura:', {
      ruas: ruasOrdenadas,
      lotes: lotesOrdenados,
      posicoes: posicoesOrdenadas
    });
    
    // Cria um mapa para busca rápida
    const mapaPos = new Map<string, Posicao>();
    posicoesBloco.forEach(pos => {
      const chave = `${pos.ruaNome}|${pos.loteNome}|${pos.nome}|${pos.nivel}`;
      mapaPos.set(chave, pos);
    });
    
    // Retorna estrutura organizada
    return {
      ruas: ruasOrdenadas,
      lotes: lotesOrdenados,
      posicoes: posicoesOrdenadas,
      buscarPosicao: (rua: string, lote: string, pos: string, nivel: number): Posicao | null => {
        const chave = `${rua}|${lote}|${pos}|${nivel}`;
        return mapaPos.get(chave) || null;
      }
    };
  };

  const detalhesBloco = blocoSelecionado ? blocos[blocoSelecionado] : null;
  const gridCompleto = detalhesBloco ? organizarGrid3DCompleto(detalhesBloco) : null;
  const niveisMaximos = patio.config.niveis_maximos || 6;
  const containersAgendados = containers.filter(c => c.status === 'alocado' && isContainerAgendado(c)).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.push('/dashboard/patio')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Layers className="w-8 h-8 text-blue-500" />
              {patio.config.nome}
            </h1>
          </div>
          <p className="text-gray-400 ml-12">
            Pátio #{patioId} - {patio.config.equipamento.replace('_', ' ').toUpperCase()}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={carregarDados}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Atualizar
          </button>
          <button
            onClick={() => router.push('/dashboard/patios/gerenciar')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
            Gerenciar Pátios
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-400">Total</span>
          </div>
          <p className="text-3xl font-bold text-white">{patio.estatisticas.totalPosicoes}</p>
          <p className="text-xs text-gray-500 mt-1">{niveisMaximos} níveis</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-400">Ocupadas</span>
          </div>
          <p className="text-3xl font-bold text-white">{patio.estatisticas.posicoesOcupadas}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-400">Livres</span>
          </div>
          <p className="text-3xl font-bold text-white">{patio.estatisticas.posicoesLivres}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-400">Agendados</span>
          </div>
          <p className="text-3xl font-bold text-white">{containersAgendados}</p>
          <p className="text-xs text-gray-500 mt-1">Próximos 7 dias</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-400">Ocupação</span>
          </div>
          <p className="text-3xl font-bold text-white">{patio.estatisticas.percentualOcupacao.toFixed(1)}%</p>
        </div>
      </div>

      {/* Blocos */}
      <h2 className="text-2xl font-bold text-white mb-4">Blocos do Pátio</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {estatisticasBlocos.map((bloco) => (
          <button
            key={bloco.blocoNome}
            onClick={() => setBlocoSelecionado(bloco.blocoNome)}
            className={`bg-gray-900 border-2 rounded-lg p-6 transition-all hover:scale-105 ${
              blocoSelecionado === bloco.blocoNome ? 'border-blue-500' : 'border-gray-800'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Bloco {bloco.blocoNome}</h3>
              <span className="text-2xl font-bold text-blue-500">{bloco.blocoNome}</span>
            </div>
            <div className="space-y-2 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total:</span>
                <span className="text-white font-semibold">{bloco.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ocupadas:</span>
                <span className="text-green-400 font-semibold">{bloco.ocupadas}</span>
              </div>
            </div>
            <div className="mt-4 bg-gray-800 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-full transition-all" style={{ width: `${bloco.percentual}%` }} />
            </div>
          </button>
        ))}
      </div>

      {/* Grid 3D COMPLETO */}
      {blocoSelecionado && gridCompleto && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            Detalhes - Bloco {blocoSelecionado}
          </h2>

          {gridCompleto.ruas.map((ruaNome) => (
            <div key={ruaNome} className="mb-8">
              <h3 className="text-lg font-semibold text-blue-400 mb-4">{ruaNome}</h3>

              {gridCompleto.lotes.map((loteNome) => (
                <div key={loteNome} className="mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">{loteNome}</h4>

                  <div className="overflow-x-auto">
                    <div className="inline-block min-w-full">
                      <div className="flex flex-col gap-1">
                        {/* ITERA TODOS OS NÍVEIS */}
                        {Array.from({ length: niveisMaximos }, (_, idx) => niveisMaximos - idx).map((nivel) => (
                          <div key={nivel} className="flex gap-1 items-center">
                            <div className="w-20 text-right pr-3">
                              <span className="text-xs font-medium text-gray-400">Nível {nivel}</span>
                            </div>

                            {/* ITERA TODAS AS POSIÇÕES */}
                            {gridCompleto.posicoes.map((posNome) => {
                              const posicao = gridCompleto.buscarPosicao(ruaNome, loteNome, posNome, nivel);
                              
                              if (!posicao) {
                                return (
                                  <div key={`${ruaNome}-${loteNome}-${posNome}-${nivel}`} className="w-32 h-16 bg-gray-800 border border-gray-700 rounded flex items-center justify-center">
                                    <span className="text-xs text-gray-600">-</span>
                                  </div>
                                );
                              }

                              const container = getContainerByPosicao(posicao);
                              const corFundo = getCorPorNivel(nivel, posicao.ocupada, container);
                              const corBorda = getCorBordaPorNivel(nivel, posicao.ocupada, container);
                              const isAgendado = container && isContainerAgendado(container);

                              return (
                                <button
                                  key={posicao.id}
                                  onClick={() => handleClickPosicao(posicao)}
                                  className={`w-32 h-16 ${corFundo} border-2 ${corBorda} rounded flex flex-col items-center justify-center transition-all ${
                                    posicao.ocupada ? 'hover:scale-105 cursor-pointer' : ''
                                  } ${isAgendado ? 'ring-2 ring-orange-400' : ''}`}
                                >
                                  {posicao.ocupada && container ? (
                                    <>
                                      {isAgendado ? <Clock className="w-3 h-3 text-white mb-1" /> : <Package className="w-4 h-4 text-white mb-1" />}
                                      <span className="text-xs font-bold text-white">{container.tipo}</span>
                                      <span className="text-xs text-white opacity-75">{posNome.replace('Pos ', '')}</span>
                                    </>
                                  ) : (
                                    <span className="text-xs font-medium text-gray-700">{posNome.replace('Pos ', '')}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Legenda */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <h4 className="text-sm font-semibold text-gray-400 mb-3">LEGENDA:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-700 border-2 border-green-800 rounded" />
                <span className="text-xs text-gray-400">Livre (Base)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-700 border-2 border-red-800 rounded" />
                <span className="text-xs text-gray-400">Ocupado (Base)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-500 border-2 border-orange-600 rounded animate-pulse" />
                <span className="text-xs text-gray-400">Agendado</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal (mesmo do anterior) */}
      {mostrarModal && containerSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 rounded-2xl max-w-3xl w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    isContainerAgendado(containerSelecionado) ? 'bg-orange-500' : 'bg-white bg-opacity-20'
                  }`}>
                    {isContainerAgendado(containerSelecionado) ? <Clock className="w-8 h-8 text-white" /> : <Box className="w-8 h-8 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Detalhes do Contêiner</h2>
                    <p className="text-blue-100">ID: {containerSelecionado.id}</p>
                  </div>
                </div>
                <button onClick={() => setMostrarModal(false)} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Especificações
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Tipo</p>
                    <p className="text-xl font-bold text-blue-400">{containerSelecionado.tipo}</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Peso</p>
                    <p className="text-xl font-bold text-white">{containerSelecionado.peso}t</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <span className="inline-block bg-green-900 text-green-300 px-3 py-1 rounded-full text-xs font-semibold">✓ Alocado</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Cliente
                </h3>
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <p className="text-lg font-semibold text-white">{containerSelecionado.cliente}</p>
                </div>
              </div>

              {containerSelecionado.endereco && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Localização 3D
                  </h3>
                  <div className="bg-gradient-to-r from-blue-900 to-blue-800 bg-opacity-50 rounded-xl p-4 border-2 border-blue-600">
                    <p className="text-white font-semibold text-lg">{containerSelecionado.endereco}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-800 bg-opacity-50 px-6 py-4 flex justify-end border-t border-gray-700">
              <button onClick={() => setMostrarModal(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
