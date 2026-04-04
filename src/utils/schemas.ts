import { z } from 'zod';


export const roleSelectSchema = z.object({
  role: z.enum(['parent', 'teacher', 'admin', 'principal']),
  fullName: z.string()
    .min(2, 'Full name is required')
    .refine(
      (val) => val.trim().split(/\s+/).length >= 2,
      'Please enter both first and last name'
    ),
  preferredName: z.string().optional(),
  phone: z.string()
    .min(1, 'Phone number is required')
    .regex(/^\d{9,10}$/, 'Phone number must be 9 or 10 digits (without +61)'),
  address: z.string().min(5, 'Address is required'),
});

export const registerStudentStep1Schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  preferredName: z.string().optional(),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
});

export const registerStudentStep2Schema = z.object({
  hasAllergies: z.boolean(),
  allergyNotes: z.string().optional(),
  photoPublishConsent: z.boolean(),
});

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  preferredName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const announcementSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  body: z.string().min(10, 'Message body is required'),
  type: z.enum(['school', 'class', 'emergency', 'event_reminder']),
  targetClassId: z.string().optional(),
});

export const eventSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  eventType: z.enum(['poya', 'sermon', 'exam', 'holiday', 'special']),
  startDatetime: z.string().min(1, 'Start date/time is required'),
  endDatetime: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
});

export const classSchema = z.object({
  name: z.string().min(2, 'Class name is required'),
  gradeLevel: z.string().min(1, 'Grade level is required'),
  teacherId: z.string().optional(),
});
