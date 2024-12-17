'use client';

import ThemeProvider from "@/components/theme/theme";
import { Box } from "@mui/material";
import { useEffect } from "react";
import "./globals.css";

declare global {
  interface Window {
    kofiWidgetOverlay: {
      draw: (username: string, options: Record<string, string>) => void;
    };
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Dynamically load the external script
    const script = document.createElement("script");
    script.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
    script.async = true;
    script.onload = () => {
      // Ensure kofiWidgetOverlay is available
      if (window.kofiWidgetOverlay) {
        window.kofiWidgetOverlay.draw("adamsapps", {
          type: "floating-chat",
          "floating-chat.donateButton.text": "Tip Me",
          "floating-chat.donateButton.background-color": "#00b9fe",
          "floating-chat.donateButton.text-color": "#fff",
        });
      }
    };
    document.body.appendChild(script);
  }, []);

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
