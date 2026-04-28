'use client';

import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export function ChatView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-base font-medium">Chat</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time conversations with your AI agents.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
          <MessageSquare className="size-8 mr-2 opacity-40" />
          <span className="text-sm">Chat view loading...</span>
        </CardContent>
      </Card>
    </div>
  );
}
