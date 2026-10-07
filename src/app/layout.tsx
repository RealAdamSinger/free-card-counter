import { Analytics } from "@vercel/analytics/next";
import ThemeProvider from "@/components/theme/theme";
import "./globals.css";

export { metadata } from "./metadata";

declare global {
  interface Window {
    kofiwidget2: {
      draw: () => void;
      init: (text: string, color: string, id: string) => void;
    };
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <div style={{ height: "100vh", width: "100vw" }}>
            {children}
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
