export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: "google" | "local";
  createdAt: number;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
}
