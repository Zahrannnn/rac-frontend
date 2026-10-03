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
 * API call) plus the cached profile and expiry.
 */
export type Session = {
  token: string;
  expiresAtUtc: string;
  user: AuthUser;
};

export type LoginInput = {
  usernameOrEmail: string;
  password: string;
};
