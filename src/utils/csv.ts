/**
 * Minimal RFC-4180 CSV reader. Sufficient for spreadsheets pasted from Excel /
 * Google Sheets: supports quoted fields, doubled "" escapes inside quotes,
 * CRLF or LF line endings, and trailing empty rows.
 *
 * Returns rows of raw string cells. The caller is responsible for header
 * parsing and field-level validation.
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\r' || c === '\n') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Splits a header-and-body CSV into a list of objects keyed by the header
 * cells. Header cells are normalised to lowercase and snake_case so
 * "First Name" and "first_name" both match.
 */
export function parseCSVAsRecords(text: string): Record<string, string>[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    header.forEach((key, i) => { obj[key] = (cells[i] ?? '').trim(); });
    return obj;
  });
}

/** Encode a 2-D string array as CSV. Used to write the template file. */
export function toCSV(rows: string[][]): string {
  return rows.map((r) =>
    r.map((cell) => {
      const s = cell ?? '';
      if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    }).join(',')
  ).join('\n');
}
