import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { AIAssistant } from "@/components/ai-assistant";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { NewLeadDialog } from "@/components/new-lead-dialog";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
    </ThemeProvider>
  );
}

function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
          <div className="flex h-12 shrink-0 items-center justify-end gap-2 px-4 lg:px-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
            <NewLeadDialog />
            <ThemeToggle />
          </div>
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </main>
        <AIAssistant />
        <Toaster position="bottom-right" richColors />
      </div>
  );
}