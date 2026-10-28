
import {
  computed,
  reactive,
  readonly,
} from 'vue';

import type {
  AuthSession,
  TokenResponse,
} from '@/features/auth/types';

import {
  clearStoredSession,
  createSession,
  isSessionExpired,
  loadStoredSession,
  saveStoredSession,
} from '@/services/authStorage';

interface AppState {
  hydrated: boolean;
  session: AuthSession | null;
}

const state = reactive<AppState>({
  hydrated: false,
  session: null,
});

const MAX_TIMEOUT_MS = 2_147_483_647;

let sessionExpirationTimer:
  ReturnType<typeof setTimeout> | null = null;

let sessionGeneration = 0;

function clearExpirationTimer(): void {
  sessionGeneration += 1;

  if (sessionExpirationTimer !== null) {
    clearTimeout(sessionExpirationTimer);
    sessionExpirationTimer = null;
  }
}

function clearSession(): void {
  clearExpirationTimer();

  state.session = null;
  state.hydrated = true;

  clearStoredSession();
}

function scheduleSessionExpiration(
  session: AuthSession,
): void {
  clearExpirationTimer();

  const generation = sessionGeneration;
  const exp = session.claims?.exp;

  if (
    typeof exp !== 'number' ||
    !Number.isFinite(exp)
  ) {
    clearSession();
    return;
  }

  const remainingMs = exp * 1000 - Date.now();

  if (remainingMs <= 0) {
    clearSession();
    return;
  }

  sessionExpirationTimer = setTimeout(() => {
    sessionExpirationTimer = null;

    // Ignorar temporizadores de sesiones anteriores.
    if (generation !== sessionGeneration) {
      return;
    }

    if (isSessionExpired(session)) {
      clearSession();
      return;
    }

    // Reprogramar si el token todavía está vigente.
    scheduleSessionExpiration(session);
  }, Math.min(remainingMs, MAX_TIMEOUT_MS));
}

function hydrate(): void {
  if (state.hydrated) {
    return;
  }

  const session = loadStoredSession();

  state.session = session;
  state.hydrated = true;

  if (session) {
    scheduleSessionExpiration(session);
  }
}

function setSession(
  tokenResponse: TokenResponse,
): void {
  const session = createSession(tokenResponse);

  if (isSessionExpired(session)) {
    clearSession();
    return;
  }

  clearExpirationTimer();

  state.session = session;
  state.hydrated = true;

  saveStoredSession(session);
  scheduleSessionExpiration(session);
}

function hasValidSession(): boolean {
  if (!state.session?.accessToken) {
    return false;
  }

  if (isSessionExpired(state.session)) {
    clearSession();
    return false;
  }

  return true;
}

const isAuthenticated = computed(() =>
  hasValidSession(),
);

const roleName = computed(() => {
  if (!hasValidSession()) {
    return null;
  }

  const roleClaim = state.session?.claims?.role;

  return (
    typeof roleClaim === 'string' ||
    typeof roleClaim === 'number'
  )
    ? String(roleClaim)
    : null;
});

const schemaName = computed(() => {
  if (!hasValidSession()) {
    return null;
  }

  return state.session?.claims?.schema_name ?? null;
});

const companyId = computed(() => {
  if (!hasValidSession()) {
    return null;
  }

  return state.session?.claims?.company_id ?? null;
});

export const appStore = {
  state: readonly(state),

  isAuthenticated,
  roleName,
  schemaName,
  companyId,

  hydrate,
  setSession,
  clearSession,

  get accessToken(): string | null {
    if (!hasValidSession()) {
      return null;
    }

    return state.session?.accessToken ?? null;
  },
};
