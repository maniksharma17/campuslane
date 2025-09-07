'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/auth';
import {
  ChevronRight,
  LogOut,
  User,
  Bell,
  Settings,
} from 'lucide-react';

export function Topbar() {
  const pathname = usePathname();
  const { admin, clearAuth } = useAuthStore();

  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const href = '/' + segments.slice(0, i + 1).join('/');
      const title = segment.charAt(0).toUpperCase() + segment.slice(1);

      breadcrumbs.push({ title, href, isLast: i === segments.length - 1 });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const router = useRouter();

  return (
    <div className="absolute left-0 top-0 right-0 flex h-16 items-center justify-between border-b bg-card px-6 shadow-sm">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center space-x-2">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span
              className={
                crumb.isLast
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground hover:text-foreground cursor-pointer'
              }
            >
              {crumb.title}
            </span>
          </div>
        ))}
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full"
          onClick={()=>{
            router.push("/admin/notifications")
          }}
        >
          <Bell className="h-5 w-5" />
          {/* Example notification dot */}
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full"
        >
          <Settings className="h-5 w-5" />
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder-avatar.jpg" alt={admin?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {admin?.name?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{admin?.name}</p>
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                  {admin?.email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clearAuth}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
