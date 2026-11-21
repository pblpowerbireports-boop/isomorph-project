import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `isomorph dev` fronts Vite with one loopback origin (the printed link) and passes --host/--port itself; this block only matters when you run `vite` directly.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: Number(process.env.ISOMORPH_VITE_PORT ?? 5173),
    strictPort: true
  }
});
