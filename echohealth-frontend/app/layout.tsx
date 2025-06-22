import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Echo Psychology",
  description: "Echo Psychology offers compassionate, evidence-based mental health care in a safe, confidential environment. Book therapy, counseling, and wellness sessions with licensed professionals. Your journey to mental wellness starts here.",
  keywords: [
    "mental health",
    "therapy",
    "counseling",
    "psychology",
    "wellness",
    "group therapy",
    "stress management",
    "anxiety",
    "Echo Psychology",
    "online therapy",
    "Kenya mental health"
  ],
  openGraph: {
    title: 'Echo Psychology',
    description: 'Echo Psychology offers compassionate, evidence-based mental health care in a safe, confidential environment. Book therapy, counseling, and wellness sessions with licensed professionals. Your journey to mental wellness starts here.',
    url: 'https://echopsychology.com',
    siteName: 'Echo Psychology',
    images: [
      {
        url: '/public/globe.svg',
        width: 1200,
        height: 630,
        alt: 'Echo Psychology Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Echo Psychology',
    description: 'Echo Psychology offers compassionate, evidence-based mental health care in a safe, confidential environment. Book therapy, counseling, and wellness sessions with licensed professionals. Your journey to mental wellness starts here.',
    site: '@echopsychology',
    creator: '@echopsychology',
    images: ['/public/globe.svg'],
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
        <link rel="canonical" href="https://echopsychology.com/" />
        <meta name="robots" content="index, follow" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
