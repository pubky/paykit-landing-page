import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const socialTitle = "Paykit — Pay people, not addresses";
const description =
  "Paykit is the open payment coordination protocol. Pay a person and let your wallet handle the payment logistics.";
const socialImage = {
  url: "/social-preview-v4.jpg",
  type: "image/jpeg",
  width: 1200,
  height: 630,
  alt: "Paykit — Pay people, not addresses. The open payment coordination protocol.",
};

const siteMetadata: Metadata = {
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

export function generateMetadata(): Metadata {
  const siteUrl = new URL(process.env.PAYKIT_SITE_URL || "https://paykit.to");
  if (siteUrl.protocol !== "https:" && siteUrl.protocol !== "http:") {
    throw new Error("PAYKIT_SITE_URL must be an absolute HTTP or HTTPS URL");
  }

  return {
    ...siteMetadata,
    metadataBase: new URL(siteUrl.origin),
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={sans.variable}>{children}</body>
    </html>
  );
}
