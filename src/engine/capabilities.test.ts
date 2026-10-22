import {
  detectCapabilities,
  engineBounds,
  fullEngineWarnings,
  recommendedSettings,
  type CapabilityEnvironment,
} from './capabilities'

const DESKTOP: CapabilityEnvironment = {
  crossOriginIsolated: true,
  hasSharedArrayBuffer: true,
  hardwareConcurrency: 16,
  deviceMemory: 8,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Chrome/130',
  platform: 'MacIntel',
  maxTouchPoints: 0,
}
const PHONE: CapabilityEnvironment = {
  crossOriginIsolated: true,
  hasSharedArrayBuffer: true,
  hardwareConcurrency: 8,
  deviceMemory: 4,
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) Chrome/130 Mobile Safari/537.36',
  platform: 'Linux armv81',
  maxTouchPoints: 5,
}

describe('detectCapabilities', () => {
  it('enables threads only with cross-origin isolation and SharedArrayBuffer', () => {
    expect(detectCapabilities(DESKTOP).threads).toBe(true)
    expect(detectCapabilities({ ...DESKTOP, crossOriginIsolated: false }).threads).toBe(false)
    expect(detectCapabilities({ ...DESKTOP, hasSharedArrayBuffer: false }).threads).toBe(false)
    expect(detectCapabilities({}).threads).toBe(false)
  })

  it('keeps WebKit (Safari, every iOS browser) on one thread, even cross-origin isolated', () => {
    const webkit = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1',
    ]
    for (const userAgent of webkit) {
      const caps = detectCapabilities({ ...DESKTOP, userAgent })
      expect(caps.crossOriginIsolated).toBe(true)
      expect(caps.threads).toBe(false)
      expect(engineBounds(caps).maxThreads).toBe(1)
    }
    const others = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0',
      PHONE.userAgent,
    ]
    for (const userAgent of others) {
      expect(detectCapabilities({ ...DESKTOP, userAgent }).threads).toBe(true)
    }
  })

  it('detects phones, tablets and iPadOS posing as a Mac', () => {
    expect(detectCapabilities(DESKTOP).mobile).toBe(false)
    expect(detectCapabilities(PHONE).mobile).toBe(true)
    expect(
      detectCapabilities({ ...DESKTOP, userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0)' }).mobile,
    ).toBe(true)
    expect(detectCapabilities({ ...DESKTOP, maxTouchPoints: 5 }).mobile).toBe(true)
  })

  it('survives missing information', () => {
    const caps = detectCapabilities({})
    expect(caps.hardwareConcurrency).toBe(1)
    expect(caps.deviceMemoryGb).toBeUndefined()
  })

  it('reads the real environment without throwing', () => {
    expect(() => detectCapabilities()).not.toThrow()
  })
})

describe('engineBounds and recommendedSettings', () => {
  it('desktop: leave a core to the UI, cap default threads, moderate hash', () => {
    const caps = detectCapabilities(DESKTOP)
    expect(engineBounds(caps)).toEqual({ maxThreads: 16, maxHashMb: 256 })
    expect(recommendedSettings(caps)).toEqual({ threads: 8, hashMb: 64 })
  })

  it('phone: few threads, small hash', () => {
    const caps = detectCapabilities(PHONE)
    expect(engineBounds(caps)).toEqual({ maxThreads: 4, maxHashMb: 64 })
    expect(recommendedSettings(caps)).toEqual({ threads: 2, hashMb: 16 })
  })

  it('not cross-origin isolated: a single thread', () => {
    const caps = detectCapabilities({ ...DESKTOP, crossOriginIsolated: false })
    expect(engineBounds(caps).maxThreads).toBe(1)
    expect(recommendedSettings(caps).threads).toBe(1)
  })

  it('low-memory devices get a small hash', () => {
    expect(recommendedSettings(detectCapabilities({ ...DESKTOP, deviceMemory: 2 })).hashMb).toBe(16)
  })

  it('a one-core machine still gets one thread', () => {
    expect(
      recommendedSettings(detectCapabilities({ ...DESKTOP, hardwareConcurrency: 1 })).threads,
    ).toBe(1)
  })
})

describe('fullEngineWarnings', () => {
  it('has none on a capable desktop', () => {
    expect(fullEngineWarnings(detectCapabilities(DESKTOP))).toEqual([])
  })

  it('warns about phones, little memory and missing threads', () => {
    expect(fullEngineWarnings(detectCapabilities({ ...PHONE, deviceMemory: 2 }))).toEqual([
      'mobile',
      'lowMemory',
    ])
    expect(
      fullEngineWarnings(detectCapabilities({ ...DESKTOP, crossOriginIsolated: false })),
    ).toEqual(['singleThreaded'])
    expect(
      fullEngineWarnings(
        detectCapabilities({
          ...DESKTOP,
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
        }),
      ),
    ).toEqual(['singleThreaded'])
  })
})
