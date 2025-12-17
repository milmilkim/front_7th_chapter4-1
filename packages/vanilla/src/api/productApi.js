import { BASE_URL } from "../constants.js";

export async function getProducts(params = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(category1 && { category1 }),
    ...(category2 && { category2 }),
    sort,
  });

  const response = await fetch(`${BASE_URL}api/products?${searchParams}`);

  return await response.json();
}

export async function getProduct(productId) {
  const response = await fetch(`${BASE_URL}api/products/${productId}`);
  return await response.json();
}

export async function getCategories() {
  const response = await fetch(`${BASE_URL}api/categories`);
  return await response.json();
}
