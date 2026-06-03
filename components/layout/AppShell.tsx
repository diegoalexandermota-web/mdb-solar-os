import type { ReactNode } from 'react';
import { Plus, Sun } from 'lucide-react';
import Sidebar from './Sidebar';
import AIAssistantPanel from '../ai/AIAssistantPanel';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
        <div className="flex h-12 shrink-0 items-center justify-end gap-2 px-4 lg:px-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
          <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide" type="button">
            <Plus className="size-3.5" /> New Lead
          </button>
          <button className="inline-flex items-center gap-2 bg-card border border-border text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide" type="button">
            <Sun className="size-3.5" /> Theme
          </button>
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </main>
      <AIAssistantPanel />
    </div>
  );
}
