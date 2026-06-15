import { parseCSV, parseCSVAsRecords, toCSV } from '../csv';

describe('parseCSV', () => {
  it('parses a simple grid', () => {
    expect(parseCSV('a,b,c\n1,2,3\n4,5,6')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
      ['4', '5', '6'],
    ]);
  });

  it('handles CRLF and LF endings interchangeably', () => {
    const csv = 'a,b\r\n1,2\n3,4\r\n5,6';
    expect(parseCSV(csv)).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
    ]);
  });

  it('keeps quoted fields with embedded commas intact', () => {
    expect(parseCSV('"Smith, J.",Anna,2020-01-01')).toEqual([
      ['Smith, J.', 'Anna', '2020-01-01'],
    ]);
  });

  it('un-escapes doubled "" inside quoted fields', () => {
    expect(parseCSV('"She said ""hi""","ok"')).toEqual([
      ['She said "hi"', 'ok'],
    ]);
  });

  it('preserves blank cells', () => {
    expect(parseCSV('a,,c\n,,')).toEqual([
      ['a', '', 'c'],
      ['', '', ''],
    ]);
  });

  it('drops a trailing completely-empty line but keeps blank-cell rows', () => {
    expect(parseCSV('a,b\n1,2\n\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('returns [] for empty input', () => {
    expect(parseCSV('')).toEqual([]);
  });
});

describe('parseCSVAsRecords', () => {
  it('normalises header to snake_case lowercase', () => {
    const out = parseCSVAsRecords('First Name,Last Name\nAnna,Perera');
    expect(out).toEqual([{ first_name: 'Anna', last_name: 'Perera' }]);
  });

  it('trims cell whitespace', () => {
    const out = parseCSVAsRecords('first_name,last_name\n  Anna  ,  Perera ');
    expect(out).toEqual([{ first_name: 'Anna', last_name: 'Perera' }]);
  });

  it('fills missing trailing cells with empty string', () => {
    const out = parseCSVAsRecords('first_name,last_name,address\nAnna,Perera');
    expect(out).toEqual([{ first_name: 'Anna', last_name: 'Perera', address: '' }]);
  });

  it('returns [] when only a header is present', () => {
    expect(parseCSVAsRecords('first_name,last_name')).toEqual([]);
  });
});

describe('toCSV', () => {
  it('round-trips simple values', () => {
    const rows = [
      ['first_name', 'last_name'],
      ['Anna', 'Perera'],
    ];
    expect(parseCSV(toCSV(rows))).toEqual(rows);
  });

  it('quotes and escapes cells that contain commas, quotes or newlines', () => {
    const csv = toCSV([['a,b', 'c"d', 'e\nf']]);
    expect(csv).toBe('"a,b","c""d","e\nf"');
    expect(parseCSV(csv)).toEqual([['a,b', 'c"d', 'e\nf']]);
  });
});
