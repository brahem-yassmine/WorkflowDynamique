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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <MaintenanceGuard>
          <SubscriptionWarning />
          <GoogleAuthProvider>
            {children}
          </GoogleAuthProvider>
        </MaintenanceGuard>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
