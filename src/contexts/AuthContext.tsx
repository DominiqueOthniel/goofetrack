import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setApiActor } from '@/lib/api';

const AUTH_STORAGE_KEY = 'glaunet_auth';
const USERS_STORAGE_KEY = 'glaunet_users';
const LEGACY_STORAGE_PREFIX = ['truck', 'track'].join('_');
const LEGACY_AUTH_STORAGE_KEY = `${LEGACY_STORAGE_PREFIX}_auth`;
const LEGACY_USERS_STORAGE_KEY = `${LEGACY_STORAGE_PREFIX}_users`;

export type UserRole = 'admin' | 'gestionnaire' | 'comptable';

export interface User {
  login: string;
  role: UserRole;
}

export interface UserSummary {
  login: string;
  role: UserRole;
}

interface StoredUser {
  login: string;
  passwordHash: string;
  role: UserRole;
}

// Hash SHA-256 des mots de passe
const GESTIONNAIRE_HASH = 'af960ccfc27d3ef7981c7fd8887ae7baa30f21aff0b9b15b6253e7b659545f87';
const ADMIN_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
const COMPTABLE_HASH = '9c831eae072d3a93e92ba9d940aa186447bcef2eb777b570e267fe78a000bcb6';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem(LEGACY_USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : defaultUsers;
    }
  } catch {}
  // Utilisateurs par défaut (admin: admin123, gestionnaire: gestion123, comptable: comptable123)
  return defaultUsers;
}

const defaultUsers: StoredUser[] = [
  { login: 'admin', passwordHash: ADMIN_HASH, role: 'admin' as const },
  { login: 'gestionnaire', passwordHash: GESTIONNAIRE_HASH, role: 'gestionnaire' as const },
  { login: 'comptable', passwordHash: COMPTABLE_HASH, role: 'comptable' as const },
];

function listUserSummaries(users: StoredUser[]): UserSummary[] {
  return users.map(({ login, role }) => ({ login, role }));
}

function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function initUsers() {
  // Initialise les comptes de base sans supprimer les comptes créés par l'admin.
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem(LEGACY_USERS_STORAGE_KEY);
    const existing: StoredUser[] = raw ? JSON.parse(raw) : [];
    const merged = [...existing];

    for (const def of defaultUsers) {
      const idx = merged.findIndex(u => u.login.toLowerCase() === def.login);
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], role: def.role };
      } else {
        merged.push(def);
      }
    }

    saveStoredUsers(merged);
  } catch {
    saveStoredUsers(defaultUsers);
  }
}

function validateNewPassword(password: string) {
  if (password.trim().length < 6) {
    throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
  }
}

function normalizeLogin(login: string): string {
  return login.trim().toLowerCase();
}

function validateLogin(login: string) {
  if (!login) throw new Error('Utilisateur invalide.');
  if (!/^[a-z0-9._-]{3,30}$/.test(login)) {
    throw new Error('Le login doit contenir 3 à 30 caractères : lettres, chiffres, point, tiret ou underscore.');
  }
}

interface AuthContextType {
  user: User | null;
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => void;
  users: UserSummary[];
  createUser: (login: string, role: UserRole, password: string) => Promise<void>;
  changeUserPassword: (targetLogin: string, newPassword: string) => Promise<void>;
  changeOwnPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** Flotte : camions, trajets, chauffeurs, tiers (pas les dépenses — comptable) */
  canManageFleet: boolean;
  /** Comptabilité : dépenses, factures, comptes bancaires */
  canManageAccounting: boolean;
  /** Trésorerie : caisse */
  canManageTreasury: boolean;
  /** Crédits / emprunts */
  canManageCredits: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [users, setUsers] = useState<UserSummary[]>([]);

  const refreshUserSummaries = (storedUsers = getStoredUsers()) => {
    setUsers(listUserSummaries(storedUsers));
  };

  useEffect(() => {
    initUsers();
    refreshUserSummaries();
  }, []);

