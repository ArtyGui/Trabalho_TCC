// lib/api.ts

const API_BASE_URL = 'http://localhost:8000';

// Helper para obter token
function getAuthHeaders() {
  const token = localStorage.getItem('logibox_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Helper para fazer requisições
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(error.detail || `Erro ${response.status}`);
  }

  return response.json();
}

// API do Pátio
export const patioAPI = {
  configurar: async (config: any) => {
    return fetchAPI('/patio/configurar', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  obter: async () => {
    return fetchAPI('/patio');
  },

  listarBlocos: async () => {
    return fetchAPI('/patio/blocos');
  },

  limpar: async () => {
    return fetchAPI('/patio/limpar', {
      method: 'DELETE',
    });
  },
};

// API de Contêineres
export const containerAPI = {
  adicionar: async (container: any) => {
    return fetchAPI('/containers', {
      method: 'POST',
      body: JSON.stringify(container),
    });
  },

  listar: async (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return fetchAPI(`/containers${params}`);
  },

  obter: async (id: string) => {
    return fetchAPI(`/containers/${id}`);
  },

  remover: async (id: string) => {
    return fetchAPI(`/containers/${id}`, {
      method: 'DELETE',
    });
  },
};

// API de Alocação
export const alocacaoAPI = {
  alocar: async (containerIds: string[]) => {
    return fetchAPI('/alocar', {
      method: 'POST',
      body: JSON.stringify(containerIds),
    });
  },

  alocarTodos: async () => {
    return fetchAPI('/alocar/todos', {
      method: 'POST',
    });
  },
};

// API do Sistema
export const sistemaAPI = {
  resetar: async () => {
    return fetchAPI('/sistema/resetar', {
      method: 'DELETE',
    });
  },

  status: async () => {
    return fetchAPI('/');
  },
};