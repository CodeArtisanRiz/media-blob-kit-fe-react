const VAULT_STORAGE_KEY = 'mbk_api_keys_vault'

export interface VaultKeyEntry {
  keyId: string
  name: string
  secret: string
  projectId: string
  createdAt?: string
}

export function getSavedKeys(): Record<string, VaultKeyEntry> {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveKeyToVault(entry: VaultKeyEntry): void {
  try {
    const vault = getSavedKeys()
    vault[entry.keyId] = entry
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault))
  } catch (e) {
    console.error('Failed to save key to vault', e)
  }
}

export function removeKeyFromVault(keyId: string): void {
  try {
    const vault = getSavedKeys()
    delete vault[keyId]
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault))
  } catch (e) {
    console.error('Failed to remove key from vault', e)
  }
}

export function getKeySecret(keyId: string): string | null {
  const vault = getSavedKeys()
  return vault[keyId]?.secret || null
}
