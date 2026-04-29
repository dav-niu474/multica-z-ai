'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Zap } from 'lucide-react';

export function SkillsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-base font-medium">Skills</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define and manage reusable agent skills.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
          <Zap className="size-8 mr-2 opacity-40" />
          <span className="text-sm">Skills view loading...</span>
        </CardContent>
      </Card>
    </div>
  );
}
