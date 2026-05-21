"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, X } from "lucide-react";

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

type AddressSearchProps = {
  label: string;
  placeholder?: string;
  icon?: React.ReactNode;
  onSelect: (result: { address: string; lat: number; lng: number }) => void;
  defaultValue?: string;
};

export default function AddressSearch({
  label,
  placeholder = "Search for an address...",
  icon,
  onSelect,
  defaultValue = "",
}: AddressSearchProps) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(!!defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    setSelected(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&addressdetails=1&countrycodes=in`,
          {
            headers: {
              "Accept-Language": "en",
            },
          }
        );
        if (res.ok) {
          const data: NominatimResult[] = await res.json();
          setResults(data);
          setOpen(data.length > 0);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function handleSelect(result: NominatimResult) {
    const shortName = formatAddress(result);
    setQuery(shortName);
    setSelected(true);
    setOpen(false);
    onSelect({
      address: shortName,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });
  }

  function formatAddress(result: NominatimResult): string {
    const parts: string[] = [];
    const a = result.address;
    if (a.road) parts.push(a.road);
    if (a.suburb) parts.push(a.suburb);
    if (a.city) parts.push(a.city);
    if (a.postcode) parts.push(a.postcode);
    if (parts.length > 0) return parts.join(", ");
    // Fallback: trim the display_name
    const segments = result.display_name.split(",").slice(0, 4);
    return segments.join(",").trim();
  }

  function clearInput() {
    setQuery("");
    setSelected(false);
    setResults([]);
    setOpen(false);
    onSelect({ address: "", lat: 0, lng: 0 });
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-light" />
        <input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0 && !selected) setOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full pl-9 pr-9 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
            selected
              ? "bg-primary/5 border-primary/30 text-foreground"
              : "bg-surface-hover border-border text-foreground"
          }`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
        )}
        {!loading && query && (
          <button
            onClick={clearInput}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-surface-hover rounded"
          >
            <X className="w-3.5 h-3.5 text-muted" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-border-light z-50 max-h-60 overflow-y-auto animate-fade-in">
          {results.map((result) => (
            <button
              key={result.place_id}
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-surface-hover border-b border-border-light last:border-b-0 flex items-start gap-3"
            >
              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {formatAddress(result)}
                </p>
                <p className="text-xs text-muted mt-0.5 truncate">
                  {result.display_name}
                </p>
                <p className="text-[10px] text-muted-light mt-0.5">
                  📍 {parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected indicator */}
      {selected && (
        <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
          ✓ Location selected
        </p>
      )}
    </div>
  );
}
