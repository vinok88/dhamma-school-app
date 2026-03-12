import '../models/announcement_model.dart';
import '../models/attendance_model.dart';
import '../models/class_model.dart';
import '../models/event_model.dart';
import '../models/student_model.dart';
import '../models/user_model.dart';

final _now = DateTime.now();
final _today = DateTime(_now.year, _now.month, _now.day);

// ── Users ──────────────────────────────────────────────────────────────────

final mockParent = UserModel(
  id: 'parent-001',
  schoolId: 'school-001',
  fullName: 'Nimali Perera',
  preferredName: 'Nimali',
  phone: '+61 412 345 678',
  address: '14 Lotus Lane, Southbank VIC 3006',
  role: UserRole.parent,
  status: UserStatus.active,
  email: 'nimali.perera@email.com',
  createdAt: _now.subtract(const Duration(days: 120)),
  updatedAt: _now,
);

final mockTeacher = UserModel(
  id: 'teacher-001',
  schoolId: 'school-001',
  fullName: 'Ruwan Bandara',
  preferredName: 'Ruwan',
  phone: '+61 423 456 789',
  address: '8 Bodhi Street, Richmond VIC 3121',
  role: UserRole.teacher,
  status: UserStatus.active,
  email: 'ruwan.bandara@email.com',
  createdAt: _now.subtract(const Duration(days: 200)),
  updatedAt: _now,
);

final mockAdmin = UserModel(
  id: 'admin-001',
  schoolId: 'school-001',
  fullName: 'Ven. Nyanasara Thero',
  preferredName: 'Nyanasara Thero',
  phone: '+61 3 9000 1234',
  address: 'Mahamevnawa Monastery, Southbank VIC 3006',
  role: UserRole.admin,
  status: UserStatus.active,
  email: 'admin@mahamevnawa.org.au',
  createdAt: _now.subtract(const Duration(days: 365)),
  updatedAt: _now,
);

// ── Classes ────────────────────────────────────────────────────────────────

final mockClasses = [
  ClassModel(
    id: 'class-001',
    schoolId: 'school-001',
    name: 'Little Buds',
    gradeLevel: 'Ages 4–6',
    teacherId: 'teacher-001',
    teacherName: 'Ruwan Bandara',
    studentCount: 8,
    createdAt: _now.subtract(const Duration(days: 300)),
  ),
  ClassModel(
    id: 'class-002',
    schoolId: 'school-001',
    name: 'Seedlings',
    gradeLevel: 'Ages 7–9',
    teacherId: 'teacher-002',
    teacherName: 'Dilini Fernando',
    studentCount: 12,
    createdAt: _now.subtract(const Duration(days: 300)),
  ),
  ClassModel(
    id: 'class-003',
    schoolId: 'school-001',
    name: 'Blossoms',
    gradeLevel: 'Ages 10–12',
    teacherId: 'teacher-003',
    teacherName: 'Kasun Jayawardena',
    studentCount: 15,
    createdAt: _now.subtract(const Duration(days: 300)),
  ),
  ClassModel(
    id: 'class-004',
    schoolId: 'school-001',
    name: 'Juniors',
    gradeLevel: 'Ages 13–15',
    teacherId: 'teacher-004',
    teacherName: 'Chamari Silva',
    studentCount: 11,
    createdAt: _now.subtract(const Duration(days: 300)),
  ),
  ClassModel(
    id: 'class-005',
    schoolId: 'school-001',
    name: 'Seniors',
    gradeLevel: 'Ages 16+',
    teacherId: 'teacher-005',
    teacherName: 'Priya Wijesinghe',
    studentCount: 9,
    createdAt: _now.subtract(const Duration(days: 300)),
  ),
];

// ── Students ───────────────────────────────────────────────────────────────

