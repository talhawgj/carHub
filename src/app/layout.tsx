import type { Metadata } from "next";
import { AuthProvider } from "@/lib/authContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QueryProvider from "@/components/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chaudhary Motors - Find Your Perfect Car in Pakistan",
  description: "Pakistan's trusted car marketplace. Browse new and used cars with detailed specs, pricing, and comparison tools at Chaudhary Motors.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" style={{ height: '100%' }} data-scroll-behavior="smooth">
      <body style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: '#f5f7fa' }}>
        <QueryProvider>
          <AuthProvider>
            <Navbar />
            <main style={{ flex: 1 }}>{children}</main>
            <Footer />
            {/* WhatsApp Floating Button */}
            <a
              id="whatsapp-btn"
              href="https://wa.me/923001234567"
              target="_blank"
              rel="noopener noreferrer"
              title="Chat on WhatsApp"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.374 0 0 5.373 0 12c0 2.12.554 4.107 1.523 5.83L.057 23.428a.5.5 0 00.515.657l5.746-1.508A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.916 0-3.718-.502-5.276-1.38l-.377-.222-3.91 1.027 1.04-3.81-.245-.393A9.956 9.956 0 012 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z"/>
              </svg>
            </a>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
