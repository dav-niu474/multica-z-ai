'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Bot } from 'lucide-react';

export function AgentsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-base font-medium">Agents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and monitor your AI agents.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
          <Bot className="size-8 mr-2 opacity-40" />
          <span className="text-sm">Agents view loading...</span>
        </CardContent>
      </Card>
    </div>
  );
}
