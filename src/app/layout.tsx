"use client";

import "./globals.css";
import { Box, createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { createContext, useContext, useState } from "react";

const casinoTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#ffd700",
    },
    secondary: {
      main: "#ffd700",
    },
    background: {
      default: "#013220", // Dark green background for the whole app
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff", // White background for Card
          color: "#000000", // Black text for Card
        },
      },
    },
  },
});

const lightTheme = createTheme({
  palette: {
    mode: "light", // Default mode
    primary: {
      main: "#1976d2", // Customize primary color
    },
    secondary: {
      main: "#dc004e", // Customize secondary color
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: "dark", // Dark theme
    primary: {
      main: "#90caf9", // Lighter primary for dark mode
    },
    secondary: {
      main: "#f48fb1", // Lighter secondary for dark mode
    },
  },
});

const themes = {
  light: lightTheme,
  dark: darkTheme,
  casino: casinoTheme,
};

// Create the ThemeContext
const ThemeContext = createContext({
  mode: "light",
  setMode: (mode: "light" | "dark" | "casino") => {},
});

// Custom hook to use ThemeContext
export const useThemeContext = () => useContext(ThemeContext);

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [mode, setMode] = useState<"light" | "dark" | "casino">("casino");

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      <html lang="en">
        <body>
          <ThemeProvider theme={themes[mode]}>
            <CssBaseline />
            <Box height="100vh" width="100vw">{children}</Box>
          </ThemeProvider>
        </body>
      </html>
    </ThemeContext.Provider>
  );
}
