import { renderToString } from "react-dom/server";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { HomePage } from "./pages/HomePage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { productStore, initialProductState, PRODUCT_ACTIONS } from "./entities/products/productStore";
import { ServerRouter } from "./router/ServerRouter";
import { setSSRContext, clearSSRContext } from "./router/ssrContext";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProd = __dirname.includes("/dist/");
const itemsPath = isProd ? join(__dirname, "../../src/mocks/items.json") : join(__dirname, "mocks", "items.json");
const items = JSON.parse(readFileSync(itemsPath, "utf-8"));

interface Item {
  category1: string;
  category2?: string;
  [key: string]: unknown;
}

function getUniqueCategories() {
  const categories: Record<string, Record<string, Record<string, never>>> = {};
  items.forEach((item: Item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;
    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });
  return categories;
}

interface QueryParams {
  search?: string;
  category1?: string;
  category2?: string;
  sort?: string;
}

function filterProducts(products: Item[], query: QueryParams) {
  let filtered = [...products];

  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(searchTerm) || item.brand?.toLowerCase().includes(searchTerm),
    );
  }

  if (query.category1) {
    filtered = filtered.filter((item) => item.category1 === query.category1);
  }
  if (query.category2) {
    filtered = filtered.filter((item) => item.category2 === query.category2);
  }

  if (query.sort) {
    switch (query.sort) {
      case "price_asc":
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
        break;
      case "price_desc":
        filtered.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
        break;
      case "name_asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title, "ko"));
        break;
      case "name_desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title, "ko"));
        break;
      default:
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    }
  }

  return filtered;
}

interface GetProductsParams {
  limit?: number;
  search?: string;
  category1?: string;
  category2?: string;
  sort?: string;
  page?: number;
}

async function mockGetProducts(params: GetProductsParams = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.page || 1;

  const filteredProducts = filterProducts(items, { search, category1, category2, sort });

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return {
    products: paginatedProducts,
    pagination: {
      page,
      limit,
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / limit),
      hasNext: endIndex < filteredProducts.length,
      hasPrev: page > 1,
    },
  };
}

async function mockGetProduct(productId: string) {
  const product = items.find((item: Item) => item.productId === productId);
  if (!product) return null;

  return {
    ...product,
    description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
    rating: Math.floor(Math.random() * 2) + 4,
    reviewCount: Math.floor(Math.random() * 1000) + 50,
    stock: Math.floor(Math.random() * 100) + 10,
  };
}

async function mockGetCategories() {
  return getUniqueCategories();
}

async function mockGetRelatedProducts(category1: string, category2: string, currentProductId: string, limit = 20) {
  const related = items.filter((item: Item) => {
    if (item.productId === currentProductId) return false;
    if (category2 && item.category2 === category2) return true;
    if (category1 && item.category1 === category1) return true;
    return false;
  });

  return related.slice(0, limit);
}

async function prefetchData(routePath: string, params: Record<string, string>, query: Record<string, string>) {
  if (routePath === "/") {
    const [productsData, categories] = await Promise.all([
      mockGetProducts({
        limit: parseInt(query.limit) || 20,
        search: query.search || "",
        category1: query.category1 || "",
        category2: query.category2 || "",
        sort: query.sort || "price_asc",
        page: 1,
      }),
      mockGetCategories(),
    ]);

    return {
      products: productsData.products,
      totalCount: productsData.pagination.total,
      categories,
    };
  } else if (routePath === "/product/:id/") {
    const product = await mockGetProduct(params.id);

    if (!product) return { error: "Product not found" };

    const relatedProducts = await mockGetRelatedProducts(product.category1, product.category2, product.productId, 20);

    return {
      currentProduct: product,
      relatedProducts,
    };
  }

  return {};
}

function generateMetaTags(routePath: string, query: Record<string, string>, data: Record<string, unknown>) {
  let title = "쇼핑몰 - 홈";

  if (routePath === "/product/:id/" && data.currentProduct) {
    const product = data.currentProduct;
    title = `${product.title} - 쇼핑몰`;
  } else if (routePath === "/") {
    if (query?.search) {
      title = `${query.search} 검색 결과`;
    } else if (query?.category1) {
      title = `${query.category1} ${query.category2 || ""}`.trim();
    } else {
      title = "쇼핑몰 - 홈";
    }
  }

  return `<title>${title}</title>`;
}

export async function render(url: string, query: Record<string, string> = {}) {
  const router = new ServerRouter("");
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);

  const routeInfo = router.matchRoute(url, query);

  if (!routeInfo) {
    return {
      html: renderToString(<NotFoundPage />),
      head: "<title>404 - Not Found</title>",
      initialDataScript: "",
    };
  }

  const storeData = await prefetchData(routeInfo.path, routeInfo.params, query);

  if (storeData.error) {
    return {
      html: renderToString(<NotFoundPage />),
      head: "<title>404 - Not Found</title>",
      initialDataScript: "",
    };
  }

  // 스토어에 데이터 설정 (렌더링용)
  productStore.dispatch({ type: PRODUCT_ACTIONS.SETUP, payload: { ...initialProductState, ...storeData } });

  // SSR 컨텍스트 설정 (렌더링 중 라우터 정보 접근용)
  setSSRContext({
    query,
    params: routeInfo.params,
  });

  // SSR에서는 간단한 구조로 렌더링 (Provider 없이)
  const PageComponent = routeInfo.handler;
  const html = renderToString(<PageComponent />);
  const head = generateMetaTags(routeInfo.path, query, storeData);

  // SSR 컨텍스트 정리
  clearSSRContext();

  // 스토어 초기화
  productStore.dispatch({ type: PRODUCT_ACTIONS.SETUP, payload: { ...initialProductState } });

  // 필요한 데이터만 추출
  let initialData;
  if (routeInfo.path === "/") {
    initialData = {
      products: storeData.products,
      categories: storeData.categories,
      totalCount: storeData.totalCount,
      query, // 쿼리 파라미터 포함
    };
  } else if (routeInfo.path === "/product/:id/") {
    initialData = {
      currentProduct: storeData.currentProduct,
      relatedProducts: storeData.relatedProducts,
    };
  } else {
    initialData = storeData;
  }

  const initialDataScript = `
    <script>
      window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
    </script>
  `;

  return { html, head, initialDataScript };
}
