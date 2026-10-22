import { createMigrate } from './migrate'

interface Current {
  name: string
  tags: string[]
}

// A store that changed shape twice: v1 { title }, v2 { name }, v3 { name, tags }.
const migrate = createMigrate<Current>({
  version: 3,
  migrations: {
    1: ({ title, ...rest }) => ({ ...rest, name: title }),
    2: (state) => ({ ...state, tags: [] }),
  },
  sanitize: (state) => ({
    name: typeof state.name === 'string' ? state.name : 'untitled',
    tags: Array.isArray(state.tags) ? (state.tags as string[]) : [],
  }),
})

describe('createMigrate', () => {
  it('runs every migration between the stored version and the current one, in order', () => {
    expect(migrate({ title: 'A' }, 1)).toEqual({ name: 'A', tags: [] })
    expect(migrate({ name: 'B' }, 2)).toEqual({ name: 'B', tags: [] })
  })

  it('leaves current data untouched', () => {
    expect(migrate({ name: 'C', tags: ['x'] }, 3)).toEqual({ name: 'C', tags: ['x'] })
  })

  it('sanitizes data from a newer version instead of dropping it', () => {
    expect(migrate({ name: 'D', tags: ['y'], extra: true }, 9)).toEqual({ name: 'D', tags: ['y'] })
  })

  it('survives corrupt or missing data', () => {
    for (const bad of [null, undefined, 'text', 42, [1, 2]]) {
      expect(migrate(bad, 1)).toEqual({ name: 'untitled', tags: [] })
    }
  })

  it('does not modify the stored object', () => {
    const stored = { title: 'E' }
    migrate(stored, 1)
    expect(stored).toEqual({ title: 'E' })
  })
})
