function escapeCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Build CSV text and trigger a browser download. */
export function downloadCSV(filename: string, rows: string[][]): void {
  const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
  // BOM so Excel reads UTF-8 (the ৳ sign etc.) correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
