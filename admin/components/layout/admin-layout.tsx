'use client';

import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="relative ml-64 max-h-screen overflow-y-scroll">
        <Topbar />
        <main className="flex-1 space-y-4 mt-16">
          {children}
        </main>
      </div>
    </div>
  );
}