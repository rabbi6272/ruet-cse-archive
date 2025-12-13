import { Inter, Lato, Nunito, IBM_Plex_Sans } from "next/font/google";
import localFont from "next/font/local";

export const avengero = localFont({
  src: "./AvengeroRegular.ttf",
});
export const avegance = localFont({
  src: "./AvengeanceHeroicAvengerItalic.otf",
});
export const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  weight: ["100", "300", "400", "700", "900"],
  display: "swap",
});

export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});
