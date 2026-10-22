import '@testing-library/jest-dom/vitest'

// jsdom has no matchMedia; default to a light, no-preference environment.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

// Radix measures elements with ResizeObserver, which jsdom lacks.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Radix Select uses pointer capture and scrollIntoView, which jsdom lacks.
if (typeof Element !== 'undefined') {
  const noop = () => {}
  const polyfills = {
    hasPointerCapture: () => false,
    setPointerCapture: noop,
    releasePointerCapture: noop,
    scrollIntoView: noop,
  }
  for (const [name, value] of Object.entries(polyfills)) {
    if (!(name in Element.prototype)) Object.defineProperty(Element.prototype, name, { value })
  }
}
