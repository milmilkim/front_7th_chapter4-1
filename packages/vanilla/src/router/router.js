import { BASE_URL } from "../constants.js";

function createObserver() {
  const listeners = new Set();

  const subscribe = (fn) => {
    listeners.add(fn);
    return () => unsubscribe(fn);
  };

  const unsubscribe = (fn) => {
    listeners.delete(fn);
  };

  const notify = () => listeners.forEach((listener) => listener());

  return { subscribe, unsubscribe, notify };
}

class ClientRouter {
  #routes = new Map();
  #observer = createObserver();
  #baseUrl;
  #route = null;

  constructor(baseUrl = "") {
    this.#baseUrl = baseUrl.replace(/\/$/, "");

    if (typeof window !== "undefined") {
      window.addEventListener("popstate", () => {
        this.#route = this.#findRoute();
        this.#observer.notify();
      });

      document.addEventListener("click", (e) => {
        const target = e.target;
        if (!target?.closest("[data-link]")) {
          return;
        }
        e.preventDefault();
        const url = target.getAttribute("href") ?? target.closest("[data-link]")?.getAttribute("href");
        if (url) {
          this.push(url);
        }
      });
    }
  }

  get query() {
    return ClientRouter.parseQuery(window.location.search);
  }

  set query(newQuery) {
    const newUrl = ClientRouter.getUrl(newQuery, this.#baseUrl);
    this.push(newUrl);
  }

  get params() {
    return this.#route?.params ?? {};
  }

  get route() {
    return this.#route;
  }

  get target() {
    return this.#route?.handler;
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  subscribe = this.#observer.subscribe;

  addRoute(path, handler) {
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${this.#baseUrl}${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  #findRoute(url = window.location.pathname) {
    const pathname = new URL(url, window.location.origin).pathname;
    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return {
          ...route,
          params,
          path: routePath,
        };
      }
    }
    return null;
  }

  push(url) {
    try {
      const fullUrl = url.startsWith(this.#baseUrl) ? url : this.#baseUrl + (url.startsWith("/") ? url : "/" + url);

      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      if (prevFullUrl !== fullUrl) {
        window.history.pushState(null, "", fullUrl);
      }

      this.#route = this.#findRoute(fullUrl);
      this.#observer.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  start() {
    this.#route = this.#findRoute();
    this.#observer.notify();
  }

  static parseQuery(search = window.location.search) {
    const params = new URLSearchParams(search);
    const query = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  }

  static stringifyQuery(query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  }

  static getUrl(newQuery, baseUrl = "") {
    const currentQuery = ClientRouter.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = ClientRouter.stringifyQuery(updatedQuery);
    return `${baseUrl}${window.location.pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  }
}

class ServerRouter {
  #routes = new Map();
  #currentRoute = null;
  #params = {};
  #query = {};
  #baseUrl;

  constructor(baseUrl = "") {
    this.#baseUrl = baseUrl;
  }

  get params() {
    return this.#params;
  }

  get query() {
    return this.#query;
  }

  set query(newQuery) {
    this.#query = { ...this.#query, ...newQuery };
  }

  get route() {
    return this.#currentRoute;
  }

  get target() {
    return this.#currentRoute?.handler;
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  addRoute(path, handler) {
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPath}$`);
    this.#routes.set(path, {
      path,
      regex,
      paramNames,
      handler,
    });
  }

  matchRoute(url, query = {}) {
    const pathname = url.split("?")[0];

    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        this.#currentRoute = route;
        this.#params = params;
        this.#query = query;

        return {
          path: routePath,
          params,
          handler: route.handler,
        };
      }
    }
    return null;
  }

  subscribe() {
    return () => {};
  }

  push() {}

  start() {}
}

class UniversalRouter {
  #router;

  constructor(baseUrl = "") {
    const isServer = typeof window === "undefined";
    this.#router = isServer ? new ServerRouter(baseUrl) : new ClientRouter(baseUrl);
  }

  addRoute(...args) {
    return this.#router.addRoute(...args);
  }

  matchRoute(...args) {
    return this.#router.matchRoute?.(...args);
  }

  push(...args) {
    return this.#router.push?.(...args);
  }

  start() {
    return this.#router.start?.();
  }

  subscribe(...args) {
    return this.#router.subscribe?.(...args);
  }

  get params() {
    return this.#router.params;
  }

  get query() {
    return this.#router.query;
  }

  set query(newQuery) {
    this.#router.query = newQuery;
  }

  get route() {
    return this.#router.route;
  }

  get target() {
    return this.#router.target;
  }

  get baseUrl() {
    return this.#router.baseUrl;
  }
}

const clientRouter = typeof window !== "undefined" ? new UniversalRouter(BASE_URL) : null;

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

export { UniversalRouter };
