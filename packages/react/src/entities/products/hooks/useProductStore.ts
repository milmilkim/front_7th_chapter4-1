import { useUniversalStore } from "../../../hooks";
import { productStore } from "../productStore";

export const useProductStore = () => useUniversalStore(productStore);
