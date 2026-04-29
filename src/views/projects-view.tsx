'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FolderKanban } from 'lucide-react';

export function ProjectsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-base font-medium">Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organize issues and agents into projects.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
          <FolderKanban className="size-8 mr-2 opacity-40" />
          <span className="text-sm">Projects view loading...</span>
        </CardContent>
      </Card>
    </div>
  );
}
