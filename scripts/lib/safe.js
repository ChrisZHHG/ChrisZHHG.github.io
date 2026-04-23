export function safeInit(name, fn) {
  try {
    return fn();
  } catch (error) {
    console.error(`[init:${name}]`, error);
    return null;
  }
}
