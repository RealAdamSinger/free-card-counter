"use client";

import { createTheme, CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import { createContext, useContext, useState } from "react";

const casinoTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#ffd700",
      contrastText: "#1a1200",
    },
    secondary: {
      main: "#ffd700",
    },
    success: { main: "#4ade80" },
    error: { main: "#f87171" },
    warning: { main: "#fbbf24" },
    background: {
      default: "#0b2a1c", // Deep green base
      paper: "#0f3b28", // Surface green
    },
    text: {
      primary: "#eaf3ee",
      secondary: "rgba(234, 243, 238, 0.65)",
    },
    divider: "rgba(255, 255, 255, 0.12)",
  },
  typography: {
    h6: { fontWeight: 700, letterSpacing: 0.2 },
    button: { fontWeight: 600, textTransform: "none", letterSpacing: 0.2 },
    overline: { letterSpacing: 1.4 },
    caption: { letterSpacing: 0.2 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: "100vh",
          background:
            "radial-gradient(1200px 800px at 18% -10%, #17553a 0%, #0b2a1c 55%, #071c13 100%)",
          backgroundAttachment: "fixed",
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: "#f7faf8", // Light "card face"
          color: "#10261c",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.35)",
          transition: "transform .15s ease, box-shadow .15s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 6px 16px rgba(0, 0, 0, 0.45)",
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          fontWeight: 600,
          paddingInline: 18,
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          textTransform: "uppercase",
          fontSize: 12,
          letterSpacing: 1.4,
          fontWeight: 700,
          color: "rgba(234, 243, 238, 0.55)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(7, 26, 18, 0.82)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "none",
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
  setMode: (mode: "light" | "dark" | "casino") => { },
});

// Custom hook to use ThemeContext
export const useThemeContext = () => useContext(ThemeContext);

export default function ThemeProvider({ children, }: Readonly<{ children: React.ReactNode }>) {
  const [mode, setMode] = useState<"light" | "dark" | "casino">("casino");

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      <MuiThemeProvider theme={themes[mode]}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
