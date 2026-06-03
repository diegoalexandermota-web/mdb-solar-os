import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-card p-0.5 shadow-card",
        className,
      )}
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-pressed={theme === "light"}
        title="Light mode"
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors",
          theme === "light"
            ? "bg-gold text-gold-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Sun className="size-3.5" />
        <span className="hidden sm:inline">Light</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-pressed={theme === "dark"}
        title="Dark mode"
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors",
          theme === "dark"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Moon className="size-3.5" />
        <span className="hidden sm:inline">Dark</span>
      </button>
    </div>
  );
}