StudentModel _student(
  String id,
  String first,
  String last,
  int ageYears,
  String classId,
  StudentStatus status, {
  bool hasAllergies = false,
  String? allergyNotes,
  String? statusNote,
}) =>
    StudentModel(
      id: id,
      schoolId: 'school-001',
      firstName: first,
      lastName: last,
      dob: DateTime(_now.year - ageYears, 6, 15),
      hasAllergies: hasAllergies,
      allergyNotes: allergyNotes,
      photoPublishConsent: true,
      parentId: 'parent-001',
      classId: classId,
      className: mockClasses.firstWhere((c) => c.id == classId).name,
      status: status,
      statusNote: statusNote,
      parentName: 'Nimali Perera',
      parentPhone: '+61 412 345 678',
      parentAddress: '14 Lotus Lane, Southbank VIC 3006',
      createdAt: _now.subtract(const Duration(days: 90)),
      updatedAt: _now,
    );

// Parent's children
final mockMyStudents = [
  _student('stu-001', 'Kavindu', 'Perera', 9, 'class-002', StudentStatus.active),
  _student('stu-002', 'Sanduni', 'Perera', 7, 'class-002', StudentStatus.pending),
];

// Teacher's class roster (Seedlings)
final mockClassStudents = [
  _student('stu-003', 'Ashan', 'Fernando', 8, 'class-002', StudentStatus.active),
  _student('stu-004', 'Binara', 'Jayawardena', 9, 'class-002', StudentStatus.active),
  _student('stu-005', 'Chamodi', 'Silva', 7, 'class-002', StudentStatus.active,
      hasAllergies: true, allergyNotes: 'Nut allergy'),
  _student('stu-006', 'Dewmi', 'Wijesinghe', 8, 'class-002', StudentStatus.active),
  _student('stu-007', 'Ehan', 'Bandara', 9, 'class-002', StudentStatus.active),
  _student('stu-008', 'Fathima', 'Rasheed', 8, 'class-002', StudentStatus.active),
  _student('stu-009', 'Gehan', 'Dissanayake', 7, 'class-002', StudentStatus.active),
  _student('stu-010', 'Himari', 'Kumara', 9, 'class-002', StudentStatus.active),
  _student('stu-011', 'Isuri', 'Madushani', 8, 'class-002', StudentStatus.active),
  _student('stu-012', 'Janidu', 'Rajapaksa', 9, 'class-002', StudentStatus.active),
  _student('stu-013', 'Kaveesha', 'Senanayake', 7, 'class-002', StudentStatus.active),
  _student('stu-001', 'Kavindu', 'Perera', 9, 'class-002', StudentStatus.active),
];

// Admin — all students across school
final mockAllStudents = [
  _student('stu-003', 'Ashan', 'Fernando', 8, 'class-002', StudentStatus.active),
  _student('stu-004', 'Binara', 'Jayawardena', 9, 'class-003', StudentStatus.active),
  _student('stu-001', 'Kavindu', 'Perera', 9, 'class-002', StudentStatus.active),
  _student('stu-002', 'Sanduni', 'Perera', 7, 'class-001', StudentStatus.pending),
  _student('stu-014', 'Lasith', 'Malinga', 12, 'class-003', StudentStatus.active),
  _student('stu-015', 'Malsha', 'Gunasekara', 11, 'class-003', StudentStatus.active),
  _student('stu-016', 'Naveen', 'Rathnayake', 14, 'class-004', StudentStatus.active),
  _student('stu-017', 'Oneli', 'Herath', 13, 'class-004', StudentStatus.active),
  _student('stu-018', 'Pramod', 'Jayasekara', 16, 'class-005', StudentStatus.active),
  _student('stu-019', 'Qirra', 'Abeysekara', 5, 'class-001', StudentStatus.active),
  _student('stu-020', 'Randika', 'Wickramasinghe', 10, 'class-003', StudentStatus.underReview),
];

// Pending registrations for admin approval
final mockPendingStudents = [
  _student('stu-021', 'Sachini', 'Perera', 6, 'class-001', StudentStatus.pending),
  _student('stu-022', 'Tharaka', 'Silva', 10, 'class-003', StudentStatus.pending),
  _student('stu-023', 'Udara', 'Fernando', 14, 'class-004', StudentStatus.underReview),
];

// ── Attendance ─────────────────────────────────────────────────────────────

