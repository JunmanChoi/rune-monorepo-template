import { HomePage } from "../pages/home/home.page";

const BIZ_ROUTES = {
  "/": HomePage,
} as const;

/**
 * 페이지 라우트 맵  - 해당 맵 객체에 경로와 페이지 컴포넌트를 등록하세요!
 * key: 경로, value: 페이지 컴포넌트
 */
export const routeMap = {
  //BIZ
  ...BIZ_ROUTES,
} as const;
