import { isObject } from "@fxts/core";
import type { DeepPartial } from "@man/fe-kit/src/rune/utils/type";
import { rune, type View } from "rune-ts";

export interface SharedData {
  document: {
    html: { lang: string } & Record<string, string>;
    meta: { title: string; description: string };
  };
}

export interface SharedDataSystem {
  routers: string[];
}

export function deepMerge<
  T extends Record<string, any>,
  U extends Record<string, any>,
>(target: T, source: U): T & U {
  const result = { ...target } as any;

  for (const [key, value] of Object.entries(source)) {
    if (isObject(value) && isObject(result[key])) {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = value;
    }
  }

  return result as T & U;
}

export const setSharedData = <T extends SharedData = SharedData>(
  param: DeepPartial<T> | ((data: T) => T)
) => {
  return (data: T) => {
    if (typeof param === "function") {
      return param(data);
    } else {
      return <SharedData>deepMerge(data, param);
    }
  };
};

export const getSharedData = (view: View): SharedDataSystem & SharedData => {
  const sharedData = rune.getSharedData(view);

  if (!sharedData) {
    throw new Error("Unable to get sharedData");
  }

  return <SharedDataSystem & SharedData>sharedData;
};
