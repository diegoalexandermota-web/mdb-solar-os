import { cloneElement, createContext, useContext, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';

type SheetContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SheetContext = createContext<SheetContextValue | null>(null);

export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ open, setOpen: onOpenChange }), [open, onOpenChange]);

  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

export function SheetTrigger({ asChild, children }: { asChild?: boolean; children: ReactElement<any> }) {
  const context = useContext(SheetContext);
  if (!context) throw new Error('SheetTrigger must be used inside Sheet');

  if (asChild) {
    return cloneElement(children, {
      onClick: () => context.setOpen(true),
    } as Partial<any>);
  }

  return (
    <button type="button" onClick={() => context.setOpen(true)}>
      {children}
    </button>
  );
}

export function SheetContent({
  side = 'right',
  className,
  children,
}: {
  side?: 'left' | 'right';
  className?: string;
  children: ReactNode;
}) {
  const context = useContext(SheetContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!context || !mounted || !context.open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/50" onClick={() => context.setOpen(false)}>
      <div
        className={cn(
          'absolute top-0 h-full w-64 bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col shadow-2xl',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
