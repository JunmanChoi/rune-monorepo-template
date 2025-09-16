import type { NextFunction, Request, Response } from "express";
import type { Renderer } from "../renderer/renderer";
import type { RenderOptions } from "../renderer/types";

export type AnyRouter = Record<string, (...args: any[]) => any>;

/**
 * T는 라우터 객체
 * P는 라우터 객체의 키 (경로)
 */
export type PagePath<T extends AnyRouter> = keyof T;
export type PageViewClass<T extends AnyRouter, P extends PagePath<T>> = T[P]; // Page 뷰 클래스 타입 - ex) PortfolioPage
export type PageViewParams<
  T extends AnyRouter,
  P extends PagePath<T>,
> = Parameters<PageViewClass<T, P>>[0]; // Page 뷰 클래스의 생성자 파라미터 타입

export type PageView<T extends AnyRouter, P extends PagePath<T>> = ReturnType<
  PageViewClass<T, P>
>; // Page 뷰 클래스의 인스턴스 타입

export type ErrorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => void;

export type FetcherResult<T extends AnyRouter, P extends PagePath<T>> = {
  data: PageViewParams<T, P>;
  sharedData?: PageViewParams<T, P>;
};
export type PageDataFetcher<T extends AnyRouter, P extends PagePath<T>> = (
  req: Request,
  res: Response
) => Promise<FetcherResult<T, P>>;

// 라우트 설정도 제네릭으로
export interface PageRouteConfig<
  T extends AnyRouter,
  P extends PagePath<T>,
  R extends Renderer = Renderer,
> {
  path: P;
  render_options: R extends Renderer<infer O> ? O : RenderOptions;
  middlewares?: Array<
    (req: Request, res: Response, next: NextFunction) => void
  >;
  fetcher?: PageDataFetcher<T, P>;
  errorHandler?: ErrorHandler;
  page_number?: number;
}
