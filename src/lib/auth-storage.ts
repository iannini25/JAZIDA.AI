// Persistencia de sessao no localStorage (client-side).
// Armazena token + role + displayName pra roteamento e UI.

const KEY_TOKEN = "jazida_auth_token";
const KEY_ROLE = "jazida_auth_role";
const KEY_DISPLAY_NAME = "jazida_auth_display_name";
const KEY_USER_ID = "jazida_auth_user_id";
const KEY_CITIZEN_ID = "jazida_auth_citizen_id";

function safeWindow(): Window | null {
  return typeof window !== "undefined" ? window : null;
}

export type StoredAuth = {
  token: string;
  role: "cidadao" | "funcionario";
  displayName: string;
  userId: string;
  citizenId?: string;
};

export function getStoredAuth(): StoredAuth | null {
  const w = safeWindow();
  if (!w) return null;
  const token = w.localStorage.getItem(KEY_TOKEN);
  const role = w.localStorage.getItem(KEY_ROLE) as StoredAuth["role"] | null;
  const displayName = w.localStorage.getItem(KEY_DISPLAY_NAME);
  const userId = w.localStorage.getItem(KEY_USER_ID);
  if (!token || !role || !displayName || !userId) return null;
  const citizenId = w.localStorage.getItem(KEY_CITIZEN_ID) || undefined;
  return { token, role, displayName, userId, citizenId };
}

export function setStoredAuth(auth: StoredAuth): void {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.setItem(KEY_TOKEN, auth.token);
  w.localStorage.setItem(KEY_ROLE, auth.role);
  w.localStorage.setItem(KEY_DISPLAY_NAME, auth.displayName);
  w.localStorage.setItem(KEY_USER_ID, auth.userId);
  if (auth.citizenId) {
    w.localStorage.setItem(KEY_CITIZEN_ID, auth.citizenId);
  }
}

export function clearStoredAuth(): void {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.removeItem(KEY_TOKEN);
  w.localStorage.removeItem(KEY_ROLE);
  w.localStorage.removeItem(KEY_DISPLAY_NAME);
  w.localStorage.removeItem(KEY_USER_ID);
  w.localStorage.removeItem(KEY_CITIZEN_ID);
}

export function getAuthToken(): string | null {
  const w = safeWindow();
  if (!w) return null;
  return w.localStorage.getItem(KEY_TOKEN);
}
