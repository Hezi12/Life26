import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Life26",
  description: "נוכחות רדיקלית ומשמעת קיצונית",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} bg-black text-white antialiased h-full`}>
        <main className="min-h-full mr-16 overflow-y-auto">
          <div className="min-h-full">
            {children}
          </div>
        </main>
        <Sidebar />
      </body>
    </html>
  );
}

