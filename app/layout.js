import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AuthWrapper from "./components/AuthWrapper";
import { CompanyProvider } from "./context/CompanyContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Protected Dashboard",
  description: "Dashboard with JWT authentication",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Toaster position="top-right" richColors closeButton />
        
        <AuthWrapper><CompanyProvider>{children}</CompanyProvider></AuthWrapper>
        
      </body>
    </html>
  );
}
