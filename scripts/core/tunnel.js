// Compatibility shim: tunnel.js is superseded by bellows.js.
// Any legacy reference to createTunnel resolves to createBellows.
export { createBellows as createTunnel } from './bellows.js';
