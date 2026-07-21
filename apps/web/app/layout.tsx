import type { Metadata } from "next";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { AccessibilityMenu } from "../components/a11y/AccessibilityMenu";
import { AuthProvider } from "../components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Незабутні — цифровий меморіал захисників",
  description:
    "Цифровий меморіал і музей пам’яті захисників регіону: реєстр імен, карта пам’яті, архів і онлайн-експозиції.",
};

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
