export enum TipoContainer {
  GP20 = "20GP",
  GP40 = "40GP",
  HC40 = "40HC",
}

export enum StatusContainer {
  AGUARDANDO = "aguardando",
  ALOCADO = "alocado",
}

export interface Container {
  id: string;
  tipo: TipoContainer;
  cliente: string;
  data_entrada: string;
  status: StatusContainer;
  posicao_linha?: number;
  posicao_coluna?: number;
}

export interface ConfiguracaoPatio {
  linhas: number;
  colunas: number;
}

export interface Vaga {
  linha: number;
  coluna: number;
  ocupada: boolean;
  container_id?: string;
}

export interface ResultadoAlocacao {
  container_id: string;
  tipo: string;
  posicao?: string;
  sucesso: boolean;
  mensagem?: string;
}
