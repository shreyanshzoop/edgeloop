import type { Metadata } from "next";
import { DM_Mono } from "next/font/google";
import "./globals.css";
import ThemeSync from "@/components/ui/ThemeSync";

// DM Mono is non-variable, so the weights must be enumerated. Exposed as a CSS
// custom property (--font-dm-mono) and consumed in globals.css.
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--font-dm-mono",
});

const description =
  "edgeloop is a creative studio: artist visuals, brand content, dj set productions, and anamorphic experiences. no templates, no shortcuts — each piece built from scratch.";

export const metadata: Metadata = {
  metadataBase: new URL("https://edgeloop.studio"),
  title: {
    default: "edgeloop",
    template: "%s — edgeloop",
  },
  description,
  applicationName: "edgeloop",
  openGraph: {
    title: "edgeloop",
    description,
    url: "/",
    siteName: "edgeloop",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // data-theme starts as "dark" (the black void at idle); ThemeSync flips it to
  // "light" while browsing the work. The font var rides on <html>.
  return (
    <html lang="en" data-theme="dark" className={dmMono.variable}>
      <body>
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
