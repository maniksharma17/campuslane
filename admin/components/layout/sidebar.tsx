'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GraduationCap,
  ShoppingCart,
  Users,
  BarChart3,
  FileText,
  Package,
  FolderOpen,
  ShoppingBag,
  Building2,
  UserCheck,
  UserCog,
  CircleCheckBig,
} from 'lucide-react';

interface NavItem {
  title: string;
  href?: string;
  icon: any;
  items?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    title: 'Home',
    icon: GraduationCap,
    items: [
      { title: 'Overview', href: '/admin/dashboard', icon: BarChart3 },
    ],
  },
  {
    title: 'Education',
    icon: GraduationCap,
    items: [
      { title: 'Content', href: '/admin/education/classes', icon: FileText },
      { title: 'Content Approval', href: '/admin/education/approvals', icon: CircleCheckBig },
    ],
  },
  {
    title: 'E-commerce',
    icon: ShoppingCart,
    items: [
      { title: 'Products', href: '/admin/ecommerce/products', icon: Package },
      { title: 'Categories', href: '/admin/ecommerce/categories', icon: FolderOpen },
      { title: 'Orders', href: '/admin/ecommerce/orders', icon: ShoppingBag },
      // { title: 'Schools', href: '/admin/ecommerce/schools', icon: Building2 },
    ],
  },
  {
    title: 'Users',
    icon: Users,
    items: [
      { title: 'Students', href: '/admin/users/students', icon: UserCheck },
      { title: 'Teachers', href: '/admin/users/teachers', icon: UserCog },
      { title: 'Teacher Approval', href: '/admin/users/notifications', icon: CircleCheckBig },
    ],
  },
  // {
  //   title: 'Analytics',
  //   icon: BarChart3,
  //   items: [
  //     { title: 'Users', href: '/admin/analytics/users', icon: Users },
  //     { title: 'Content', href: '/admin/analytics/content', icon: FileText },
  //   ],
  // },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card shadow-lg flex flex-col',
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-28 items-center justify-center px-12 border-b bg-gray-50">
        <Image
          src="/logo.png"
          height={60}
          width={200}
          alt="CampusLane"
          className="object-contain"
        />
      </div>

      {/* Menu */}
      <ScrollArea className="flex-1 px-2 py-4">
        <div>
          {navigationItems.map((item) => (
            <NavItemComponent key={item.title} item={item} pathname={pathname} />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}

interface NavItemComponentProps {
  item: NavItem;
  pathname: string;
}

function NavItemComponent({ item, pathname }: NavItemComponentProps) {
  const hasChildren = item.items && item.items.length > 0;
  const isActive =
    pathname === item.href ||
    (hasChildren && item.items?.some((child) => pathname === child.href));

  if (hasChildren) {
    return (
      <div>
        {/* Heading */}
        <Button
          variant={"ghost"}
          className="w-full justify-start font-medium px-3 text-gray-600"
        >
          <span className="ml-2">{item.title}</span>
        </Button>

        {/* Always show children */}
        <div className="ml-8 mt-1 space-y-1">
          {item.items?.map((child) => (
            <Link key={child.href} href={child.href!}>
              <Button
                variant={pathname === child.href ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full justify-start px-3"
              >
                <child.icon className="h-4 w-4 shrink-0" />
                <span className="ml-2">{child.title}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Simple item (no children)
  return (
    <Link href={item.href!}>
      <Button
        variant={pathname === item.href ? 'secondary' : 'ghost'}
        className="w-full justify-start px-3"
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="ml-2">{item.title}</span>
      </Button>
    </Link>
  );
}
