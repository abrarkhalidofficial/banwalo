import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "../providers/convex-client-provider";
import { ToastProvider } from "../providers/toast-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BANWALO - Factory Management System",
  description: "Manage your factory operations efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexClientProvider>
          <ToastProvider />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
