import { Search, X } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

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

  function handleClear() {
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        "flex h-12 flex-1 items-center gap-2 rounded-full bg-surface pl-6 pr-4 transition-shadow focus-within:ring-2 focus-within:ring-ring max-md:order-3 max-md:basis-full",
        className,
      )}
    >
      <Input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar productos"
        aria-label="Buscar productos"
        className="h-auto flex-1 cursor-text rounded-none border-0 bg-transparent p-0 text-[0.9rem] focus-visible:ring-0 md:text-[0.9rem] [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
      />
      {query.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Limpiar búsqueda"
          onClick={handleClear}
          className="size-11 shrink-0 cursor-pointer rounded-full text-foreground hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X className="size-5" aria-hidden="true" />
        </Button>
      )}
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        aria-label="Buscar"
        className="size-10 shrink-0 cursor-pointer rounded-full text-foreground hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Search className="size-5" aria-hidden="true" />
      </Button>
    </form>
  );
}
