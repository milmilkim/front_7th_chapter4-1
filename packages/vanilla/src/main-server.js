import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { HomePage } from "./pages/HomePage.js";
import { ProductDetailPage } from "./pages/ProductDetailPage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";
import { productStore, initialProductState } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";
import { UniversalRouter } from "./router/router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProd = __dirname.includes("/dist/");
const itemsPath = isProd ? join(__dirname, "../../src/mocks/items.json") : join(__dirname, "mocks", "items.json");
const items = JSON.parse(readFileSync(itemsPath, "utf-8"));

function getUniqueCategories() {
  const categories = {};
  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;
    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });
  return categories;
}

function filterProducts(products, query) {
  let filtered = [...products];

  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(searchTerm) || item.brand.toLowerCase().includes(searchTerm),
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

async function mockGetProducts(params = {}) {
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

async function mockGetProduct(productId) {
  const product = items.find((item) => item.productId === productId);
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

async function mockGetRelatedProducts(category1, category2, currentProductId, limit = 20) {
  let related = items.filter((item) => {
    if (item.productId === currentProductId) return false;
    if (category2 && item.category2 === category2) return true;
    if (category1 && item.category1 === category1) return true;
    return false;
  });

  return related.slice(0, limit);
}

async function prefetchData(routeInfo, params, query) {
  if (routeInfo.path === "/") {
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

    const initialData = {
      products: productsData.products,
      totalCount: productsData.pagination.total,
      categories,
      loading: false,
      error: null,
      status: "done",
    };

    productStore.dispatch({ type: PRODUCT_ACTIONS.SETUP, payload: initialData });
  } else if (routeInfo.path === "/product/:id/") {
    const product = await mockGetProduct(params.id);

    if (!product) return { error: "Product not found" };

    const relatedProducts = await mockGetRelatedProducts(product.category1, product.category2, product.productId, 20);

    const initialData = {
      currentProduct: product,
      relatedProducts,
      loading: false,
      error: null,
      status: "done",
    };

    productStore.dispatch({ type: PRODUCT_ACTIONS.SETUP, payload: initialData });
  }

  return {};
}

function generateMetaTags(routeInfo, query, data) {
  let title = "쇼핑몰 - 홈";
  let description = "최고의 쇼핑 경험을 제공합니다.";

  if (routeInfo?.path === "/product/:id/" && data.currentProduct) {
    const product = data.currentProduct;
    title = `${product.title} - 쇼핑몰`;
    description = product.description || `${product.brand} ${product.title}`;
  } else if (routeInfo?.path === "/") {
    if (query?.search) {
      title = `${query.search} 검색 결과 - 쇼핑몰`;
    } else if (query?.category1) {
      title = `${query.category1} ${query.category2 || ""} - 쇼핑몰`.trim();
    } else {
      title = "쇼핑몰 - 홈";
    }
  }

  return `
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
  `.trim();
}

export async function render(url, query = {}) {
  productStore.dispatch({ type: PRODUCT_ACTIONS.SETUP, payload: { ...initialProductState } });

  const serverRouter = new UniversalRouter("");
  serverRouter.addRoute("/", HomePage);
  serverRouter.addRoute("/product/:id/", ProductDetailPage);

  const routeInfo = serverRouter.matchRoute(url, query);

  if (!routeInfo) {
    return {
      html: NotFoundPage(),
      head: "<title>404 - Not Found</title>",
      initialDataScript: "",
    };
  }

  const errorResult = await prefetchData(routeInfo, routeInfo.params, query);

  if (errorResult.error) {
    return {
      html: NotFoundPage(),
      head: "<title>404 - Not Found</title>",
      initialDataScript: "",
    };
  }

  global.router = serverRouter;

  const html = routeInfo.handler();
  const storeData = productStore.getState();
  const head = generateMetaTags(routeInfo, query, storeData);

  delete global.router;

  const initialDataScript = `
    <script>
      window.__INITIAL_DATA__ = ${JSON.stringify(storeData)};
    </script>
  `;

  return { html, head, initialDataScript };
}
