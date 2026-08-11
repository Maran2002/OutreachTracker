'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, BookUser, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * EmailGalleryCombobox
 *
 * A free-text input that also shows matching contacts from the Email Gallery
 * as live dropdown suggestions.
 *
 * Props:
 *   value            – current text value (email or URL)
 *   onChange         – (string) => void  – called on every keystroke / clear
 *   onContactSelect  – (contact) => void – called when a gallery item is chosen
 *                      contact: { _id, name, email, position, companyName }
 *   contacts         – EmailRecord[] from the gallery
 *   label            – field label string
 *   error            – validation error string
 *   helperText       – helper text below the field
 *   placeholder      – input placeholder
 *   disabled         – boolean
 */
export default function EmailGalleryCombobox({
  value = '',
  onChange,
  onContactSelect,
  contacts = [],
  label,
  error,
  helperText,
  placeholder = 'e.g. sarah@acme.com or linkedin.com/in/sarah',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedContactId, setSelectedContactId] = useState(null);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter gallery contacts by the current typed value
  const suggestions = value.trim().length > 0
    ? contacts.filter((c) => {
        const q = value.toLowerCase();
        return (
          c.email.includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.companyName.toLowerCase().includes(q) ||
          c.position.toLowerCase().includes(q)
        );
      })
    : contacts.slice(0, 8); // show up to 8 recents when input is empty/focused

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [suggestions.length]);

  const handleInputChange = (e) => {
    onChange(e.target.value);
    setSelectedContactId(null); // user is typing manually => deselect gallery pick
    setIsOpen(true);
  };

  const handleSelect = useCallback(
    (contact) => {
      onChange(contact.email);
      setSelectedContactId(contact._id);
      onContactSelect?.(contact);
      setIsOpen(false);
    },
    [onChange, onContactSelect]
  );

  const handleClear = () => {
    onChange('');
    setSelectedContactId(null);
    onContactSelect?.(null);
    inputRef.current?.focus();
    setIsOpen(true);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[highlightedIndex]) {
        handleSelect(suggestions[highlightedIndex]);
      }
    }
  };

  const selectedContact = selectedContactId
    ? contacts.find((c) => c._id === selectedContactId)
    : null;

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-1.5 w-full min-w-0 relative"
    >
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          {label}
          {contacts.length > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-normal normal-case tracking-normal text-blue-500/70">
              <BookUser className="w-3 h-3" />
              {contacts.length} saved
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Search icon */}
        <div className="absolute left-3 text-slate-500 pointer-events-none z-10">
          {selectedContact ? (
            <UserCheck className="w-4 h-4 text-blue-400" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => contacts.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={cn(
            'w-full min-h-10 bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-lg py-2.5 pl-9 pr-9 transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-600',
            disabled && 'opacity-50 cursor-not-allowed bg-slate-950',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            selectedContact && 'border-blue-500/40 bg-blue-500/5'
          )}
        />

        {/* Clear button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-0.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            tabIndex={-1}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Pill badge when a gallery contact is selected */}
      {selectedContact && (
        <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 mt-0.5">
          <UserCheck className="w-3 h-3" />
          Filled from gallery: <strong>{selectedContact.name}</strong> — other fields auto-filled below
        </span>
      )}

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden max-h-56 flex flex-col">
          <div className="px-3 py-1.5 border-b border-slate-800 flex items-center gap-1.5">
            <BookUser className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
              Email Gallery — click to auto-fill
            </span>
          </div>
          <ul className="overflow-y-auto py-1" role="listbox">
            {suggestions.map((contact, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const isSelected = contact._id === selectedContactId;
              return (
                <li
                  key={contact._id}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent blur before click fires
                    handleSelect(contact);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={cn(
                    'px-3 py-2 cursor-pointer transition-colors flex flex-col gap-0',
                    isHighlighted ? 'bg-slate-800' : '',
                    isSelected ? 'bg-blue-500/10' : ''
                  )}
                >
                  <span className="text-sm font-medium text-slate-100 leading-tight">
                    {contact.name}
                    <span className="font-normal text-blue-400 ml-1.5 text-xs">
                      {contact.email}
                    </span>
                  </span>
                  <span className="text-xs text-slate-500 leading-tight">
                    {contact.position} · {contact.companyName}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && <span className="text-xs text-red-400 mt-0.5">{error}</span>}
      {helperText && !error && (
        <span className="text-xs text-slate-500 mt-0.5">{helperText}</span>
      )}
    </div>
  );
}
