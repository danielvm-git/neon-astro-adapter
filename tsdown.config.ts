import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/server/index.ts",
    "src/route-handler.ts",
    "src/middleware-handler.ts",
  ],
  format: "esm",
  clean: true,
  dts: true,
});
