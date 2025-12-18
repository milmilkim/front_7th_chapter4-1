import { Router } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import type { FunctionComponent } from "react";

let _router: Router<FunctionComponent> | null = null;

const createRouterInstance = (): Router<FunctionComponent> => {
  // 클라이언트 환경에서만 실제 Router 인스턴스 생성
  if (typeof window !== "undefined") {
    if (!_router) {
      _router = new Router<FunctionComponent>(BASE_URL);
    }
    return _router;
  }

  return {
    subscribe: () => () => {},
    push: () => {},
    replace: () => {},
    back: () => {},
    forward: () => {},
    addRoute: () => {},
    start: () => {},
    stop: () => {},
    get query() {
      return {};
    },
    set query(_) {},
    get params() {
      return {};
    },
    get route() {
      return null;
    },
    get target() {
      return null;
    },
  } as Router<FunctionComponent>;
};

export const router: Router<FunctionComponent> = createRouterInstance();
