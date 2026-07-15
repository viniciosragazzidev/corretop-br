import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CorreTop CRM",
    short_name: "CorreTop",
    description: "CRM para corretoras de planos de saúde.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    orientation: "portrait-primary",
    categories: ["business", "productivity"],
    lang: "pt-BR",
    dir: "ltr",
    prefer_related_applications: false,
    display_override: ["window-controls-overlay", "standalone"],
    scope: "/",
    id: "/",
    launch_handler: {
      client_mode: ["focus-existing", "navigate-new"],
    },
    icons: [
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Início",
        description: "Ir para o dashboard",
        url: "/dashboard",
        icons: [{ src: "/icon.svg", sizes: "192x192" }],
      },
      {
        name: "Conversas",
        short_name: "Chat",
        description: "Abrir central de mensagens",
        url: "/conversas",
        icons: [{ src: "/icon.svg", sizes: "192x192" }],
      },
      {
        name: "Leads",
        short_name: "Leads",
        description: "Abrir fila de oportunidades",
        url: "/leads",
        icons: [{ src: "/icon.svg", sizes: "192x192" }],
      },
    ],
  };
}
