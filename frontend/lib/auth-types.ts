export enum UserRole {
  ADMIN = 'admin',
  OPERADOR = 'operador',
  VISUALIZADOR = 'visualizador',
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  company?: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  company?: string;
  role?: UserRole;
}
