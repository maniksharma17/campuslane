'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/components/layout/admin-layout';
import { 
  Users, 
  FileText, 
  ShoppingCart, 
  TrendingUp,
  Database,
  TestTube,
  FolderPlus,
  Plus
} from 'lucide-react';

const quickActions = [
  {
    title: 'Seed Sample Data',
    description: 'Generate sample data for testing',
    icon: Database,
    action: 'seed-data',
    variant: 'outline' as const,
  },
  {
    title: 'Generate Presign Test',
    description: 'Test S3 presign functionality',
    icon: TestTube,
    action: 'test-presign',
    variant: 'outline' as const,
  },
  {
    title: 'Create Class',
    description: 'Add a new class to the system',
    icon: FolderPlus,
    action: 'create-class',
    variant: 'default' as const,
  },
  {
    title: 'Create Content',
    description: 'Upload new educational content',
    icon: Plus,
    action: 'create-content',
    variant: 'default' as const,
  },
];

const stats = [
  {
    title: 'Total Users',
    value: '2,543',
    description: '+12% from last month',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Content Items',
    value: '1,247',
    description: '+8% from last month',
    icon: FileText,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Active Orders',
    value: '186',
    description: '+23% from last month',
    icon: ShoppingCart,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    title: 'Revenue',
    value: '$12,549',
    description: '+15% from last month',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
];

export default function DashboardPage() {
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'seed-data':
        // TODO: Implement seed data functionality
        console.log('Seeding sample data...');
        break;
      case 'test-presign':
        // TODO: Implement presign test
        console.log('Testing presign functionality...');
        break;
      case 'create-class':
        // TODO: Navigate to class creation
        console.log('Creating new class...');
        break;
      case 'create-content':
        // TODO: Navigate to content creation
        console.log('Creating new content...');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your admin dashboard. Here&apos;s an overview of your platform.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-full`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Perform common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {quickActions.map((action) => (
                  <div
                    key={action.action}
                    className="flex items-center space-x-4 rounded-lg border p-4"
                  >
                    <div className="bg-muted p-2 rounded-full">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {action.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <Button
                      variant={action.variant}
                      size="sm"
                      onClick={() => handleQuickAction(action.action)}
                    >
                      Go
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest actions on your platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New teacher registered</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Content approved</p>
                      <p className="text-xs text-muted-foreground">5 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New order placed</p>
                      <p className="text-xs text-muted-foreground">10 minutes ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}