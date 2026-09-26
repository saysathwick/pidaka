import { useLocation } from "wouter";
import { ComposeFab } from "@/components/pidaka-composer";
import type { HeaderPlace } from "@/components/app-header";
import { usePublicWall } from "@/lib/wall";

export const DROP_IT_FLAG = "pidaka-open-compose";
export const DROP_IT_EVENT = "pidaka-drop-it";

export function requestDropIt(navigate: (path: string) => void, currentPath?: string) {
  const onWall = !currentPath || currentPath === "/";
  if (onWall) {
    window.dispatchEvent(new Event(DROP_IT_EVENT));
    return;
  }
  try {
    sessionStorage.setItem(DROP_IT_FLAG, "1");
  } catch {
    // private mode / blocked storage
  }
  navigate("/");
}

/** Floating “Drop it” on non-wall screens — the wall page owns its own FAB. */
export function GlobalDropFab({ place }: { place: HeaderPlace }) {
  const [location, navigate] = useLocation();
  const { data: wall } = usePublicWall();

  if (place === "wall") return null;

  return (
    <ComposeFab
      visible={wall?.posting !== false}
      onClick={() => requestDropIt(navigate, location)}
    />
  );
}
