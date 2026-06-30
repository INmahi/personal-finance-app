-- Free-text category label for a single transaction (used when the user types a
-- custom "Spent on" value instead of picking a saved category). When set,
-- category_id is null; display falls back to this label.
alter table public.transactions add column category_label text;
