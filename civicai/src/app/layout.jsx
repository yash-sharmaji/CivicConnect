import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

export const metadata = {
  title: "CivicAI - AI-Powered Hyperlocal Community Platform",
  description: "See it. Snap it. Solve it. Report local infrastructure issues, verify status, and coordinate resolutions with AI diagnostics.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#030303]">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
