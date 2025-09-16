import { Providers } from '@/providers';
import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: 'CampusLane - Fun Learning Platform for Kids',
  description: 'Interactive learning platform designed for students in grades 3-5. Engaging lessons, fun quizzes, and progress tracking for kids, teachers, and parents.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}