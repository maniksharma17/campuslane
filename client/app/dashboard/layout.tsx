import Navbar from "@/components/navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="lg:py-12">{children}</main>
      </body>
    </html>
  );
}