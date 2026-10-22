import type { EngineBounds, EngineSettings } from './types'

/** What the current browser lets us do. */
export interface EngineCapabilities {
  readonly crossOriginIsolated: boolean
  readonly sharedMemory: boolean
  /** Multi-threaded WebAssembly needs both cross-origin isolation and SharedArrayBuffer. */
  readonly threads: boolean
  readonly hardwareConcurrency: number
  /** `navigator.deviceMemory` in GB (Chromium only, capped at 8). */
  readonly deviceMemoryGb?: number
  /** Phone or tablet: lower defaults and a warning before the Full engine. */
  readonly mobile: boolean
}

/** Raw browser facts, injectable so detection is testable without a browser. */
export interface CapabilityEnvironment {
  readonly crossOriginIsolated?: boolean
  readonly hasSharedArrayBuffer?: boolean
  readonly hardwareConcurrency?: number
  readonly deviceMemory?: number
  readonly userAgent?: string
  readonly platform?: string
  readonly maxTouchPoints?: number
}

export function readEnvironment(): CapabilityEnvironment {
  const nav: (Navigator & { deviceMemory?: number }) | undefined =
    typeof navigator === 'undefined' ? undefined : navigator
  return {
    crossOriginIsolated: globalThis.crossOriginIsolated,
    hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    hardwareConcurrency: nav?.hardwareConcurrency,
    deviceMemory: nav?.deviceMemory,
    userAgent: nav?.userAgent,
    platform: nav?.platform,
    maxTouchPoints: nav?.maxTouchPoints,
  }
}

function isMobile(env: CapabilityEnvironment): boolean {
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(env.userAgent ?? '')) return true
  // iPadOS Safari reports itself as a Mac but has a touch screen.
  return env.platform === 'MacIntel' && (env.maxTouchPoints ?? 0) > 1
}

export function detectCapabilities(
  env: CapabilityEnvironment = readEnvironment(),
): EngineCapabilities {
  const crossOriginIsolated = env.crossOriginIsolated === true
  const sharedMemory = env.hasSharedArrayBuffer === true
  return {
    crossOriginIsolated,
    sharedMemory,
    threads: crossOriginIsolated && sharedMemory,
    hardwareConcurrency: Math.max(1, Math.floor(env.hardwareConcurrency ?? 1)),
    ...(env.deviceMemory !== undefined && { deviceMemoryGb: env.deviceMemory }),
    mobile: isMobile(env),
  }
}

/** Largest thread count and hash table we ever allow; phones get far less. */
export function engineBounds(caps: EngineCapabilities): EngineBounds {
  const maxThreads = caps.threads ? Math.min(caps.hardwareConcurrency, caps.mobile ? 4 : 32) : 1
  return { maxThreads, maxHashMb: caps.mobile ? 64 : 256 }
}

/**
 * Conservative defaults: leave one core to the UI, cap threads, small hash on phones.
 * The engine size is not part of this: Lite is always the default, Full is opt-in.
 */
export function recommendedSettings(caps: EngineCapabilities): EngineSettings {
  const { maxThreads } = engineBounds(caps)
  const lowMemory = caps.deviceMemoryGb !== undefined && caps.deviceMemoryGb <= 2
  return {
    threads: Math.max(1, Math.min(caps.hardwareConcurrency - 1, maxThreads, caps.mobile ? 2 : 8)),
    hashMb: caps.mobile || lowMemory ? 16 : 64,
  }
}

export type FullEngineWarning = 'mobile' | 'lowMemory' | 'singleThreaded'

/** Reasons to warn before the user opts in to the ~94 MB Full engine. Empty means no concern. */
export function fullEngineWarnings(caps: EngineCapabilities): FullEngineWarning[] {
  const warnings: FullEngineWarning[] = []
  if (caps.mobile) warnings.push('mobile')
  if (caps.deviceMemoryGb !== undefined && caps.deviceMemoryGb < 4) warnings.push('lowMemory')
  if (!caps.threads) warnings.push('singleThreaded')
  return warnings
}
