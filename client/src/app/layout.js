// Server Component — can export `metadata` for Next.js SEO
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "./Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "CareConnect",
    template: "%s | CareConnect",
  },
  description:
    "An AI-powered medical communication platform — connect patients with doctors, manage prescriptions, and collaborate with your healthcare community.",
  keywords: ["healthcare", "telemedicine", "patient-doctor", "medical chat", "real-time"],
  authors: [{ name: "CareConnect Team" }],
  openGraph: {
    title: "CareConnect",
    description: "AI-powered patient-doctor communication platform with real-time chat and location features.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children, session }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark:bg-dark-background dark:text-dark-text transition-colors duration-300`}
      >
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
