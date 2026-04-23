function isDebugEnabled() {
  try {
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('debug') === '1') return true;
    return localStorage.getItem('cz_debug') === '1';
  } catch (_) {
    return false;
  }
}

export function createHealthMonitor() {
  const debug = isDebugEnabled();
  const ok = [];
  const failed = [];

  function onOk(name) {
    ok.push(name);
    if (debug) console.info(`[health] ok: ${name}`);
  }

  function onError(name, error) {
    failed.push({ name, error: String(error?.message || error) });
    if (debug) console.error(`[health] failed: ${name}`, error);
  }

  function report() {
    const status = { ok, failed, ts: Date.now() };
    window.__siteHealth = status;
    if (!debug) return status;
    const mark = failed.length ? 'degraded' : 'healthy';
    console.info(`[health] boot: ${mark} | ok=${ok.length} failed=${failed.length}`);
    if (failed.length) console.table(failed);
    return status;
  }

  return { debug, onOk, onError, report };
}
