
"use client";

import { useState, useEffect } from 'react';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';

export interface SearchableItem {
  href: string;
  label: string;
  description?: string;
}

interface SearchDialogProps {
  searchableItems: SearchableItem[];
  onSelect: () => void;
}

export function SearchDialog({ searchableItems, onSelect }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchableItem[]>([]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const filteredResults = searchableItems.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
    );
    setResults(filteredResults);
  }, [query, searchableItems]);

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Search Website</DialogTitle>
      </DialogHeader>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for courses, blog posts, and more..."
          className="w-full pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="mt-4 max-h-60 overflow-y-auto">
        {results.length > 0 ? (
          <ul className="space-y-2">
            {results.map((result) => (
              <li key={`${result.href}-${result.label}`}>
                <Link
                  href={result.href}
                  className="block p-3 rounded-md hover:bg-accent transition-colors"
                  onClick={onSelect}
                >
                  <p className="font-medium text-foreground">{result.label}</p>
                  <p className="text-sm text-muted-foreground">{result.description || result.href}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          query.trim() !== '' && (
            <p className="text-center text-muted-foreground py-4">
              No results found.
            </p>
          )
        )}
      </div>
    </DialogContent>
  );
}
