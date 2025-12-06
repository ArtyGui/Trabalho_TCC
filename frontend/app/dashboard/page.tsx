'use client';

import { useEffect, useState } from 'react';
import { patioAPI, containerAPI } from '@/lib/api';
import { Package, MapPin, CheckCircle2, Clock, Building2, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalContainers: 0,
    alocados: 0,
    aguardando: 0,
    vagasTotal: 0,
    vagasOcupadas: 0,
    vagasLivres: 0,
    percentualOcupacao: 0,
    patioConfigurado: false,
    nomePatio: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Busca containers
      const containersData = await containerAPI.listar();
      const containers = containersData.containers || [];
      
      const alocados = containers.filter((c: any) => c.status === 'alocado').length;
      const aguardando = containers.filter((c: any) => c.status === 'aguardando').length;

      // Busca pátio
      let patioData = null;
      let patioConfigurado = false;
      
      try {
        patioData = await patioAPI.obter();
        patioConfigurado = true;
      } catch (error) {
        // Pátio não configurado
      }

      setStats({
        totalContainers: containers.length,
        alocados,
        aguardando,
        vagasTotal: patioData?.estatisticas.totalPosicoes || 0,
        vagasOcupadas: patioData?.estatisticas.posicoesOcupadas || 0,
        vagasLivres: patioData?.estatisticas.posicoesLivres || 0,
        percentualOcupacao: patioData?.estatisticas.percentualOcupacao || 0,
        patioConfigurado,
        nomePatio: patioData?.config.nome || '',
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, href, subtitle }: any) => (
    <Link href={href}>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 hover:scale-105 transition-all cursor-pointer">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg ${color} bg-opacity-10 flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
          </div>
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
        <p className="text-gray-400 text-sm">{label}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">
          {stats.patioConfigurado 
            ? `Visão geral - ${stats.nomePatio}`
            : 'Visão geral do sistema de alocação'}
        </p>
      </div>

      {/* Estatísticas de Containers */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Contêineres</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={Package}
            label="Total de Contêineres"
            value={stats.totalContainers}
            color="bg-blue-500"
            href="/dashboard/containers"
          />
          <StatCard
            icon={CheckCircle2}
            label="Contêineres Alocados"
            value={stats.alocados}
            color="bg-green-500"
            href="/dashboard/containers"
            subtitle={stats.totalContainers > 0 ? `${((stats.alocados / stats.totalContainers) * 100).toFixed(1)}% do total` : ''}
          />
          <StatCard
            icon={Clock}
            label="Aguardando Alocação"
            value={stats.aguardando}
            color="bg-yellow-500"
            href="/dashboard/containers"
            subtitle={stats.totalContainers > 0 ? `${((stats.aguardando / stats.totalContainers) * 100).toFixed(1)}% do total` : ''}
          />
        </div>
      </div>

      {/* Estatísticas do Pátio */}
      {stats.patioConfigurado && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Pátio - {stats.nomePatio}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              icon={Building2}
              label="Total de Posições"
              value={stats.vagasTotal}
              color="bg-purple-500"
              href="/dashboard/patio"
            />
            <StatCard
              icon={Package}
              label="Posições Ocupadas"
              value={stats.vagasOcupadas}
              color="bg-red-500"
              href="/dashboard/patio"
            />
            <StatCard
              icon={MapPin}
              label="Posições Livres"
              value={stats.vagasLivres}
              color="bg-green-500"
              href="/dashboard/patio"
            />
            <StatCard
              icon={BarChart3}
              label="Taxa de Ocupação"
              value={`${stats.percentualOcupacao.toFixed(1)}%`}
              color="bg-cyan-500"
              href="/dashboard/patio"
            />
          </div>
        </div>
      )}

      {/* Alertas e Ações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alerta: Pátio não configurado */}
        {!stats.patioConfigurado && (
          <div className="bg-yellow-900 bg-opacity-20 border border-yellow-800 rounded-lg p-6">
            <h3 className="text-yellow-500 font-semibold mb-2 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Pátio não configurado
            </h3>
            <p className="text-gray-400 mb-4">
              Configure a estrutura do pátio (Blocos, Ruas, Lotes e Posições) para começar a alocar contêineres.
            </p>
            <Link
              href="/dashboard/config"
              className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Configurar Pátio
            </Link>
          </div>
        )}

        {/* Alerta: Sem containers */}
        {stats.patioConfigurado && stats.totalContainers === 0 && (
          <div className="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-6">
            <h3 className="text-blue-500 font-semibold mb-2 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Comece adicionando contêineres
            </h3>
            <p className="text-gray-400 mb-4">
              Adicione contêineres ao sistema para utilizar a alocação inteligente no pátio configurado.
            </p>
            <Link
              href="/dashboard/containers"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Adicionar Contêineres
            </Link>
          </div>
        )}

        {/* Alerta: Containers aguardando */}
        {stats.aguardando > 0 && (
          <div className="bg-orange-900 bg-opacity-20 border border-orange-800 rounded-lg p-6">
            <h3 className="text-orange-500 font-semibold mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {stats.aguardando} {stats.aguardando === 1 ? 'contêiner aguardando' : 'contêineres aguardando'}
            </h3>
            <p className="text-gray-400 mb-4">
              {stats.aguardando === 1 
                ? 'Há 1 contêiner aguardando alocação no pátio.'
                : `Há ${stats.aguardando} contêineres aguardando alocação no pátio.`}
            </p>
            <Link
              href="/dashboard/containers"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Ver Contêineres
            </Link>
          </div>
        )}

        {/* Sucesso: Sistema operacional */}
        {stats.patioConfigurado && stats.totalContainers > 0 && stats.aguardando === 0 && (
          <div className="bg-green-900 bg-opacity-20 border border-green-800 rounded-lg p-6">
            <h3 className="text-green-500 font-semibold mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Sistema operacional
            </h3>
            <p className="text-gray-400 mb-4">
              Todos os {stats.totalContainers} contêineres estão alocados. O pátio está operando normalmente.
            </p>
            <Link
              href="/dashboard/patio"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Visualizar Pátio
            </Link>
          </div>
        )}

        {/* Info: Capacidade */}
        {stats.patioConfigurado && stats.percentualOcupacao > 80 && (
          <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-6">
            <h3 className="text-red-500 font-semibold mb-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Capacidade próxima do limite
            </h3>
            <p className="text-gray-400 mb-4">
              O pátio está com {stats.percentualOcupacao.toFixed(1)}% de ocupação. 
              Apenas {stats.vagasLivres} posições disponíveis.
            </p>
            <Link
              href="/dashboard/patio"
              className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Ver Detalhes
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}