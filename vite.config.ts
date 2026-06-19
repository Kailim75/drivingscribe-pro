import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const supabaseFallbackEnv = {
  VITE_SUPABASE_PROJECT_ID: "pbhnncudvvnkruruayaz",
  VITE_SUPABASE_PUBLISHABLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiaG5uY3VkdnZua3J1cnVheWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Nzk1NzEsImV4cCI6MjA4ODU1NTU3MX0.SZA946cNh09VNV6mOyKBEqEZnYMEuWRiAhrIZZfCKXw",
  VITE_SUPABASE_URL: "https://pbhnncudvvnkruruayaz.supabase.co",
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const publicEnv = Object.fromEntries(
    Object.entries(supabaseFallbackEnv).map(([key, fallback]) => [
      `import.meta.env.${key}`,
      JSON.stringify(env[key] || fallback),
    ])
  );

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    define: publicEnv,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
