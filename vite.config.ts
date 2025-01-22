import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  Deno.env.get("FIREBASE_API_KEY");
  return {
    plugins: [vue()],
    base: mode == "production" ? "/ipfsui/" : "/",
  };
});
