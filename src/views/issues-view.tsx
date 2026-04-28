'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CircleDot } from 'lucide-react';

export function IssuesView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-base font-medium">Issues</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and manage issues across your projects.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
          <CircleDot className="size-8 mr-2 opacity-40" />
          <span className="text-sm">Issues view loading...</span>
        </CardContent>
      </Card>
    </div>
  );
}
