import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stunning Interactive Calendar",
  description: "A beautiful, feature-rich calendar application with seasonal themes and advanced functionality",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
