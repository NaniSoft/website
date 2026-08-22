import '@testing-library/jest-dom/vitest';

if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

if (typeof globalThis !== 'undefined' && typeof (globalThis as { ResizeObserver?: unknown }).ResizeObserver === 'undefined') {
  class ResizeObserverPolyfill {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserverPolyfill }).ResizeObserver = ResizeObserverPolyfill;
}

// jsdom does not implement HTMLCanvasElement.prototype.getContext. The knowledge
// graph uses react-force-graph-2d, which calls getContext('2d') and then methods
// like ctx.scale(...) — with a null context that throws and crashes the component
// tree. Stub getContext to return a no-op 2D-ish context so canvas components can
// mount in tests without errors. (The real browser canvas is unaffected.)
if (typeof HTMLCanvasElement !== 'undefined') {
  const noop = () => {};
  const measureText = (text: string) => ({
    width: (text != null ? String(text).length : 0) * 6,
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: (text != null ? String(text).length : 0) * 6,
    actualBoundingBoxAscent: 8,
    actualBoundingBoxDescent: 2,
  });
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (_t, prop) => {
      if (prop === 'canvas') return { width: 800, height: 600, getContext: () => ctx };
      if (prop === 'measureText') return measureText;
      // Every other access (scale, clearRect, beginPath, fill, save, …) is a no-op.
      return noop;
    },
    set: () => true,
  });
  HTMLCanvasElement.prototype.getContext = (function getContext() {
    return ctx;
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}