  useEffect(() => {
    setApiActor(user ? { login: user.login, role: user.role } : null);
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    }
  }, [user]);

  const login = async (loginInput: string, password: string): Promise<boolean> => {
    const users = getStoredUsers();
    const stored = users.find(u => u.login.toLowerCase() === loginInput.toLowerCase());
    if (!stored) return false;

    const hash = await hashPassword(password);
    if (hash !== stored.passwordHash) return false;

    const u: User = { login: stored.login, role: stored.role };
    setUser(u);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
  };

  const createUser = async (loginInput: string, role: UserRole, password: string): Promise<void> => {
    if (!user || user.role !== 'admin') {
      throw new Error('Action réservée à l’administrateur.');
    }
    const normalizedLogin = normalizeLogin(loginInput);
    validateLogin(normalizedLogin);
    validateNewPassword(password);

    const stored = getStoredUsers();
    if (stored.some((u) => u.login.toLowerCase() === normalizedLogin)) {
      throw new Error('Ce login existe déjà.');
    }

    const passwordHash = await hashPassword(password);
    const nextUsers = [...stored, { login: normalizedLogin, passwordHash, role }];
    saveStoredUsers(nextUsers);
    refreshUserSummaries(nextUsers);
  };

  const changeUserPassword = async (targetLogin: string, newPassword: string): Promise<void> => {
    if (!user || user.role !== 'admin') {
      throw new Error('Action réservée à l’administrateur.');
    }
    const normalizedLogin = normalizeLogin(targetLogin);
    validateLogin(normalizedLogin);
    validateNewPassword(newPassword);

    const stored = getStoredUsers();
    const idx = stored.findIndex((u) => u.login.toLowerCase() === normalizedLogin);
    if (idx < 0) throw new Error('Utilisateur introuvable.');

    const passwordHash = await hashPassword(newPassword);
    stored[idx] = { ...stored[idx], passwordHash };
    saveStoredUsers(stored);
    refreshUserSummaries(stored);
  };

  const changeOwnPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!user) throw new Error('Utilisateur non connecté.');
    validateNewPassword(newPassword);

    const stored = getStoredUsers();
    const idx = stored.findIndex((u) => u.login.toLowerCase() === user.login.toLowerCase());
    if (idx < 0) throw new Error('Utilisateur introuvable.');

    const currentHash = await hashPassword(currentPassword);
    if (currentHash !== stored[idx].passwordHash) {
      throw new Error('Mot de passe actuel incorrect.');
    }

    const passwordHash = await hashPassword(newPassword);
    stored[idx] = { ...stored[idx], passwordHash };
    saveStoredUsers(stored);
    refreshUserSummaries(stored);
  };

  const isAdmin = user?.role === 'admin';
  const isGestionnaire = user?.role === 'gestionnaire';
  const isComptable = user?.role === 'comptable';

  const canManageFleet = !user || isAdmin || isGestionnaire;
  const canManageAccounting = !user || isAdmin || isComptable;
  const canManageTreasury = !user || isAdmin || isComptable;
  const canManageCredits = !user || isAdmin || isComptable;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        users,
        createUser,
        changeUserPassword,
        changeOwnPassword,
        canManageFleet,
        canManageAccounting,
        canManageTreasury,
        canManageCredits,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

/** Liste des utilisateurs disponibles pour la sélection à la connexion */
export const LOGIN_USER_OPTIONS = [
  {
    login: 'gestionnaire',
    label: 'Gestionnaire',
    description:
      'Flotte : camions, trajets, expéditions, chauffeurs, personnel, tiers. Pas dépenses, facturation, comptes bancaires, caisse ni crédits.',
  },
  {
    login: 'comptable',
    label: 'Comptable',
    description:
      'Comptabilité : dépenses, factures, comptes bancaires, caisse et crédits. Consultation du reste de l’application (lecture seule hors ces modules).',
  },
  {
    login: 'admin',
    label: 'Administrateur',
    description: 'Tous les droits : flotte, trésorerie, comptabilité et paramètres.',
  },
] as const;
