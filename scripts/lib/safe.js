export function safeInit(name, fn, hooks = null) {
  try {
    const result = fn();
    if (hooks?.onOk) hooks.onOk(name);
    return result;
  } catch (error) {
    console.error(`[init:${name}]`, error);
    if (hooks?.onError) hooks.onError(name, error);
    return null;
  }
}
