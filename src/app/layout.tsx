import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppProviders } from "@/components/app-providers";
import { SplashScreen } from "@/components/splash-screen";
import { InterfaceMotionProvider } from "@/components/motion/interface-motion-provider";
import { RouteViewTransition } from "@/components/motion/route-view-transition";
import { getSystemSetting } from "@/features/system-settings/queries";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Ancora Corretora CRM",
  description: "CRM para corretoras de planos de saúde.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  title: "Ancora Corretora CRM",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-touch-startup-image": "/logo.webp",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = (await cookies()).get("corretop-theme")?.value === "dark" ? "dark" : "light";
  const motionEnabled = (await getSystemSetting("feature_interface_motion_enabled")) !== "false";

  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${theme === "dark" ? "dark" : ""} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SplashScreen />
        <InterfaceMotionProvider enabled={motionEnabled}>
          <AppProviders>
            <TooltipProvider><RouteViewTransition>{children}</RouteViewTransition></TooltipProvider>
            <Toaster />
          </AppProviders>
        </InterfaceMotionProvider>
      </body>
    </html>
  );
}
