import { useRouterParams } from "../../../../router";
import { useEffect } from "react";
import { loadProductDetailForPage } from "../../productUseCase";

export const useLoadProductDetail = () => {
  const productId = useRouterParams((params) => params.id);
  useEffect(() => {
    // SSR/SSG 데이터가 없으면 로드
    const hasInitialData = window.__INITIAL_DATA__;
    if (!hasInitialData) {
      loadProductDetailForPage(productId);
    }
  }, [productId]);
};
