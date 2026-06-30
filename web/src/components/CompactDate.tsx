import { useRef } from 'react';
import { IconCalendar } from './icons';
import './CompactDate.css';

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (v: string) => void;
  ariaLabel?: string;
}

export default function CompactDate({ value, onChange, ariaLabel }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const dd = value ? value.slice(8, 10) : '--';
  const mm = value ? value.slice(5, 7) : '--';

  function open() {
    const el = ref.current;
    if (!el) return;
    // showPicker() is the modern way; fall back to focus/click.
    const withPicker = el as HTMLInputElement & { showPicker?: () => void };
    if (typeof withPicker.showPicker === 'function') {
      try {
        withPicker.showPicker();
        return;
      } catch {
        /* fall through */
      }
    }
    el.focus();
    el.click();
  }

  return (
    <span className="compact-date">
      <button type="button" className="cd-btn" onClick={open} aria-label={ariaLabel ?? 'Pick date'} title={value}>
        <IconCalendar size={16} />
        <span className="cd-text">
          {dd}/{mm}
        </span>
      </button>
      <input
        ref={ref}
        className="cd-input"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
      />
    </span>
  );
}
