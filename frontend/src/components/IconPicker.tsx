import { useState, useCallback, useEffect, useRef } from 'react';
import { iconifyService } from '@/lib/iconify';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string | undefined) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [query, setQuery] = useState('');
  const [icons, setIcons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchIcons = useCallback(async (searchQuery: string) => {
    // Cancelar búsqueda anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!searchQuery.trim()) {
      setIcons([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await iconifyService.searchIcons(searchQuery, 24);
      if (!controller.signal.aborted) {
        setIcons(result.icons);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('Error al buscar iconos');
        }
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Debounce de 300ms
  useEffect(() => {
    const timer = setTimeout(() => searchIcons(query), 300);
    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, searchIcons]);

  const handleClear = () => {
    setQuery('');
    setIcons([]);
    onChange(undefined);
  };

  const selectedIconData = value ? iconifyService.parseIconName(value) : null;

  return (
    <div className="space-y-3">
      {/* Campo de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar icono..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {(query || value) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Icono seleccionado */}
      {selectedIconData && !query && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <img
            src={iconifyService.getIconUrl(selectedIconData.prefix, selectedIconData.name)}
            alt={value}
            width={28}
            height={28}
            className="flex-shrink-0"
          />
          <span className="text-sm font-medium">{value}</span>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Resultados de búsqueda */}
      {query && (
        <>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive text-center py-4">{error}</div>
          )}

          {!loading && !error && icons.length === 0 && query.trim() && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No se encontraron iconos para "{query}"
            </div>
          )}

          {!loading && !error && icons.length > 0 && (
            <div className="grid grid-cols-6 gap-2 max-h-[240px] overflow-y-auto p-1">
              {icons.map((iconFullName) => {
                const parsed = iconifyService.parseIconName(iconFullName);
                if (!parsed) return null;

                const isSelected = value === iconFullName;

                return (
                  <button
                    key={iconFullName}
                    type="button"
                    onClick={() => {
                      onChange(iconFullName);
                      setQuery('');
                      setIcons([]);
                    }}
                    title={iconFullName}
                    className={`
                      flex items-center justify-center p-2 rounded-md transition-all
                      hover:bg-accent hover:scale-110
                      ${isSelected ? 'bg-primary/10 ring-2 ring-primary' : 'bg-muted/50'}
                    `}
                  >
                    <img
                      src={iconifyService.getIconUrl(parsed.prefix, parsed.name)}
                      alt={parsed.name}
                      width={22}
                      height={22}
                      loading="lazy"
                      className="pointer-events-none"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Texto de ayuda */}
      {!query && !value && (
        <p className="text-xs text-muted-foreground">
          Escribí para buscar iconos. Ejemplos: "book", "code", "brain", "rocket"
        </p>
      )}
    </div>
  );
}
