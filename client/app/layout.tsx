import './globals.css';
import type { Metadata } from 'next';

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
        {children}
      </body>
    </html>
  );
}