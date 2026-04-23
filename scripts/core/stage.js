export function createStage(body) {
  let current = 'paper';
  function set(name) {
    if (current === name) return;
    if (current === 'archive') body.classList.remove('stage-archive');
    if (name === 'archive') body.classList.add('stage-archive');
    current = name;
  }
  return {
    set,
    get current() { return current; },
    dispose() {},
  };
}
