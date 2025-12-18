/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    __spyCalls: any[];
    __spyCallsClear: () => void;
  }
}

// 클라이언트 환경에서만 초기화
if (typeof window !== "undefined") {
  window.__spyCalls = [];
  window.__spyCallsClear = () => {
    window.__spyCalls = [];
  };
}

export const log: typeof console.log = (...args) => {
  // 클라이언트 환경에서만 spy 호출 기록
  if (typeof window !== "undefined") {
    window.__spyCalls.push(args);
  }
  return console.log(...args);
};
