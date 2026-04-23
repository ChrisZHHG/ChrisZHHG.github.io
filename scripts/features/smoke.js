export function runSmokeChecks() {
  const checks = [
    { name: 'archive section exists', pass: !!document.getElementById('archive') },
    { name: 'card stack exists', pass: !!document.querySelector('[data-role="card-stack"]') },
    { name: 'audio toggle exists', pass: !!document.querySelector('.audio-toggle') },
    { name: 'cursor exists', pass: !!document.querySelector('.cursor') },
    { name: 'toc exists', pass: !!document.querySelector('[data-role="toc"]') },
    { name: 'core work cards >= 5', pass: document.querySelectorAll('#archive .card').length >= 5 },
  ];

  const failed = checks.filter((c) => !c.pass);
  const result = {
    total: checks.length,
    failed: failed.map((c) => c.name),
    pass: failed.length === 0,
  };

  window.__smoke = result;
  return result;
}
