export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name?: string;
}