AttendanceModel _att(
  String studentId,
  String first,
  String last,
  AttendanceStatus status,
) =>
    AttendanceModel(
      id: 'att-$studentId',
      schoolId: 'school-001',
      studentId: studentId,
      teacherId: 'teacher-001',
      classId: 'class-002',
      sessionDate: _today,
      checkinTime: status != AttendanceStatus.absent
          ? _today.add(const Duration(hours: 9, minutes: 5))
          : null,
      checkoutTime: status == AttendanceStatus.checkedOut
          ? _today.add(const Duration(hours: 12))
          : null,
      status: status,
      createdAt: _today,
      studentFirstName: first,
      studentLastName: last,
    );

final mockAttendance = [
  _att('stu-003', 'Ashan', 'Fernando', AttendanceStatus.checkedIn),
  _att('stu-004', 'Binara', 'Jayawardena', AttendanceStatus.checkedOut),
  _att('stu-005', 'Chamodi', 'Silva', AttendanceStatus.checkedIn),
  _att('stu-006', 'Dewmi', 'Wijesinghe', AttendanceStatus.absent),
  _att('stu-007', 'Ehan', 'Bandara', AttendanceStatus.checkedIn),
  _att('stu-008', 'Fathima', 'Rasheed', AttendanceStatus.absent),
  _att('stu-009', 'Gehan', 'Dissanayake', AttendanceStatus.checkedIn),
  _att('stu-010', 'Himari', 'Kumara', AttendanceStatus.checkedOut),
  _att('stu-011', 'Isuri', 'Madushani', AttendanceStatus.checkedIn),
  _att('stu-012', 'Janidu', 'Rajapaksa', AttendanceStatus.absent),
  _att('stu-013', 'Kaveesha', 'Senanayake', AttendanceStatus.checkedIn),
  _att('stu-001', 'Kavindu', 'Perera', AttendanceStatus.checkedOut),
];

// ── Announcements ──────────────────────────────────────────────────────────

final mockAnnouncements = [
  AnnouncementModel(
    id: 'ann-001',
    schoolId: 'school-001',
    authorId: 'admin-001',
    authorName: 'Ven. Nyanasara Thero',
    title: 'Vesak Celebration – Sunday 11 May',
    body:
        'We are delighted to invite all students, parents and teachers to our annual Vesak Lantern Festival. '
        'Please bring a home-made lantern. Refreshments will be provided. The ceremony begins at 6:00 PM.',
    type: AnnouncementType.school,
    publishedAt: _now.subtract(const Duration(days: 2)),
    createdAt: _now.subtract(const Duration(days: 2)),
  ),
  AnnouncementModel(
    id: 'ann-002',
    schoolId: 'school-001',
    authorId: 'teacher-001',
    authorName: 'Ruwan Bandara',
    title: 'Seedlings — Dhamma Story Competition',
    body:
        'Dear parents, our class will be holding a Dhamma story recitation competition next Sunday. '
        'Please encourage your child to practise the story of Prince Siddhartha. '
        'Duration: 2–3 minutes. Prizes will be awarded.',
    type: AnnouncementType.clazz,
    targetClassId: 'class-002',
    publishedAt: _now.subtract(const Duration(days: 1)),
    createdAt: _now.subtract(const Duration(days: 1)),
  ),
  AnnouncementModel(
    id: 'ann-003',
    schoolId: 'school-001',
    authorId: 'admin-001',
    authorName: 'Ven. Nyanasara Thero',
    title: '⚠️ Session Cancelled – 16 March (Public Holiday)',
    body:
        'Please note that the Dhamma School session scheduled for Sunday 16 March is cancelled '
        'due to the Labour Day public holiday. Classes resume on 23 March. '
        'May you all have a peaceful and mindful holiday.',
    type: AnnouncementType.emergency,
    publishedAt: _now.subtract(const Duration(hours: 3)),
    createdAt: _now.subtract(const Duration(hours: 3)),
  ),
  AnnouncementModel(
    id: 'ann-004',
    schoolId: 'school-001',
    authorId: 'admin-001',
    authorName: 'Ven. Nyanasara Thero',
    title: 'Annual Dhamma Exam – Registration Open',
    body:
        'The annual Dhamma examination will be held on 20 April. '
        'Students in Blossoms, Juniors, and Seniors grades are eligible. '
        'Please register with your class teacher by 30 March.',
    type: AnnouncementType.eventReminder,
    publishedAt: _now.subtract(const Duration(days: 5)),
    createdAt: _now.subtract(const Duration(days: 5)),
  ),
];

