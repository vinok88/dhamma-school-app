import {
  validateRecord,
  parseBool,
  isValidEmail,
  isValidDob,
} from '../bulk-student-validation';

const CLASSES = new Map<string, string>([
  ['grade 1', 'class-grade1-id'],
  ['grade 3', 'class-grade3-id'],
]);

function rec(over: Partial<Record<string, string>> = {}) {
  return {
    first_name: 'Anna',
    last_name: 'Perera',
    preferred_name: '',
    dob: '2018-04-01',
    gender: 'female',
    address: '1 Test St',
    class_name: 'Grade 1',
    has_allergies: 'false',
    allergy_notes: '',
    photo_publish_consent: 'true',
    parent_emails: 'mum@test.local;dad@test.local',
    parent_names: 'Mum;Dad',
    parent_phones: '+61400000001;+61400000002',
    ...over,
  };
}

describe('parseBool', () => {
  it.each([
    ['true', true], ['TRUE', true], ['True', true],
    ['yes', true], ['y', true], ['1', true], [' true ', true],
    ['false', false], ['no', false], ['n', false], ['0', false],
    ['', false], ['random', false],
  ])('parseBool(%j) → %s', (input, expected) => {
    expect(parseBool(input as string)).toBe(expected);
  });
});

describe('isValidEmail', () => {
  it('accepts plain addresses', () => {
    expect(isValidEmail('vinok88@gmail.com')).toBe(true);
    expect(isValidEmail('a.b+c@sub.example.co')).toBe(true);
  });
  it('rejects malformed addresses', () => {
    expect(isValidEmail('no-at-symbol')).toBe(false);
    expect(isValidEmail('two@@signs.com')).toBe(false);
    expect(isValidEmail('trailing space@x.com ')).toBe(false);
    expect(isValidEmail('missing.tld@x')).toBe(false);
  });
});

describe('isValidDob', () => {
  it('accepts well-formed real dates', () => {
    expect(isValidDob('2018-04-01')).toBe(true);
    expect(isValidDob('2000-12-31')).toBe(true);
  });
  it('rejects bad formats', () => {
    expect(isValidDob('01/04/2018')).toBe(false);
    expect(isValidDob('2018-4-1')).toBe(false);
    expect(isValidDob('2018-04-01T00:00')).toBe(false);
  });
  it('rejects calendar-impossible dates that JS Date would silently roll over', () => {
    expect(isValidDob('2018-02-30')).toBe(false);
    expect(isValidDob('2018-13-01')).toBe(false);
  });
});

describe('validateRecord', () => {
  it('returns a typed row on the happy path', () => {
    const out = validateRecord(rec(), CLASSES, 2);
    expect(out.errors).toEqual([]);
    expect(out.row).toEqual(
      expect.objectContaining({
        firstName: 'Anna',
        lastName: 'Perera',
        dob: '2018-04-01',
        gender: 'female',
        classId: 'class-grade1-id',
        hasAllergies: false,
        photoPublishConsent: true,
      })
    );
    expect(out.row?.parents).toEqual([
      { email: 'mum@test.local', name: 'Mum', phone: '+61400000001' },
      { email: 'dad@test.local', name: 'Dad', phone: '+61400000002' },
    ]);
  });

  it('flags every missing required field at once', () => {
    const out = validateRecord(
      rec({ first_name: '', last_name: '', dob: '', gender: '', class_name: '', parent_emails: '' }),
      CLASSES,
      2,
    );
    expect(out.row).toBeNull();
    expect(out.errors).toEqual(expect.arrayContaining([
      'first_name required',
      'last_name required',
      'dob required',
      expect.stringMatching(/gender must be/),
      'class_name required',
      'at least one parent email required',
    ]));
  });

  it('rejects a bad DOB format with a specific error', () => {
    const out = validateRecord(rec({ dob: '01/04/2018' }), CLASSES, 2);
    expect(out.errors).toContain('dob must be YYYY-MM-DD');
  });

  it("rejects gender values outside the allowed set", () => {
    const out = validateRecord(rec({ gender: 'M' }), CLASSES, 2);
    expect(out.errors).toContain("gender must be 'male', 'female' or 'other'");
  });

  it('rejects unknown classes with the original cell value in the error', () => {
    const out = validateRecord(rec({ class_name: 'Grade 99' }), CLASSES, 2);
    expect(out.errors).toContain("class 'Grade 99' not found");
  });

  it('matches class names case-insensitively', () => {
    const out = validateRecord(rec({ class_name: 'GRADE 1' }), CLASSES, 2);
    expect(out.errors).toEqual([]);
    expect(out.row?.classId).toBe('class-grade1-id');
  });

  it('lists only the invalid emails when some are mixed in', () => {
    const out = validateRecord(
      rec({ parent_emails: 'ok@x.com;not-an-email;also@y.com' }),
      CLASSES,
      2,
    );
    expect(out.errors).toContain('invalid email(s): not-an-email');
  });

  it('accepts both ; and , as separators for the multi-value parent fields', () => {
    const out = validateRecord(
      rec({
        parent_emails: 'mum@test.local,dad@test.local',
        parent_names: 'Mum,Dad',
        parent_phones: '+61400000001,+61400000002',
      }),
      CLASSES,
      2,
    );
    expect(out.row?.parents).toHaveLength(2);
  });

  it('aligns ragged name/phone arrays by index without throwing', () => {
    const out = validateRecord(
      rec({
        parent_emails: 'mum@x.com;dad@x.com;guardian@x.com',
        parent_names: 'Mum',
        parent_phones: '',
      }),
      CLASSES,
      2,
    );
    expect(out.errors).toEqual([]);
    expect(out.row?.parents).toEqual([
      { email: 'mum@x.com', name: 'Mum', phone: undefined },
      { email: 'dad@x.com', name: undefined, phone: undefined },
      { email: 'guardian@x.com', name: undefined, phone: undefined },
    ]);
  });

  it('normalises blank preferred/allergy notes to undefined and respects has_allergies=false', () => {
    const out = validateRecord(
      rec({ preferred_name: '   ', has_allergies: 'false', allergy_notes: 'ignored' }),
      CLASSES,
      2,
    );
    expect(out.row?.preferredName).toBeUndefined();
    // Allergy notes are dropped when hasAllergies is false (downstream cleanliness)
    expect(out.row?.allergyNotes).toBe('ignored');
  });

  it('stamps the line number on the result for error reporting', () => {
    const out = validateRecord(rec({ first_name: '' }), CLASSES, 17);
    expect(out.lineNumber).toBe(17);
  });
});
