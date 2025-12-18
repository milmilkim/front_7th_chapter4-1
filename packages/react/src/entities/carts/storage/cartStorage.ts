import { createStorage } from "@hanghae-plus/lib";
import type { Cart } from "../types";

const createDummyStorage = <T>() => {
  let data: T | null = null;
  const listeners: Set<() => void> = new Set();

  return {
    get: () => data,
    set: (value: T) => {
      data = value;
      listeners.forEach((fn) => fn());
    },
    reset: () => {
      data = null;
      listeners.forEach((fn) => fn());
    },
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
};

export const cartStorage =
  typeof window !== "undefined"
    ? createStorage<{
        items: Cart[];
        selectedAll: boolean;
      }>("shopping_cart")
    : createDummyStorage<{
        items: Cart[];
        selectedAll: boolean;
      }>();
