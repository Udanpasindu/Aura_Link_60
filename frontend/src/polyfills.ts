// Minimal polyfills for libraries that expect Node-like globals
// Set window.global so modules that reference `global` don't crash
;(window as any).global = window;

// Minimal process.env stub for libraries that read process.env
;(window as any).process = (window as any).process || { env: {} };

// Optional: provide a very small crypto.getRandomValues fallback if needed
if (!(window as any).crypto && (window as any).msCrypto) {
  (window as any).crypto = (window as any).msCrypto;
}

export {};
