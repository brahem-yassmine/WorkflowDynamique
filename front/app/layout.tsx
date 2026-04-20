import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Workflow Dynamique ",
  description: "Plateforme de Gestion de Workflow Dynamique",
};

import { Toaster } from "sonner";
import SubscriptionWarning from "@/components/SubscriptionWarning";
import { GoogleAuthProvider } from "@/components/providers/GoogleAuthProvider";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import AiChatWidget from "@/components/AiChatWidget";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <MaintenanceGuard>
            <SubscriptionWarning />
            <GoogleAuthProvider>
              {children}
              <AiChatWidget />
            </GoogleAuthProvider>
          </MaintenanceGuard>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
