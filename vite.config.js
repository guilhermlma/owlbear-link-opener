import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        popover: resolve(__dirname, "popover.html"),
        modal: resolve(__dirname, "modal.html"),
        background: resolve(__dirname, "background.html")
      }
    }
  },
  server: {
    cors: true,
    port: 5173
  }
});
