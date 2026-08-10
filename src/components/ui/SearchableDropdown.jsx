'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SearchableDropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  label,
  error,
  helperText,
  disabled = false,
  isClearable = true,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm('');
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    }
  };

  return (
    <div className={cn('flex flex-col gap-1.5 w-full min-w-0 relative', className)} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'w-full flex items-center justify-between px-3.5 py-2.5 text-sm rounded-lg border bg-slate-900 text-slate-100 transition-all cursor-pointer',
          isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700',
          disabled && 'opacity-50 cursor-not-allowed bg-slate-950',
          error && 'border-red-500'
        )}
      >
        <span className={cn('min-w-0 truncate text-left', !selectedOption && 'text-slate-500')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          {isClearable && selectedOption && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden max-h-60 flex flex-col">
          <div className="p-2 border-b border-slate-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-slate-100 focus:outline-none placeholder:text-slate-500"
            />
          </div>

          <ul role="listbox" className="overflow-y-auto py-1 max-h-48">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-500 text-center">No options found</li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      'px-3 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors',
                      isHighlighted ? 'bg-slate-800 text-slate-100' : 'text-slate-300',
                      isSelected && 'font-medium text-blue-400'
                    )}
                  >
                    <span className="min-w-0 truncate">{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-400 ml-2 flex-shrink-0" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {error && <span className="text-xs text-red-400 mt-0.5">{error}</span>}
      {helperText && !error && <span className="text-xs text-slate-500 mt-0.5">{helperText}</span>}
    </div>
  );
}
