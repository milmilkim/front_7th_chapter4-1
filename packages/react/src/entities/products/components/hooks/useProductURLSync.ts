import { useEffect, useRef } from "react";
import { useRouterQuery } from "../../../../router";
import { loadProducts } from "../../productUseCase";

export const useProductURLSync = () => {
  const query = useRouterQuery();
  const prevQueryString = useRef("");

  useEffect(() => {
    // current 파라미터는 무한 스크롤 시 변경되므로 제외하고 비교
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { current, ...restQuery } = query;

    // 쿼리 객체를 문자열로 변환하여 비교 (deep compare 효과)
    const currentQueryString = JSON.stringify(restQuery);

    // 이전 쿼리와 다르면 로드
    if (prevQueryString.current !== currentQueryString) {
      loadProducts(true);
      prevQueryString.current = currentQueryString;
    }
  }, [query]);
};
