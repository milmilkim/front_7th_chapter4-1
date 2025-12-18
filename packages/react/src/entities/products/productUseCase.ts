import { getCategories, getProduct, getProducts } from "../../api/productApi";
import { router } from "../../router";
import type { StringRecord } from "../../types";
import { initialProductState, PRODUCT_ACTIONS, productStore } from "./productStore";
import { isNearBottom } from "../../utils";

const createErrorMessage = (error: unknown, defaultMessage = "알 수 없는 오류 발생") =>
  error instanceof Error ? error.message : defaultMessage;

export const loadProductsAndCategories = async () => {
  router.query = { current: undefined }; // 항상 첫 페이지로 초기화
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      ...initialProductState,
      loading: true,
      status: "pending",
    },
  });

  try {
    const [
      {
        products,
        pagination: { total },
      },
      categories,
    ] = await Promise.all([getProducts(router.query), getCategories()]);

    // 페이지 리셋이면 새로 설정, 아니면 기존에 추가
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products,
        categories,
        totalCount: total,
        loading: false,
        status: "done",
      },
    });
  } catch (error: unknown) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: createErrorMessage(error),
    });
    throw error;
  }
};

export const loadProducts = async (resetList = true) => {
  try {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: { loading: true, status: "pending", error: null },
    });

    const {
      products,
      pagination: { total },
    } = await getProducts(router.query);
    const payload = { products, totalCount: total };

    // 페이지 리셋이면 새로 설정, 아니면 기존에 추가
    if (resetList) {
      productStore.dispatch({ type: PRODUCT_ACTIONS.SET_PRODUCTS, payload });
      return;
    }
    productStore.dispatch({ type: PRODUCT_ACTIONS.ADD_PRODUCTS, payload });
  } catch (error) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: createErrorMessage(error),
    });
    throw error;
  }
};

export const loadMoreProducts = async () => {
  const state = productStore.getState();
  const hasMore = state.products.length < state.totalCount;

  if (!hasMore || state.loading) {
    return;
  }

  router.query = { current: Number(router.query.current ?? 1) + 1 };
  await loadProducts(false);
};
export const searchProducts = (search: string) => {
  router.query = { search, current: 1 };
};

export const setCategory = (categoryData: StringRecord) => {
  router.query = { ...categoryData, current: 1 };
};

export const setSort = (sort: string) => {
  router.query = { sort, current: 1 };
};

export const setLimit = (limit: number) => {
  router.query = { limit, current: 1 };
};

export const loadProductDetailForPage = async (productId: string) => {
  try {
    const currentProduct = productStore.getState().currentProduct;
    if (productId === currentProduct?.productId) {
      // 관련 상품 로드 (같은 category2 기준)
      if (currentProduct.category2) {
        await loadRelatedProducts(currentProduct.category2, productId);
      }
      return;
    }
    // 현재 상품 클리어
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        ...initialProductState,
        currentProduct: null,
        loading: true,
        status: "pending",
      },
    });

    const product = await getProduct(productId);

    // 현재 상품 설정
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: product,
    });

    // 관련 상품 로드 (같은 category2 기준)
    if (product.category2) {
      await loadRelatedProducts(product.category2, productId);
    }
  } catch (error) {
    console.error("상품 상세 페이지 로드 실패:", error);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: createErrorMessage(error),
    });
    throw error;
  }
};

export const loadRelatedProducts = async (category2: string, excludeProductId: string) => {
  try {
    const params = {
      category2,
      limit: String(20), // 관련 상품 20개
      page: String(1),
    };

    const response = await getProducts(params);

    // 현재 상품 제외
    const relatedProducts = response.products.filter((product) => product.productId !== excludeProductId);

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
      payload: relatedProducts,
    });
  } catch (error) {
    console.error("관련 상품 로드 실패:", error);
    // 관련 상품 로드 실패는 전체 페이지에 영향주지 않도록 조용히 처리
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
      payload: [],
    });
  }
};

export const loadNextProducts = async () => {
  // router.route 정보가 없거나 path가 일치하지 않아도
  // HomePage에서 등록한 scroll 이벤트에 의해 호출되므로
  // 별도의 path 체크 없이 실행하도록 변경 (테스트 환경 호환성)

  if (isNearBottom(200)) {
    const productState = productStore.getState();
    const hasMore = productState.products.length < productState.totalCount;

    // 로딩 중이거나 더 이상 로드할 데이터가 없으면 return
    if (productState.loading || !hasMore) {
      return;
    }

    try {
      await loadMoreProducts();
    } catch (error) {
      console.error("무한 스크롤 로드 실패:", error);
    }
  }
};
