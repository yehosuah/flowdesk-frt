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

function hydrate(): void {
  if (state.hydrated) {
    return;
  }

  state.session =
    loadStoredSession();

  state.hydrated = true;
}

function setSession(
  tokenResponse: TokenResponse,
): void {
  const session =
    createSession(tokenResponse);

  if (isSessionExpired(session)) {
    clearSession();
    return;
  }

  state.session = session;
  state.hydrated = true;

  saveStoredSession(session);
}

function clearSession(): void {
  state.session = null;
  state.hydrated = true;

  clearStoredSession();
}

function hasValidSession(): boolean {
  if (!state.session?.accessToken) {
    return false;
  }

  if (
    isSessionExpired(state.session)
  ) {
    clearSession();
    return false;
  }

  return true;
}

const isAuthenticated =
  computed(() =>
    hasValidSession()
  );

const roleName =
  computed(() => {
    if (!hasValidSession()) {
      return null;
    }

    const roleClaim =
      state.session?.claims?.role;

    return (
      typeof roleClaim === 'string' ||
      typeof roleClaim === 'number'
    )
      ? String(roleClaim)
      : null;
  });

const schemaName =
  computed(() => {
    if (!hasValidSession()) {
      return null;
    }

    return (
      state.session
        ?.claims
        ?.schema_name ??
      null
    );
  });

const companyId =
  computed(() => {
    if (!hasValidSession()) {
      return null;
    }

    return (
      state.session
        ?.claims
        ?.company_id ??
      null
    );
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

  get accessToken():
    string | null {
    if (!hasValidSession()) {
      return null;
    }

    return (
      state.session
        ?.accessToken ??
      null
    );
  },
};