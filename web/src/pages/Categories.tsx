import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useFinance } from '../data/FinanceProvider';
import type { Category, CategoryKind } from '../types/db';

function CategoryRow({ c }: { c: Category }) {
  const { renameCategory, removeCategory } = useFinance();

  async function onRename() {
    const name = window.prompt('Rename category', c.name)?.trim();
    if (!name || name === c.name) return;
    await renameCategory(c.id, { name });
  }
  async function onDelete() {
    if (!window.confirm(`Delete "${c.name}"? Past transactions stay as Uncategorized.`)) return;
    await removeCategory(c.id);
  }

  return (
    <div className="tx-row">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: 4,
            background: c.color ?? 'var(--surface-2)',
            border: '1px solid var(--border)',
            display: 'inline-block',
          }}
        />
        <span className="tx-title">{c.name}</span>
      </div>
      <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
        <button className="btn btn-ghost" onClick={onRename}>
          Rename
        </button>
        <button className="btn btn-danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default function Categories() {
  const { categories, addCategory, loading, error } = useFinance();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<CategoryKind>('expense');
  const [color, setColor] = useState('#c96442');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const expense = useMemo(() => categories.filter((c) => c.kind === 'expense'), [categories]);
  const income = useMemo(() => categories.filter((c) => c.kind === 'income'), [categories]);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Enter a category name.');
      return;
    }
    setBusy(true);
    try {
      await addCategory({ name: trimmed, kind, color });
      setName('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add category');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <h1 style={{ margin: 0 }}>Categories</h1>
      {error && <div className="error">{error}</div>}

      <form className="card" onSubmit={onAdd} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--sp-3)' }}>
          <div className="field">
            <label htmlFor="cat-name">Name</label>
            <input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rent" />
          </div>
          <div className="field">
            <label htmlFor="cat-kind">Type</label>
            <select id="cat-kind" value={kind} onChange={(e) => setKind(e.target.value as CategoryKind)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="cat-color">Color</label>
            <input id="cat-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ padding: 4, height: 42 }} />
          </div>
        </div>
        {formError && <div className="error">{formError}</div>}
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ alignSelf: 'flex-start' }}>
          {busy ? 'Adding…' : 'Add category'}
        </button>
      </form>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Expense</h2>
            {expense.length === 0 ? <p className="muted">None.</p> : expense.map((c) => <CategoryRow key={c.id} c={c} />)}
          </div>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Income</h2>
            {income.length === 0 ? <p className="muted">None.</p> : income.map((c) => <CategoryRow key={c.id} c={c} />)}
          </div>
        </div>
      )}
    </div>
  );
}
