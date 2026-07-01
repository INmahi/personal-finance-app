import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconChevronDown } from './icons';
import './CategoryField.css';

export interface CategoryOption {
  name: string;
  color?: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: CategoryOption[];
  placeholder?: string;
  ariaLabel?: string;
  /** When provided, shows a "+ Add category" row that creates + selects a new category. */
  onAddCategory?: (name: string) => void | Promise<void>;
}

/**
 * Type a value or pick an existing category from the dropdown. Value is plain
 * text; typing never creates a category (the caller matches it to an existing
 * one or stores it as a free-text label). Use "+ Add category" to actually
 * create one.
 */
export default function CategoryField({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  onAddCategory,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const q = value.trim().toLowerCase();
  const list = showAll || q === '' ? options : options.filter((o) => o.name.toLowerCase().includes(q));

  const place = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  function openMenu(all: boolean) {
    place();
    setShowAll(all);
    setOpen(true);
  }

  function pick(name: string) {
    onChange(name);
    setOpen(false);
    inputRef.current?.focus();
  }

  async function handleAdd() {
    const name = window.prompt('New category name')?.trim();
    if (!name) return;
    if (onAddCategory) await onAddCategory(name);
    onChange(name);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const reposition = () => place();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    // Reposition (not close) as the page/containers scroll.
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, place]);

  return (
    <div className="catfield" ref={wrapRef}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowAll(false);
          if (!open) openMenu(false);
          else place();
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
      />
      <button
        type="button"
        className="catfield-btn"
        aria-label="Pick from categories"
        onClick={() => (open ? setOpen(false) : openMenu(true))}
      >
        <IconChevronDown size={16} />
      </button>

      {open &&
        pos &&
        createPortal(
          <ul
            ref={menuRef}
            className="catfield-menu"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            {list.length === 0 ? (
              <li className="catfield-empty">No match — saved as typed</li>
            ) : (
              list.map((o) => (
                <li key={o.name}>
                  <button type="button" onClick={() => pick(o.name)}>
                    <span className="cat-swatch" style={{ background: o.color ?? 'var(--border)' }} />
                    {o.name}
                  </button>
                </li>
              ))
            )}
            {onAddCategory && (
              <li className="catfield-add">
                <button type="button" onClick={handleAdd}>
                  + Add category
                </button>
              </li>
            )}
          </ul>,
          document.body,
        )}
    </div>
  );
}
