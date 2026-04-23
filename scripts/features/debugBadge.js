export function renderDebugHealthBadge({ enabled, healthStatus, smokeStatus }) {
  if (!enabled) return;

  const failedInits = Array.isArray(healthStatus?.failed) ? healthStatus.failed.length : 0;
  const skippedInits = Array.isArray(healthStatus?.skipped) ? healthStatus.skipped.length : 0;
  const smokeFailed = Array.isArray(smokeStatus?.failed) ? smokeStatus.failed.length : 0;
  const degraded = failedInits > 0 || smokeFailed > 0;

  const badge = document.createElement('aside');
  badge.className = `debug-health-badge ${degraded ? 'is-degraded' : 'is-healthy'}`;
  badge.setAttribute('role', 'status');
  badge.setAttribute('aria-live', 'polite');

  const state = degraded ? 'degraded' : 'healthy';
  badge.innerHTML = `
    <div class="debug-health-badge-title">runtime · ${state}</div>
    <div class="debug-health-badge-row">init failed: ${failedInits}</div>
    <div class="debug-health-badge-row">init skipped: ${skippedInits}</div>
    <div class="debug-health-badge-row">smoke failed: ${smokeFailed}</div>
  `;

  document.body.appendChild(badge);
}
