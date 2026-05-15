import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RouteFinder — Smart Delivery Route Finder",
  description: "Dijkstra-powered shortest path finder for delivery routes across Surabaya districts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="noise">{children}</body>
    </html>
  );
}