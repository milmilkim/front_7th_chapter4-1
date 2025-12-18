type SSRContext = {
  query: Record<string, string>;
  params: Record<string, string>;
} | null;

let ssrContext: SSRContext = null;

export const setSSRContext = (context: SSRContext) => {
  ssrContext = context;
};

export const getSSRContext = () => {
  return ssrContext;
};

export const clearSSRContext = () => {
  ssrContext = null;
};
