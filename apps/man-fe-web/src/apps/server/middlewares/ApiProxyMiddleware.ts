import http from "node:http";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";

export const ApiProxyMiddleware = createProxyMiddleware({
  target: "http://localhost:4000",
  pathFilter: "/api",
  changeOrigin: true,
  agent: http.globalAgent,
  on: {
    proxyReq: (proxyReq, req) => {
      // 인증 로직
      // if (req.sub) {
      //   proxyReq.setHeader(API.HEADER_SUB_KEY, req.sub);
      //   proxyReq.setHeader(
      //     API.HEADER_REQUEST_KEY,
      //     <string>getLoggerContext().trace_id,
      //   );
      // }
      fixRequestBody(proxyReq, req);
    },
  },
});
