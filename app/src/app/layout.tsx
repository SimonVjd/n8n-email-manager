import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { CookieProvider } from "@/contexts/CookieContext";
import CookieBanner from "@/components/CookieBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Email Manager — Správa emailov",
  description: "Inteligentná správa emailov s AI sumarizáciou",
};

// Inline script to apply theme before paint (prevents flash)
const themeScript = `
(function(){
  try {
    var t = JSON.parse(localStorage.getItem('theme'));
    if (t === 'dark') document.documentElement.setAttribute('data-theme','dark');
    else if (t === 'system' || t === null) {
      if (window.matchMedia('(prefers-color-scheme:dark)').matches)
        document.documentElement.setAttribute('data-theme','dark');
    }
  } catch(e){}
})()
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <CookieProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
          <CookieBanner />
        </CookieProvider>
      </body>
    </html>
  );
}
