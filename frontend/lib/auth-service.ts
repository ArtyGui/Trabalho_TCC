import { AuthUser, LoginCredentials, RegisterData, UserRole } from './auth-types';

const API_URL = 'http://localhost:8000';
const TOKEN_KEY = 'logibox_token';
const USER_KEY = 'logibox_user';

class AuthService {
  /**
   * Faz login no sistema (REQUER BACKEND)
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao fazer login');
      }

      const data = await response.json();
      
      // Salva token e usuário
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      
      return data.user;
    } catch (error: any) {
      // Se não conseguir conectar ao backend
      if (error.message === 'Failed to fetch') {
        throw new Error('❌ Backend não está rodando! Inicie o servidor primeiro.');
      }
      throw error;
    }
  }

  /**
   * Registra novo usuário (REQUER BACKEND)
   */
  async register(data: RegisterData): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao registrar');
      }
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        throw new Error('❌ Backend não está rodando! Inicie o servidor primeiro.');
      }
      throw error;
    }
  }

  /**
   * Faz logout do sistema
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Retorna o usuário atual (do localStorage)
   */
  getCurrentUser(): AuthUser | null {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  /**
   * Retorna o token JWT
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Verifica se está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  /**
   * Verifica se tem permissão para determinada role
   */
  hasPermission(requiredRole: UserRole): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const roleHierarchy = {
      [UserRole.VISUALIZADOR]: 1,
      [UserRole.OPERADOR]: 2,
      [UserRole.ADMIN]: 3,
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }

  /**
   * Verifica se o token ainda é válido (REQUER BACKEND)
   */
  async validateToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token inválido, limpa
        this.logout();
        return false;
      }

      return true;
    } catch {

      return true;
    }
  }

  /**
   * Retorna header de autorização para requisições
   */
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export const authService = new AuthService();