// ── Events ─────────────────────────────────────────────────────────────────

final mockEvents = [
  EventModel(
    id: 'evt-001',
    schoolId: 'school-001',
    title: 'Medin Poya Program',
    description:
        'Monthly Poya day program with meditation, Dhamma discussions and Pindapatha Dane. '
        'All families are warmly invited.',
    eventType: EventType.poya,
    startDatetime: DateTime(_now.year, _now.month, 13, 8, 0),
    endDatetime: DateTime(_now.year, _now.month, 13, 13, 0),
    location: 'Mahamevnawa Monastery, Southbank',
    createdBy: 'admin-001',
    createdAt: _now.subtract(const Duration(days: 20)),
  ),
  EventModel(
    id: 'evt-002',
    schoolId: 'school-001',
    title: 'Vesak Lantern Festival',
    description:
        'Annual Vesak celebration with lanterns, Bodhi Puja and cultural performances by students.',
    eventType: EventType.special,
    startDatetime: DateTime(_now.year, 5, 11, 18, 0),
    endDatetime: DateTime(_now.year, 5, 11, 21, 0),
    location: 'Mahamevnawa Monastery, Southbank',
    createdBy: 'admin-001',
    createdAt: _now.subtract(const Duration(days: 30)),
  ),
  EventModel(
    id: 'evt-003',
    schoolId: 'school-001',
    title: 'Annual Dhamma Examination',
    description:
        'Written and oral Dhamma exam for Blossoms, Juniors and Seniors grades. '
        'Certificates awarded at the end-of-year concert.',
    eventType: EventType.exam,
    startDatetime: DateTime(_now.year, 4, 20, 9, 0),
    endDatetime: DateTime(_now.year, 4, 20, 12, 0),
    location: 'Main Hall, Mahamevnawa Monastery',
    createdBy: 'admin-001',
    createdAt: _now.subtract(const Duration(days: 15)),
  ),
  EventModel(
    id: 'evt-004',
    schoolId: 'school-001',
    title: 'Labour Day – No Classes',
    description: 'Dhamma School is closed for the Labour Day public holiday.',
    eventType: EventType.holiday,
    startDatetime: DateTime(_now.year, 3, 16, 0, 0),
    endDatetime: DateTime(_now.year, 3, 16, 23, 59),
    location: null,
    createdBy: 'admin-001',
    createdAt: _now.subtract(const Duration(days: 10)),
  ),
  EventModel(
    id: 'evt-005',
    schoolId: 'school-001',
    title: 'Special Sermon – Ven. Bhikkhu Analayo',
    description:
        'Guest Dhamma talk by Ven. Bhikkhu Analayo on Mindfulness in Daily Life. '
        'Open to all students age 12 and above, and parents.',
    eventType: EventType.sermon,
    startDatetime: DateTime(_now.year, _now.month + 1, 6, 10, 0),
    endDatetime: DateTime(_now.year, _now.month + 1, 6, 12, 0),
    location: 'Main Hall, Mahamevnawa Monastery',
    createdBy: 'admin-001',
    createdAt: _now.subtract(const Duration(days: 5)),
  ),
];

// ── Admin dashboard stats ──────────────────────────────────────────────────

const adminStats = {
  'totalStudents': 55,
  'totalTeachers': 8,
  'pendingRegistrations': 3,
  'attendanceRateToday': 82,
};

// Attendance % for last 8 Sundays (most recent last)
const weeklyAttendance = [74.0, 81.0, 68.0, 85.0, 79.0, 88.0, 76.0, 82.0];
