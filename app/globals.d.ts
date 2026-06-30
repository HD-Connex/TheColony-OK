// Ambient declarations for CSS side-effect imports (e.g. `import "./styles/main.css"`).
// Next.js provides these during `next build`, but a standalone `tsc --noEmit` in CI
// runs before the build generates `.next/types`, so declare them here for type-checking.
declare module "*.css";
declare module "*.scss";
