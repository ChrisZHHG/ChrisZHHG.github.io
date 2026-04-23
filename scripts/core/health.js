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
  const skipped = [];
  const failed = [];

  function onOk(name) {
    ok.push(name);
    if (debug) console.info(`[health] ok: ${name}`);
  }

  function onError(name, error) {
    failed.push({ name, error: String(error?.message || error) });
    if (debug) console.error(`[health] failed: ${name}`, error);
  }

  function onSkip(name, reason) {
    skipped.push({ name, reason: String(reason || 'skipped') });
    if (debug) console.warn(`[health] skipped: ${name} (${reason || 'no reason'})`);
  }

  function report() {
    const status = { ok, skipped, failed, ts: Date.now() };
    window.__siteHealth = status;
    if (!debug) return status;
    const mark = failed.length ? 'degraded' : (skipped.length ? 'partial' : 'healthy');
    console.info(`[health] boot: ${mark} | ok=${ok.length} skipped=${skipped.length} failed=${failed.length}`);
    if (skipped.length) console.table(skipped);
    if (failed.length) console.table(failed);
    return status;
  }

  return { debug, onOk, onSkip, onError, report };
}
