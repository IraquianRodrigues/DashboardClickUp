import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/providers/query-provider";
import { Sidebar } from "@/components/layout/Sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ClickUp Dashboard — Real-time Task Management",
  description: "Dashboard em tempo real para visualização e gerenciamento de tarefas do ClickUp",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex bg-background text-foreground" suppressHydrationWarning>
        <Providers>
          <TooltipProvider>
            <Sidebar />
            <main className="flex-1 min-h-screen overflow-x-hidden">{children}</main>
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
