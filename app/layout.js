import { DM_Serif_Display } from "next/font/google";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif-display",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata = {
  title: "Mi Rutina Diaria",
  description: "Tu compañera diaria para construir hábitos saludables y registrar tu bienestar.",
  keywords: ["rutina", "hábitos", "bienestar", "checklist", "diario"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${dmSerifDisplay.variable} h-full`}>
      <body
        className="min-h-dvh flex flex-col"
        style={{
          backgroundColor: "var(--color-surface-page)",
          color: "var(--color-text-primary)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
