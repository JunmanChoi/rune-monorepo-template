import type { GetLayoutServerSideProps } from "@man/fe-kit/rune/utils/type";
import { Layout, type TLayoutData } from "@man/fe-web/src/views/Layout";

export const getLayoutServerSideProps: GetLayoutServerSideProps<
  TLayoutData
> = async (context) => {
  const isMobile = !!context.request.userAgent?.device?.is("mobile");

  return {
    layoutData: {},
    sharedData: {
      document: {
        html: {
          lang: "ko",
          "data-is-mobile": String(isMobile),
        },
        meta: { title: "man", description: "man" },
      },
      title: "man",
      isMobile,
    },
  };
};

export { Layout };
