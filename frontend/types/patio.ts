// types/patio.ts

export interface PatioConfig {
  id?: string;
  nome: string;
  largura: number;
  comprimento: number;
  areaTotal: number;
  numeroBlocos: number;
  ruasPorBloco: number;
  lotesPorRua: number;
  posicoesPorLote: number;
  totalPosicoes: number;
  imagemPlanta?: string; // Base64
  observacoes?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface Bloco {
  id: string;
  nome: string; // A, B, C, D
  ruas: Rua[];
}

export interface Rua {
  id: string;
  nome: string; // Rua 1, Rua 2, etc
  blocoId: string;
  lotes: Lote[];
}

export interface Lote {
  id: string;
  nome: string; // Lote 1, Lote 2, etc
  ruaId: string;
  posicoes: Posicao[];
}

export interface Posicao {
  id: string;
  nome: string; // Posição 1, 2, 3, 4
  loteId: string;
  ocupada: boolean;
  containerId?: string;
  blocoNome: string;
  ruaNome: string;
  loteNome: string;
}

export interface PatioEstrutura {
  config: PatioConfig;
  blocos: Bloco[];
  posicoes: Posicao[];
}

export interface EstatisticasPatio {
  totalPosicoes: number;
  posicoesOcupadas: number;
  posicoesLivres: number;
  percentualOcupacao: number;
  containersAlocados: number;
}