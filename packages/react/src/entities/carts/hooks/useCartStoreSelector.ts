import { useUniversalStore } from "../../../hooks";
import { cartStore } from "../cartStore";

type CartState = ReturnType<(typeof cartStore)["getState"]>;

export const useCartStoreSelector = <T>(selector: (cart: CartState) => T) => {
  return useUniversalStore(cartStore, selector);
};
