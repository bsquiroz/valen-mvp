// Ids temporales para lo creado en un borrador local hasta que se guarda en la base.
const TEMP_ID_PREFIX = 'temp-'

export function tempId(): string {
  return `${TEMP_ID_PREFIX}${crypto.randomUUID()}`
}

export function isTempId(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX)
}
