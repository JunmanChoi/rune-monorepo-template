import type { Page } from "@man/fe-kit/src/rune/Page";
import type { SharedData } from "@man/fe-kit/src/rune/SharedData";
import type { Request, Response } from "express";
import type { View } from "rune-ts";

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Context<
  ReqQuery = any,
  P = Record<string, string>,
  Locals extends Record<string, any> = Record<string, any>,
  ReqBody = any,
  ResBody = any,
> = {
  request: Request<P, ResBody, ReqBody, ReqQuery, Locals>;
  response: Response<ResBody, Locals>;
};

export type ErrorContext<
  ReqQuery = any,
  P = Record<string, string>,
  Locals extends Record<string, any> = Record<string, any>,
  ReqBody = any,
  ResBody = any,
> = {
  error: unknown;
  request: Request<P, ResBody, ReqBody, ReqQuery, Locals>;
  response: Response<ResBody, Locals>;
};

type Redirect = {
  destination: string;
  permanent?: boolean;
};

type ServerSideProps<
  P = object,
  D = object,
  S extends SharedData = SharedData,
> =
  | {
      bodyData: P;
      layoutData?: DeepPartial<D>;
      sharedData?: DeepPartial<S> | ((data: S) => S);
    }
  | { redirect: Redirect };

export type GetServerSideProps<
  P = object,
  D = object,
  C extends Context = Context,
> = (context: C) => ServerSideProps<P, D> | Promise<ServerSideProps<P, D>>;

type LayoutServerSideProps<D = object, S extends SharedData = SharedData> =
  | {
      layoutData: D;
      sharedData: S;
    }
  | { redirect: Redirect };

export type GetLayoutServerSideProps<
  D = object,
  C extends Context = Context,
> = (
  context: C
) => LayoutServerSideProps<D> | Promise<LayoutServerSideProps<D>>;

export type PageRoute<
  B = typeof View,
  SSP extends GetServerSideProps = GetServerSideProps,
> = {
  getServerSideProps?: SSP;
  Body: B;
};

export type RouteLayout<
  P = typeof Page,
  LSSP extends GetLayoutServerSideProps = GetLayoutServerSideProps,
> = {
  getLayoutServerSideProps: LSSP;
  Layout: P;
};

type ErrorServerSideProps<
  P = object,
  D = object,
  S extends SharedData = SharedData,
> = {
  bodyData: P;
  layoutData: D;
  sharedData: S;
  response: { status: number };
};

export type GetErrorServerSideProps<
  P = object,
  D = object,
  C extends ErrorContext = ErrorContext,
> = (
  context: C
) => ErrorServerSideProps<P, D> | Promise<ErrorServerSideProps<P, D>>;

export type ErrorRoute<
  B = typeof View,
  P = typeof Page,
  ESSP extends GetErrorServerSideProps = GetErrorServerSideProps,
> = {
  getErrorServerSideProps: ESSP;
  Body: B;
  Layout: P;
};
