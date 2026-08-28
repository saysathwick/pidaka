/** True when running the standalone Hearth build (web or native). */
export function isHearthApp() {
  return import.meta.env.VITE_APP_TARGET === "hearth";
}
