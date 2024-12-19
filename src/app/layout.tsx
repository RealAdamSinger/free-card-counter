'use client';

import ThemeProvider from "@/components/theme/theme";
import { Box } from "@mui/material";
import "./globals.css";

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
          <Box height="100vh" width="100vw">
            {children}
          </Box>
        </ThemeProvider>
      </body>
    </html>
  );
}
