import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "School of Mathematics Nigeria",
  description: "Learn mathematics with structured courses for JAMB, WAEC, and all secondary school levels. Free and premium courses available.",
  keywords: ["mathematics", "JAMB", "WAEC", "SS1", "SS2", "Nigeria", "learning", "education", "LMS"],
  authors: [{ name: "School of Mathematics Nigeria" }],
  openGraph: {
    title: "School of Mathematics Nigeria",
    description: "Learn mathematics with structured courses for JAMB, WAEC, and all secondary school levels.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
