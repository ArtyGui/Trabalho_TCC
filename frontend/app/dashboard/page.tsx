'use client';

import { useEffect, useState } from 'react';
import { Package, MapPin, Clock, Layers, TrendingUp, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Patio {
  id: number;
  nome: string;
  ativo: boolean;
  niveis_maximos: number;
  equipamento: string;
}

interface Stats {
  totalContainers: number;
  alocados: number;
  aguardando: number;
  saindoEmBreve: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [patios, setPatios] = useState<Patio[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalContainers: 0,
    alocados: 0,
    aguardando: 0,
    saindoEmBreve: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const [patiosRes, containersRes] = await Promise.all([
        fetch('http://localhost:8000/patios?ativo=true'),
        fetch('http://localhost:8000/containers')
      ]);

      const patiosData = await patiosRes.json();
      const containersData = await containersRes.json();

      setPatios(patiosData.patios || []);

      const containers = containersData.containers || [];
      const alocados = containers.filter((c: any) => c.status === 'alocado').length;
      const aguardando = containers.filter((c: any) => c.status === 'aguardando').length;

      // Conta containers saindo em breve (próximos 7 dias)
      const saindoEmBreve = containers.filter((c: any) => {
        if (!c.data_saida_prevista) return false;
        const saida = new Date(c.data_saida_prevista);
        const hoje = new Date();
        const diff = (saida.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      }).length;

      setStats({
        totalContainers: containers.length,
        alocados,
        aguardando,
        saindoEmBreve
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Visão geral do sistema de alocação</p>
      </div>

      {/* Stats Containers */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Contêineres</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-400">Total de Contêineres</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalContainers}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-400">Contêineres Alocados</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.alocados}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-400">Aguardando Alocação</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.aguardando}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-400">Saindo em Breve</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.saindoEmBreve}</p>
            <p className="text-xs text-gray-500 mt-1">Próximos 7 dias</p>
          </div>
        </div>
      </div>

      {/* Pátios */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Pátios Ativos</h2>
          <button
            onClick={() => router.push('/dashboard/patios/gerenciar')}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            Gerenciar Pátios
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {patios.length === 0 ? (
          <div className="bg-orange-900 bg-opacity-20 border border-orange-600 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-white">Pátio não configurado</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Configure a estrutura do pátio (Blocos, Ruas, Lotes e Posições) para começar a alocar contêineres.
            </p>
            <button
              onClick={() => router.push('/dashboard/patios/gerenciar')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
            >
              Configurar Pátio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patios.map(patio => (
              <button
                key={patio.id}
                onClick={() => router.push(`/dashboard/patio/visualizar?id=${patio.id}`)}
                className="bg-gray-900 border border-gray-800 hover:border-blue-500 rounded-lg p-6 transition-all hover:scale-105 text-left"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Layers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{patio.nome}</h3>
                    <p className="text-sm text-gray-400">Pátio #{patio.id}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Equipamento:</span>
                    <span className="text-white font-medium">
                      {patio.equipamento.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Níveis:</span>
                    <span className="text-white font-medium">{patio.niveis_maximos}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center justify-between text-blue-400">
                    <span className="text-sm">Ver detalhes</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
