import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import svgLoader from "vite-svg-loader";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [vue(), svgLoader()],
    base: mode == "production" ? "/ipfsui/" : "/",
  };
});
