import { useUniversalRouter } from "../../hooks";
import { router } from "../router";
import { getSSRContext } from "../ssrContext";

export const useRouterQuery = () => {
  // SSR 중이면 SSR 컨텍스트에서 쿼리 가져오기
  const ssrContext = getSSRContext();
  // hooks must be called unconditionally
  const query = useUniversalRouter(router, ({ query }) => query);

  if (ssrContext) {
    return ssrContext.query;
  }

  // router에서 query를 가져올 수 없으면 initial data에서
  if (!query || Object.keys(query).length === 0) {
    if (typeof window !== "undefined" && window.__INITIAL_DATA__?.query) {
      return window.__INITIAL_DATA__.query;
    }
  }

  return query || {};
};
