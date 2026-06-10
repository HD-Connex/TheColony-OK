// Empty shim for vitest so "import 'server-only'" does not explode when testing pure fns
// extracted from server modules (e.g. safeCompare). In real Next runtime the package enforces
// "this code must not be bundled for client".
export {};
