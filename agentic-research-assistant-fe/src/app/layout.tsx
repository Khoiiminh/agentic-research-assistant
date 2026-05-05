import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@mantine/core/styles.css";
import "./globals.css";
import { ColorSchemeScript, MantineProvider, createTheme } from "@mantine/core";
import { RootProvider } from "@/providers/RootProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agentic Research Assistant",
  description: "AI-Powered Research Companion",
};

const theme = createTheme({
  primaryColor: 'violet',
  colors: {
    violet: [
      '#F0F0FF',
      '#E0E0FF',
      '#C0C0FF',
      '#9696FF',
      '#6366F1',
      '#6366F1',
      '#4B4DB5',
      '#323379',
      '#1A1A4D',
      '#000000',
    ],
  },
  black: '#000000',
  white: '#FFFFFF',
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.32), 0 1px 1px rgba(0, 0, 0, 0.24)',
    sm: '0 3px 6px rgba(0, 0, 0, 0.32), 0 3px 2px rgba(0, 0, 0, 0.24)',
    md: '0 10px 20px rgba(0, 0, 0, 0.32), 0 5px 5px rgba(0, 0, 0, 0.24)',
    lg: '0 20px 40px rgba(0, 0, 0, 0.32), 0 10px 10px rgba(0, 0, 0, 0.24)',
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} data-mantine-color-scheme="dark">
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <RootProvider>
          <MantineProvider theme={theme} defaultColorScheme="dark">
            <div style={{ width: '100%', minHeight: '100vh' }}>
              {children}
            </div>
          </MantineProvider>
        </RootProvider>
      </body>
    </html>
  );
}
