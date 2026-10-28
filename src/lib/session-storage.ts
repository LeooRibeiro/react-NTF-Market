/** Returns a private browser-storage key scoped to the identity persisted by the mock. */
export function getIdentityStorageKey(baseKey: string) {
  let id: string | undefined
  try {
    id = (JSON.parse(localStorage.getItem('kurio-session-v1') ?? 'null') as { id?: string } | null)?.id
  } catch {
    id = undefined
  }
  return id ? `${baseKey}:${id}` : `${baseKey}:guest`
}
