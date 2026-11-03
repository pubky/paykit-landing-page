import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const socialTitle = "Paykit — Pay. Get paid.";
const description =
  "Paykit is the open payment coordination protocol. Pay a person and let your wallet handle the payment logistics.";
const socialImage = {
  url: "/social-preview-v3.png",
  type: "image/png",
  width: 1200,
  height: 630,
  alt: "Paykit — The open payment coordination protocol.",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://paykit.to"),
  title: "Paykit",
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Paykit",
    title: socialTitle,
    description,
    url: "/",
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: socialTitle,
    description,
    images: [socialImage],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      {
        url: "/favicon-dark.ico",
        type: "image/x-icon",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={sans.variable}>{children}</body>
    </html>
  );
}
