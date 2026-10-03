export type UserRole =
  | "SuperAdmin"
  | "ProjectManager"
  | "Nou"
  | "Unido"
  | "FieldTeams";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  /** Effective permission keys; SuperAdmin receives the "*" sentinel. */
  permissions: string[];
};

/**
 * The browser session: the JWT (sent as the Authorization header on every
 * API call), the refresh token used to rotate the pair, plus the cached
 * profile and access-token expiry.
 */
export type Session = {
  token: string;
  expiresAtUtc: string;
  refreshToken: string;
  user: AuthUser;
};

export type LoginInput = {
  usernameOrEmail: string;
  password: string;
};
