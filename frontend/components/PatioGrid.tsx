'use client';

import { Container, Vaga } from '@/types';
import { Package } from 'lucide-react';

interface PatioGridProps {
  vagas: Vaga[][];
  containers: Container[];
}

export default function PatioGrid({ vagas, containers }: PatioGridProps) {
  if (!vagas || vagas.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Pátio não configurado</p>
      </div>
    );
  }

  const getContainerById = (id?: string) => {
    if (!id) return null;
    return containers.find(c => c.id === id);
  };

  const getVagaColor = (vaga: Vaga) => {
    if (!vaga.ocupada) return 'bg-gray-800 border-gray-700';
    
    const container = getContainerById(vaga.container_id);
    if (!container) return 'bg-gray-700 border-gray-600';

    switch (container.tipo) {
      case '20GP':
        return 'bg-blue-600 border-blue-500';
      case '40GP':
        return 'bg-green-600 border-green-500';
      case '40HC':
        return 'bg-purple-600 border-purple-500';
      default:
        return 'bg-gray-700 border-gray-600';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">
          Visualização do Pátio
        </h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-800 border border-gray-700 rounded"></div>
            <span className="text-gray-400">Vazio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 border border-blue-500 rounded"></div>
            <span className="text-gray-400">20GP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 border border-green-500 rounded"></div>
            <span className="text-gray-400">40GP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-600 border border-purple-500 rounded"></div>
            <span className="text-gray-400">40HC</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {vagas.map((linha, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <div className="w-8 flex items-center justify-center text-gray-500 text-sm font-medium">
                {i + 1}
              </div>
              {linha.map((vaga, j) => {
                const container = getContainerById(vaga.container_id);
                
                return (
                  <div
                    key={`${i}-${j}`}
                    className={`
                      relative w-16 h-16 border-2 rounded-lg transition-all
                      ${getVagaColor(vaga)}
                      ${vaga.ocupada ? 'cursor-pointer hover:opacity-80' : ''}
                    `}
                    title={
                      container
                        ? `${container.id}\n${container.tipo}\n${container.cliente}`
                        : `Linha ${i + 1}, Coluna ${j + 1}\nVago`
                    }
                  >
                    {vaga.ocupada && container && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="w-6 h-6 text-white opacity-60" />
                      </div>
                    )}
                    <div className="absolute bottom-0.5 right-1 text-[10px] text-white opacity-50">
                      {j + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          
          {/* Números das colunas */}
          <div className="flex gap-2 mt-1">
            <div className="w-8"></div>
            {vagas[0]?.map((_, j) => (
              <div
                key={j}
                className="w-16 text-center text-gray-500 text-xs font-medium"
              >
                Col {j + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        Total de vagas: {vagas.length * (vagas[0]?.length || 0)} | 
        Ocupadas: {vagas.flat().filter(v => v.ocupada).length} | 
        Livres: {vagas.flat().filter(v => !v.ocupada).length}
      </div>
    </div>
  );
}
