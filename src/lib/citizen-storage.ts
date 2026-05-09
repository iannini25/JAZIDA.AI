// Persistencia simples no localStorage (so client-side).
// Chaves usadas:
//   jazida_citizen_id    -> id do cidadao no DB
//   jazida_citizen_name  -> primeiro nome para saudacao

const KEY_ID = "jazida_citizen_id";
const KEY_NAME = "jazida_citizen_name";

function safeWindow(): Window | null {
  return typeof window !== "undefined" ? window : null;
}

export function getStoredCitizenId(): string | null {
  const w = safeWindow();
  if (!w) return null;
  return w.localStorage.getItem(KEY_ID);
}

export function setStoredCitizen(id: string, name?: string): void {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.setItem(KEY_ID, id);
  if (name) w.localStorage.setItem(KEY_NAME, name.split(" ")[0]);
}

export function getStoredCitizenName(): string | null {
  const w = safeWindow();
  if (!w) return null;
  return w.localStorage.getItem(KEY_NAME);
}

export function clearStoredCitizen(): void {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.removeItem(KEY_ID);
  w.localStorage.removeItem(KEY_NAME);
}
