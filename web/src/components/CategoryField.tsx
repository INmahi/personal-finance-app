import { useEffect, useRef, useState } from 'react';
import { IconChevronDown } from './icons';
import './CategoryField.css';

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  ariaLabel?: string;
}

/**
 * Type a value or pick an existing one from the dropdown. The value is plain
 * text; the caller decides how to store it (match to a category or keep as a
 * free-text label). Typing never creates a category.
 */
export default function CategoryField({ value, onChange, options, placeholder, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = value.trim().toLowerCase();
  const list = showAll || q === '' ? options : options.filter((o) => o.toLowerCase().includes(q));

  function place() {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: r.width });
  }

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

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    document.addEventListener('mousedown', onDoc);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [open]);

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
      {open && pos && (
        <ul className="catfield-menu" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          {list.length === 0 ? (
            <li className="catfield-empty">No match — saved as typed</li>
          ) : (
            list.map((name) => (
              <li key={name}>
                <button type="button" onClick={() => pick(name)}>
                  {name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
