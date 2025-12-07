'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, MapPin, ArrowRight, Settings } from 'lucide-react';

interface Patio {
  id: number;
  nome: string;
  ativo: boolean;
  niveis_maximos: number;
  equipamento: string;
}

export default function PatioSelectorPage() {
  const router = useRouter();
  const [patios, setPatios] = useState<Patio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPatios();
  }, []);

  const carregarPatios = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/patios?ativo=true');
      const data = await response.json();
      const patiosAtivos = data.patios || [];
      
      setPatios(patiosAtivos);
      
      // LÓGICA INTELIGENTE: Se só tem 1 pátio, redireciona automaticamente
      if (patiosAtivos.length === 1) {
        router.push(`/dashboard/patio/visualizar?id=${patiosAtivos[0].id}`);
      }
    } catch (error) {
      console.error('Erro ao carregar pátios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando pátios...</p>
        </div>
      </div>
    );
  }

  // Se não tem pátios
  if (patios.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen p-8">
        <div className="text-center max-w-md">
          <Layers className="w-24 h-24 text-gray-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Nenhum pátio configurado</h2>
          <p className="text-gray-400 mb-6">
            Configure a estrutura do pátio (Blocos, Ruas, Lotes e Posições) para começar a visualizar e alocar contêineres.
          </p>
          <button
            onClick={() => router.push('/dashboard/patios/gerenciar')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            Configurar Pátio
          </button>
        </div>
      </div>
    );
  }

  // Se tem 2 ou mais pátios, mostra seletor
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6">
            <Layers className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Selecione o Pátio</h1>
          <p className="text-gray-400 text-lg">Escolha qual pátio deseja visualizar</p>
        </div>

        {/* Grid de Pátios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {patios.map((patio) => (
            <button
              key={patio.id}
              onClick={() => router.push(`/dashboard/patio/visualizar?id=${patio.id}`)}
              className="group bg-gray-900 border-2 border-gray-800 hover:border-blue-500 rounded-2xl p-8 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
            >
              {/* Ícone */}
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors">
                <Layers className="w-8 h-8 text-white" />
              </div>

              {/* Info */}
              <div className="text-left mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{patio.nome}</h3>
                <p className="text-gray-400 text-sm mb-4">Pátio #{patio.id}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Equipamento:</span>
                    <span className="text-gray-300 font-medium">
                      {patio.equipamento.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Níveis:</span>
                    <span className="text-gray-300 font-medium">{patio.niveis_maximos}</span>
                  </div>
                </div>
              </div>

              {/* Botão */}
              <div className="flex items-center justify-between text-blue-400 group-hover:text-blue-300 pt-6 border-t border-gray-800">
                <span className="font-medium">Ver pátio</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        {/* Footer com link para gerenciar */}
        <div className="text-center">
          <button
            onClick={() => router.push('/dashboard/patios/gerenciar')}
            className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
          >
            <Settings className="w-5 h-5" />
            Gerenciar Pátios
          </button>
        </div>
      </div>
    </div>
  );
}
