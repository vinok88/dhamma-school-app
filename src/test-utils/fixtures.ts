// Reusable fixture builders for screen tests. Override only what each test needs.

import type { UserModel, StudentModel } from '@/types';

export const adminProfile: UserModel = {
  id: 'admin-1',
  schoolId: 'school-1',
  fullName: 'Admin User',
  preferredName: 'Admin',
  phone: '+61400000000',
  address: '1 Test St',
  role: 'admin',
  status: 'active',
  profilePhotoUrl: undefined,
  fcmToken: undefined,
  email: 'admin@test.local',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
} as UserModel;

export const parentProfile: UserModel = {
  ...adminProfile,
  id: 'parent-1',
  fullName: 'Parent User',
  role: 'parent',
  email: 'parent@test.local',
} as UserModel;

export const teacherProfile: UserModel = {
  ...adminProfile,
  id: 'teacher-1',
  fullName: 'Teacher User',
  role: 'teacher',
  email: 'teacher@test.local',
} as UserModel;

export const principalProfile: UserModel = {
  ...adminProfile,
  id: 'principal-1',
  fullName: 'Principal User',
  role: 'principal' as any,
  email: 'principal@test.local',
} as UserModel;

export function makeStudent(overrides: Partial<StudentModel> = {}): StudentModel {
  return {
    id: 'stu-1',
    schoolId: 'school-1',
    firstName: 'Anna',
    lastName: 'Perera',
    preferredName: undefined,
    dob: '2018-04-01',
    gender: 'F',
    hasAllergies: false,
    allergyNotes: undefined,
    photoUrl: undefined,
    photoPublishConsent: true,
    address: '1 Test St',
    classId: 'class-1',
    className: 'Year 2',
    classTeachers: [],
    status: 'active',
    statusNote: undefined,
    parents: [
      {
        id: 'sp-1',
        studentId: 'stu-1',
        parentEmail: 'parent@test.local',
        parentName: 'Parent User',
        parentPhone: '+61400000000',
        parentUserId: 'parent-1',
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

/** Default async-query result shape. */
export function queryOk<T>(data: T) {
  return {
    data,
    isLoading: false,
    isFetching: false,
    isSuccess: true,
    isError: false,
    error: null,
    refetch: jest.fn(),
  };
}

export function queryLoading() {
  return {
    data: undefined,
    isLoading: true,
    isFetching: true,
    isSuccess: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  };
}

/** Default mutation result shape. */
export function mutationStub() {
  return {
    mutate: jest.fn(),
    mutateAsync: jest.fn(async () => undefined),
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    reset: jest.fn(),
  };
}
