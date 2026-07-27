import type { Metadata } from "next";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { AccessibilityMenu } from "../components/a11y/AccessibilityMenu";
import { AuthProvider } from "../components/AuthProvider";
import { fetchSettings } from "../lib/api";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  return {
    title: `${settings.siteName} — цифровий меморіал захисників`,
    description: settings.tagline,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className="flex min-h-screen flex-col bg-void font-sans text-ink-hi antialiased">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <AccessibilityMenu />
        </AuthProvider>
      </body>
    </html>
  );
}
