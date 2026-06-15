import { BulkStudentRow } from '@/hooks/useBulkStudents';

export interface ParsedRow {
  row: BulkStudentRow | null;
  errors: string[];
  lineNumber: number;
  rawNameForDisplay: string;
}

export function parseBool(v: string): boolean {
  return /^(true|yes|y|1)$/i.test((v ?? '').trim());
}

export function isValidEmail(s: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
}

export function isValidDob(s: string): boolean {
  // Strict YYYY-MM-DD AND a real calendar date (no Feb 30 etc).
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return false;
  // Detects round-tripping through Date: rejects "2018-02-30" (becomes Mar 2)
  return d.toISOString().slice(0, 10) === s;
}

/**
 * Validate one CSV record against the school's known classes.
 * Returns either a fully-typed BulkStudentRow + empty errors, or null + errors.
 *
 * Multi-value parent fields can be separated by `;` or `,`. Parent name/phone
 * arrays align with the email array by index; missing trailing values are OK.
 */
export function validateRecord(
  rec: Record<string, string>,
  classByName: Map<string, string>,
  lineNumber: number,
): ParsedRow {
  const errors: string[] = [];
  const display = `${rec.first_name ?? ''} ${rec.last_name ?? ''}`.trim() || `(row ${lineNumber})`;

  const firstName = rec.first_name?.trim() ?? '';
  const lastName = rec.last_name?.trim() ?? '';
  if (!firstName) errors.push('first_name required');
  if (!lastName) errors.push('last_name required');

  const dob = rec.dob?.trim() ?? '';
  if (!dob) errors.push('dob required');
  else if (!isValidDob(dob)) errors.push('dob must be YYYY-MM-DD');

  const genderRaw = rec.gender?.trim().toLowerCase() ?? '';
  if (!['male', 'female', 'other'].includes(genderRaw)) {
    errors.push("gender must be 'male', 'female' or 'other'");
  }

  const className = rec.class_name?.trim() ?? '';
  const classId = classByName.get(className.toLowerCase());
  if (!className) errors.push('class_name required');
  else if (!classId) errors.push(`class '${className}' not found`);

  const emails = (rec.parent_emails ?? '').split(/[;,]/).map((s) => s.trim()).filter(Boolean);
  if (!emails.length) errors.push('at least one parent email required');
  const names = (rec.parent_names ?? '').split(/[;,]/).map((s) => s.trim());
  const phones = (rec.parent_phones ?? '').split(/[;,]/).map((s) => s.trim());
  const badEmails = emails.filter((e) => !isValidEmail(e));
  if (badEmails.length) errors.push(`invalid email(s): ${badEmails.join(', ')}`);

  if (errors.length) {
    return { row: null, errors, lineNumber, rawNameForDisplay: display };
  }

  return {
    row: {
      lineNumber,
      firstName,
      lastName,
      preferredName: rec.preferred_name?.trim() || undefined,
      dob,
      gender: genderRaw as 'male' | 'female' | 'other',
      address: rec.address?.trim() || undefined,
      classId: classId!,
      hasAllergies: parseBool(rec.has_allergies ?? ''),
      allergyNotes: rec.allergy_notes?.trim() || undefined,
      photoPublishConsent: parseBool(rec.photo_publish_consent ?? ''),
      parents: emails.map((email, i) => ({
        email,
        name: names[i] || undefined,
        phone: phones[i] || undefined,
      })),
    },
    errors: [],
    lineNumber,
    rawNameForDisplay: display,
  };
}
