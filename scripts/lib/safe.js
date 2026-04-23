export class SkipInitError extends Error {
  constructor(message = 'init skipped') {
    super(message);
    this.name = 'SkipInitError';
  }
}

export function safeInit(name, fn, hooks = null) {
  try {
    const result = fn();
    if (result?.status === 'skipped') {
      if (hooks?.onSkip) hooks.onSkip(name, result.reason || 'returned skipped status');
      return result;
    }
    if (hooks?.onOk) hooks.onOk(name);
    return result;
  } catch (error) {
    if (error instanceof SkipInitError) {
      if (hooks?.onSkip) hooks.onSkip(name, error.message);
      return { status: 'skipped', reason: error.message };
    }
    console.error(`[init:${name}]`, error);
    if (hooks?.onError) hooks.onError(name, error);
    return null;
  }
}
