import { useRef, useSyncExternalStore } from "react";
import type { RouterInstance } from "@hanghae-plus/lib";
import type { AnyFunction } from "@hanghae-plus/lib";

const defaultSelector = <T, S = T>(state: T) => state as unknown as S;

export const useUniversalRouter = <T extends RouterInstance<AnyFunction>, S>(
  router: T | null,
  selector = defaultSelector<T, S>,
) => {
  const isServer = typeof window === "undefined";
  const getSnapshotRef = useRef<S | undefined>(undefined);

  // Create a dummy subscribe function for when router is null
  const subscribe = router?.subscribe ?? (() => () => {});
  const getSnapshot = () => {
    if (!router) {
      return null as S;
    }
    const nextSnapshot = selector(router);
    if (getSnapshotRef.current === undefined) {
      getSnapshotRef.current = nextSnapshot;
      return nextSnapshot;
    }

    if (getSnapshotRef.current === nextSnapshot) {
      return getSnapshotRef.current;
    }

    if (
      typeof nextSnapshot === "object" &&
      nextSnapshot !== null &&
      JSON.stringify(getSnapshotRef.current) === JSON.stringify(nextSnapshot)
    ) {
      return getSnapshotRef.current;
    }

    getSnapshotRef.current = nextSnapshot;
    return getSnapshotRef.current as S;
  };

  // Hooks must be called unconditionally
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, isServer ? getSnapshot : getSnapshot);

  if (isServer || !router) {
    return getSnapshot();
  }

  return snapshot;
};
