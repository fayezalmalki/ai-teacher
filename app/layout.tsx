import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { AppStoreProvider } from "@/lib/store/app-store";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "المعلم الذكي",
  description: "معلم يشرح لطفلك، يسمعه، ويغيّر طريقته حسب فهمه.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F3F4F1",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={plex.variable}>
      <body className="bg-page text-ink font-sans antialiased">
        <AppStoreProvider>{children}</AppStoreProvider>
      </body>
    </html>
  );
}
