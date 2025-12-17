// 글로벌 라우터 인스턴스
import { Router } from "../lib";
import { BASE_URL } from "../constants.js";

const clientRouter = typeof window !== "undefined" ? new Router(BASE_URL) : null;

const getRouterInstance = () => {
  if (clientRouter) return clientRouter;
  if (typeof global !== "undefined" && global.router) return global.router;
  return { params: {}, query: {} };
};

export const router = {
  get params() {
    return getRouterInstance().params;
  },
  get query() {
    return getRouterInstance().query;
  },
  set query(newQuery) {
    if (clientRouter) {
      clientRouter.query = newQuery;
    }
  },
  get route() {
    return getRouterInstance().route;
  },
  get target() {
    return getRouterInstance().target;
  },
  get baseUrl() {
    return getRouterInstance().baseUrl || BASE_URL;
  },
  addRoute(...args) {
    return clientRouter?.addRoute(...args);
  },
  push(...args) {
    return clientRouter?.push(...args);
  },
  start() {
    return clientRouter?.start();
  },
  subscribe(...args) {
    return clientRouter?.subscribe(...args);
  },
};
