import { Search } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** The header search pill: 44px tall, fully rounded, brand-coloured submit label. */
export function SearchBar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const queryFromUrl = typeof search.q === "string" ? search.q : "";
  const [query, setQuery] = useState(queryFromUrl);

  // Prefill from the URL: the `q` param only exists on /products.
  useEffect(() => {
    setQuery(queryFromUrl);
  }, [queryFromUrl]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (value.length === 0) {
      toast("Escribe algo para buscar");
      return;
    }
    void navigate({ to: "/products", search: { q: value } });
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        "flex h-11 flex-1 items-center gap-2 rounded-full border border-border bg-background px-4 transition-colors focus-within:border-brand max-md:order-3 max-md:basis-full",
        className,
      )}
    >
      <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="¿Qué estás buscando?"
        aria-label="Buscar productos"
        className="h-auto flex-1 rounded-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
      />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="h-11 shrink-0 px-0 text-sm font-bold text-brand hover:bg-transparent"
      >
        Buscar
      </Button>
    </form>
  );
}
