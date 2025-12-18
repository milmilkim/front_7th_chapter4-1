import type { FunctionComponent } from "react";

interface Route<Handler extends FunctionComponent> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
}

type QueryPayload = Record<string, string | number | undefined>;
type StringRecord = Record<string, string>;

export class ServerRouter<Handler extends FunctionComponent = FunctionComponent> {
  readonly #routes: Map<string, Route<Handler>>;
  readonly #baseUrl: string;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  addRoute(path: string, handler: Handler) {
    const paramNames: string[] = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
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

  matchRoute(url: string, query?: QueryPayload) {
    const pathname = url.includes("?") ? url.split("?")[0] : url;

    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        const params: StringRecord = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return {
          path: routePath,
          params,
          handler: route.handler,
          query: query || {},
        };
      }
    }

    return null;
  }
}
