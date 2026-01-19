/**
 * Lufga font configuration for Next.js
 * Loads all Lufga font weights and styles
 */
import localFont from "next/font/local";

/**
 * Lufga font family with all weights and styles
 */
export const lufga = localFont({
  src: [
    {
      path: "../public/fonts/LufgaThin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/fonts/LufgaThinItalic.ttf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../public/fonts/LufgaExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../public/fonts/LufgaExtraLightItalic.ttf",
      weight: "200",
      style: "italic",
    },
    {
      path: "../public/fonts/LufgaLight.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/LufgaLightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/LufgaRegular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/LufgaItalic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/LufgaMedium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/LufgaMediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/fonts/LufgaSemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/LufgaSemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/LufgaBold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/LufgaBoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../public/fonts/LufgaExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/fonts/LufgaExtraBoldItalic.ttf",
      weight: "800",
      style: "italic",
    },
    {
      path: "../public/fonts/LufgaBlack.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../public/fonts/LufgaBlackItalic.ttf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-lufga",
  display: "swap",
});
