import { router } from "../router";
import { useUniversalRouter } from "../../hooks";

export const useCurrentPage = () => {
  return useUniversalRouter(router, ({ target }) => target);
};
