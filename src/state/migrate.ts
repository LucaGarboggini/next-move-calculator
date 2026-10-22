/** A persisted state as a plain object, before it is validated. */
export type PersistedState = Record<string, unknown>

/**
 * One schema change. `migrations[n]` upgrades data written by version `n` to version `n + 1`,
 * so a schema change is: bump the store's `version`, add `migrations[oldVersion]`.
 */
export type Migrations = Readonly<Record<number, (state: PersistedState) => PersistedState>>

const asObject = (value: unknown): PersistedState =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? { ...(value as PersistedState) }
    : {}

export interface MigrateOptions<T> {
  /** The store's current schema version. */
  readonly version: number
  readonly migrations?: Migrations
  /**
   * Turns the upgraded data into a valid state, falling back to defaults for anything missing
   * or unusable. It runs last, so it also protects against corrupt or hand-edited storage.
   */
  readonly sanitize: (state: PersistedState) => T
}

/**
 * Builds the `migrate` function of a Zustand `persist` store. Data from an older version goes
 * through every migration in between; data from a newer version (a downgrade) or of an unknown
 * shape is only sanitized, never thrown away wholesale.
 */
export function createMigrate<T>({ version, migrations = {}, sanitize }: MigrateOptions<T>) {
  return (persisted: unknown, storedVersion: number): T => {
    let state = asObject(persisted)
    for (let from = storedVersion; from < version; from++) {
      const upgrade = migrations[from]
      if (upgrade) state = upgrade(state)
    }
    return sanitize(state)
  }
}
