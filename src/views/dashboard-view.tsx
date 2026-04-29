'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutDashboard } from 'lucide-react';

export function DashboardView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-base font-medium">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your workspace activity and agent performance.
        </p>
      </div>

      {/* Stats skeleton grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                Metric {i + 1}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <LayoutDashboard className="size-8 mr-2 opacity-40" />
            <span className="text-sm">Dashboard content loading...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
