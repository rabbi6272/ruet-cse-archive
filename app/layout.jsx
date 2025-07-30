import "./globals.css";

import { Navbar } from "@/components/home/navbar";
import { FooterComponent } from "@/components/footer/footer";
import { PageTitleProvider } from "@/components/providers/PageTitleProvider";

import { lato } from "./ui/fonts";
import { Toaster } from "react-hot-toast";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  title: "RUET CSE Archive",
  description: "An archive of CSE resources for RUET students",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link
        precedence="default"
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      {/*Dark Mode bg Color  #00284B */}
      {/*Dark Mode text Color  #CDEAFC */}
      {/*Dark Mode bg Color  #071a26f1 */}
      <body
        className={`${lato.className} antialiased bg-gray-200 dark:bg-[#071a26f1]`}
      >
        <PageTitleProvider>
          <SpeedInsights />
          <Analytics />
          <Toaster />
          <Navbar />

          {children}

          <FooterComponent />
        </PageTitleProvider>
      </body>
    </html>
  );
}
