import { useRouterQuery } from "../../../../router";

export const useProductFilter = () => {
  const { search: searchQuery, limit, sort, category1, category2 } = useRouterQuery();
  const category = { category1, category2 };

  // Data fetching is now handled by useProductURLSync in HomePage
  // useEffect(() => {
  //   loadProducts(true);
  // }, [searchQuery, limit, sort, category1, category2]);

  return {
    searchQuery,
    limit,
    sort,
    category,
  };
};
