/**
 * Generic CSV export utility — Excel FR compatible (UTF-8 BOM, semicolon separator)
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
) {
  const BOM = "\uFEFF";
  const sep = ";";
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    // Wrap in quotes if contains sep, quotes, or newlines
    if (s.includes(sep) || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csv =
    BOM +
    headers.map(escape).join(sep) +
    "\n" +
    rows.map((row) => row.map(escape).join(sep)).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
