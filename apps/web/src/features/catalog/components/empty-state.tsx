import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  onReset: () => void;
  title?: string;
};

/** The centred empty state shown when no product survives the active filters. */
export function EmptyState({ onReset, title = "No hay productos con estos filtros" }: EmptyStateProps) {
  return (
    <div className="rounded-lg bg-surface px-4 py-8 text-center">
      <Search
        aria-hidden="true"
        strokeWidth={1.4}
        className="mx-auto mb-2 size-12 text-muted-foreground"
      />
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 mb-3 text-sm text-muted-foreground">
        Prueba a ampliar el rango de precio o a quitar alguna marca.
      </p>
      <Button type="button" size="pill" onClick={onReset}>
        Limpiar filtros
      </Button>
    </div>
  );
}
