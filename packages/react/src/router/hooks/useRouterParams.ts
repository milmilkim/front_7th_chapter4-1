import { router } from "../router";
import { useUniversalRouter } from "../../hooks";
import { getSSRContext } from "../ssrContext";

type Params = Record<string, string | undefined>;

const defaultSelector = <S>(params: Params) => params as S;

export const useRouterParams = <S>(selector = defaultSelector<S>) => {
  // SSR 중이면 SSR 컨텍스트에서 params 가져오기
  const ssrContext = getSSRContext();
  // 클라이언트 사이드에서는 router에서 가져오기 (hooks must be called unconditionally)
  const result = useUniversalRouter(router, ({ params }) => selector(params));

  if (ssrContext) {
    return selector(ssrContext.params);
  }

  // SSR 환경에서 null일 수 있으므로 빈 객체 반환
  return result ?? ({} as ReturnType<typeof selector>);
};
