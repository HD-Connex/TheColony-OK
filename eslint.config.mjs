import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = Array.isArray(nextCoreWebVitals)
  ? nextCoreWebVitals
  : [nextCoreWebVitals];

config.push({
  ignores: ["_archived_TheColony/**"],
});

export default config;
