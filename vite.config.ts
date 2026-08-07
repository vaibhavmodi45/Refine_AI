import { defineConfig, loadEnv, type PluginOption } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(async ({ command, mode }) => {
  // Inline VITE_* env variables so import.meta.env works at build time.
  const envDefine: Record<string, string> = {};
  const loadedEnv = loadEnv(mode, process.cwd(), "");

  // Auto-fallback SUPABASE_* variables to VITE_SUPABASE_* so user only needs to define SUPABASE_*
  const supabaseUrl =
    loadedEnv.VITE_SUPABASE_URL && !loadedEnv.VITE_SUPABASE_URL.includes("YOUR_PROJECT_REF")
      ? loadedEnv.VITE_SUPABASE_URL
      : loadedEnv.SUPABASE_URL;
  const supabaseKey =
    loadedEnv.VITE_SUPABASE_PUBLISHABLE_KEY &&
    !loadedEnv.VITE_SUPABASE_PUBLISHABLE_KEY.includes("REPLACE_ME")
      ? loadedEnv.VITE_SUPABASE_PUBLISHABLE_KEY
      : loadedEnv.SUPABASE_PUBLISHABLE_KEY;
  const supabaseProj =
    loadedEnv.VITE_SUPABASE_PROJECT_ID &&
    !loadedEnv.VITE_SUPABASE_PROJECT_ID.includes("YOUR_PROJECT_REF")
      ? loadedEnv.VITE_SUPABASE_PROJECT_ID
      : loadedEnv.SUPABASE_PROJECT_ID;

  if (supabaseUrl) envDefine["import.meta.env.VITE_SUPABASE_URL"] = JSON.stringify(supabaseUrl);
  if (supabaseKey)
    envDefine["import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY"] = JSON.stringify(supabaseKey);
  if (supabaseProj)
    envDefine["import.meta.env.VITE_SUPABASE_PROJECT_ID"] = JSON.stringify(supabaseProj);

  const loadedViteEnv = loadEnv(mode, process.cwd(), "VITE_");
  for (const [key, value] of Object.entries(loadedViteEnv)) {
    if (!envDefine[`import.meta.env.${key}`]) {
      envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
    }
  }

  const plugins: PluginOption[] = [
    tailwindcss(),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts
      // (our SSR error-handling wrapper).
      server: { entry: "server" },
    }),
    react(),
  ];

  // Nitro: deploy plugin, build-only. Vercel preset for production deployments.
  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    plugins.push(
      nitro({
        preset: "vercel",
      }),
    );
  }

  return {
    define: envDefine,

    resolve: {
      tsconfigPaths: true,
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },

    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },

    plugins,
  };
});
