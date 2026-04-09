import axios from "axios";

const TOKEN_KEY = "hpc_access_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export interface TokenPayload {
  access_token: string;
  token_type: string;
}

export async function loginWithPassword(email: string, password: string): Promise<TokenPayload> {
  const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "") + "/api/v1";
  const body = new URLSearchParams();
  body.set("username", email.trim());
  body.set("password", password);
  const { data } = await axios.post<TokenPayload>(`${base}/auth/login`, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}
