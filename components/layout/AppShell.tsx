import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import AIAssistantPanel from '../ai/AIAssistantPanel';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
        {/* Source mapping: dashboard content starts immediately after the sidebar shell. */}
        <div className="flex-1 min-w-0">{children}</div>
      </main>
      <AIAssistantPanel />
    </div>
  );
}
