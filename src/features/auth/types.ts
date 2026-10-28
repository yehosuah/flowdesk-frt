export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface CompanyRegisterRequest {
  name: string;
  admin_email: string;
  admin_username: string;
}

export interface CompanyResponse {
  id: string;
  name: string;
  schema_name: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokenClaims {
  sub: string;
  exp?: number;
  iat?: number;
  purpose?: string;
  role?: string | number | null;
  company_id?: string;
  schema_name?: string;
}

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  claims: AuthTokenClaims | null;
}

export interface BackendErrorResponse {
  detail?: string;
  message?: string;
  code?: string;
  errors?:
    | Record<string, string | string[]>
    | unknown[];
}