import { Search } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** The header search pill: 48px tall, borderless pale surface, icon submit on the right. */
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
        "flex h-12 flex-1 items-center gap-2 rounded-full bg-surface px-4 transition-shadow focus-within:ring-2 focus-within:ring-ring max-md:order-3 max-md:basis-full",
        className,
      )}
    >
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar productos"
        aria-label="Buscar productos"
        className="h-auto flex-1 rounded-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        aria-label="Buscar"
        className="size-10 shrink-0 rounded-full text-foreground hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Search className="size-5" aria-hidden="true" />
      </Button>
    </form>
  );
}
