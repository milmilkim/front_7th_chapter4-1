import { useSyncExternalStore } from "react";
import type { createStore } from "@hanghae-plus/lib";

type Store<T> = ReturnType<typeof createStore<T>>;

const defaultSelector = <T, S = T>(state: T) => state as unknown as S;

export const useUniversalStore = <T, S = T>(store: Store<T>, selector: (state: T) => S = defaultSelector<T, S>) => {
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  return selector(state);
};
