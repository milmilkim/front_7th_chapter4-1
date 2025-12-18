import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot, hydrateRoot } from "react-dom/client";
import { productStore, PRODUCT_ACTIONS } from "./entities/products/productStore";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

function main() {
  // 라우트 등록 (router.start() 전에 수행)
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);

  router.start();

  // SSR/SSG에서 전달된 초기 데이터 로드
  if (window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;

    // store sync - Vanilla와 동일한 방식으로 처리
    if (data.products) {
      productStore.dispatch({ type: PRODUCT_ACTIONS.SETUP, payload: data });
    }
    if (data.currentProduct) {
      productStore.dispatch({ type: PRODUCT_ACTIONS.SETUP, payload: data });
    }

    // 레이스 컨디션 방지를 위해 삭제
    delete window.__INITIAL_DATA__;
  }

  const rootElement = document.getElementById("root")!;

  // SSR/SSG HTML이 있으면 hydrate, 없으면 render
  if (rootElement.hasChildNodes()) {
    hydrateRoot(rootElement, <App />);
  } else {
    createRoot(rootElement).render(<App />);
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
