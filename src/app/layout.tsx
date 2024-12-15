import ThemeProvider from "@/components/theme/theme";
import { Box } from "@mui/material";
import "./globals.css";
import '@mui/material/styles';

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
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
