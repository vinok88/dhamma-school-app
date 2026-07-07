import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, Linking, ScrollView,
  TextInput, Switch, Alert,
} from 'react-native';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { COLORS } from '@/constants';
import { UserModel, StudentModel, StudentStatus } from '@/types';
import { formatDate, formatAge } from '@/utils/date';
import { useAuth } from '@/hooks/useAuth';
import { useClasses } from '@/hooks/useClasses';
import { useAdminUpdateStudent, useApproveStudent, useRejectStudent } from '@/hooks/useStudents';
import { showFriendlyError } from '@/utils/errors';

interface UserDetailModalProps {
  visible: boolean;
  onClose: () => void;
  user?: UserModel | null;
  student?: StudentModel | null;
  /** Signed photo URL for student (since student.photoUrl needs signing) */
  studentPhotoUrl?: string | null;
  /** When true and a student is shown, an admin/principal can edit any field. */
  editable?: boolean;
}

const ROLE_STYLES: Record<string, { color: string; bg: string }> = {
  admin: { color: COLORS.error, bg: '#FEE2E2' },
  principal: { color: COLORS.gold, bg: '#FEF3C7' },
  teacher: { color: COLORS.navy, bg: '#DBEAFE' },
  parent: { color: COLORS.primary, bg: '#FEE2E2' },
};

function DetailRow({ label, value, onPress }: { label: string; value?: string | null; onPress?: () => void }) {
  if (!value) return null;
  return (
    <TouchableOpacity
      disabled={!onPress}
      onPress={onPress}
      className="flex-row py-3 border-b border-gray-100"
    >
      <Text className="text-xs text-text-muted w-24">{label}</Text>
      <Text
        className="flex-1 text-sm text-text-primary"
        style={onPress ? { color: COLORS.navy, textDecorationLine: 'underline' } : {}}
      >
        {value}
      </Text>
    </TouchableOpacity>
  );
}

function EditRow({
  label, value, onChangeText, placeholder, keyboardType, autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
}) {
  return (
    <View className="py-2 border-b border-gray-100">
      <Text className="text-xs text-text-muted mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        className="text-sm text-text-primary bg-gray-50 rounded-lg px-3 py-2"
      />
    </View>
  );
}

type StudentDraft = {
  firstName: string;
  lastName: string;
  preferredName: string;
  dob: string;
  gender: string;
  address: string;
  classId: string;
  status: StudentStatus;
  hasAllergies: boolean;
  allergyNotes: string;
  photoPublishConsent: boolean;
  parents: { id?: string; email: string; name: string; phone: string }[];
};

function studentToDraft(s: StudentModel): StudentDraft {
  return {
    firstName: s.firstName,
    lastName: s.lastName,
    preferredName: s.preferredName ?? '',
    dob: s.dob,
    gender: s.gender,
    address: s.address ?? '',
    classId: s.classId ?? '',
    status: s.status,
    hasAllergies: s.hasAllergies,
    allergyNotes: s.allergyNotes ?? '',
    photoPublishConsent: s.photoPublishConsent,
    parents: s.parents.map((p) => ({
      id: p.id,
      email: p.parentEmail,
      name: p.parentName ?? '',
      phone: p.parentPhone ?? '',
    })),
  };
}

function isDraftEqual(a: StudentDraft, b: StudentDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function UserDetailModal({ visible, onClose, user, student, studentPhotoUrl, editable }: UserDetailModalProps) {
  if (!user && !student) return null;

  const { profile } = useAuth();
  const canEdit = !!(editable && student && (profile?.role === 'admin' || profile?.role === 'principal'));

  const isStudent = !!student;
  const name = isStudent ? `${student!.firstName} ${student!.lastName}` : user!.fullName;
  const photoUri = isStudent ? (studentPhotoUrl ?? undefined) : user!.profilePhotoUrl;
  const role = isStudent ? undefined : user!.role;
  const rc = role ? (ROLE_STYLES[role] ?? ROLE_STYLES.parent) : undefined;

  const { data: classes } = useClasses(student?.schoolId ?? '');
  const adminUpdate = useAdminUpdateStudent();
  const approveStudent = useApproveStudent();
  const rejectStudent = useRejectStudent();

  const isPending = !!(student && student.status === 'pending');

  const [editMode, setEditMode] = useState(false);
  const initial = useMemo(() => (student ? studentToDraft(student) : null), [student?.id, student?.updatedAt]);
  const [draft, setDraft] = useState<StudentDraft | null>(initial);

  // Approval panel (pending students): chosen class + reject reason.
  const [approveClassId, setApproveClassId] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Reset draft + approval state whenever the underlying student changes or modal closes.
  useEffect(() => {
    setDraft(initial);
    setEditMode(false);
    setApproveClassId('');
    setShowReject(false);
    setRejectReason('');
  }, [initial?.firstName, initial?.lastName, initial?.dob, student?.id, visible]);

  async function handleApprove() {
    if (!student) return;
    if (!approveClassId) {
      Alert.alert('Class required', 'Select a class to assign before approving.');
      return;
    }
    try {
      // RPC assigns the class, activates the student, and notifies the parents.
      await approveStudent.mutateAsync({ studentId: student.id, classId: approveClassId });
      Alert.alert('Approved', `${student.firstName} has been approved and the parents notified.`);
      onClose();
    } catch (e: unknown) {
      showFriendlyError("Couldn't approve student", e, 'student-approve');
    }
  }

  async function handleReject() {
    if (!student) return;
    if (!rejectReason.trim()) {
      Alert.alert('Reason required', 'Add a short reason so the parent knows why.');
      return;
    }
    try {
      await rejectStudent.mutateAsync({ studentId: student.id, reason: rejectReason.trim() });
      Alert.alert('Rejected', 'The registration has been rejected and the parents notified.');
      onClose();
    } catch (e: unknown) {
      showFriendlyError("Couldn't reject student", e, 'student-reject');
    }
  }

  const dirty = !!(draft && initial && !isDraftEqual(draft, initial));

  function dialPhone(phone: string) {
    Linking.openURL(`tel:${phone}`);
  }

  function setField<K extends keyof StudentDraft>(key: K, val: StudentDraft[K]) {
    setDraft((d) => (d ? { ...d, [key]: val } : d));
  }

  function setParentField(idx: number, key: 'email' | 'name' | 'phone', val: string) {
    setDraft((d) => {
      if (!d) return d;
      const next = [...d.parents];
      next[idx] = { ...next[idx], [key]: val };
      return { ...d, parents: next };
    });
  }
  function addParent() {
    setDraft((d) => (d ? { ...d, parents: [...d.parents, { email: '', name: '', phone: '' }] } : d));
  }
  function removeParent(idx: number) {
    setDraft((d) => (d ? { ...d, parents: d.parents.filter((_, i) => i !== idx) } : d));
  }

  async function handleSave() {
    if (!student || !draft) return;
    // Light validation
    if (!draft.firstName.trim() || !draft.lastName.trim() || !draft.dob.trim()) {
      Alert.alert('Required fields missing', 'First name, last name and DOB are required.');
      return;
    }
    // Active students must be assigned a class (enforced by a DB constraint).
    if (draft.status === 'active' && !draft.classId) {
      Alert.alert('Class required', 'Assign a class before setting this student to active.');
      return;
    }
    const cleanParents = draft.parents
      .map((p) => ({ ...p, email: p.email.trim() }))
      .filter((p) => p.email.length > 0);

    try {
      await adminUpdate.mutateAsync({
        studentId: student.id,
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        preferredName: draft.preferredName.trim() || null,
        dob: draft.dob.trim(),
        gender: draft.gender,
        address: draft.address.trim() || null,
        classId: draft.classId || undefined,
        status: draft.status,
        hasAllergies: draft.hasAllergies,
        allergyNotes: draft.hasAllergies ? (draft.allergyNotes.trim() || null) : null,
        photoPublishConsent: draft.photoPublishConsent,
        parents: cleanParents.map((p) => ({
          email: p.email,
          name: p.name.trim() || undefined,
          phone: p.phone.trim() || undefined,
        })),
      });
      setEditMode(false);
    } catch (e: unknown) {
      showFriendlyError("Couldn't save changes", e, 'student-detail-modal');
    }
  }

  function handleCancel() {
    setDraft(initial);
    setEditMode(false);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: '90%' }}>
            {/* Handle bar */}
            <View className="w-10 h-1 rounded-full bg-gray-300 self-center my-3" />

            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View className="items-center mb-4">
                <Avatar uri={photoUri} name={name} size={80} />
                <Text className="text-lg font-sans-semibold text-text-primary mt-3">{name}</Text>
                {rc && role && (
                  <View className="mt-1">
                    <Badge label={role} color={rc.color} bg={rc.bg} />
                  </View>
                )}
                {isStudent && !editMode && (
                  <View className="mt-1">
                    <Badge label="" type="student" status={student!.status} />
                  </View>
                )}
                {canEdit && !editMode && (
                  <TouchableOpacity
                    onPress={() => setEditMode(true)}
                    className="mt-3 px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <Text className="text-white text-xs font-sans-semibold">✏️  Edit</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* User details (view-only) */}
              {!isStudent && user && (
                <>
                  <DetailRow label="Email" value={user.email} />
                  <DetailRow
                    label="Phone"
                    value={user.phone}
                    onPress={user.phone ? () => dialPhone(user.phone!) : undefined}
                  />
                  <DetailRow label="Address" value={user.address} />
                  <DetailRow label="Status" value={user.status} />
                </>
              )}

              {/* Approval panel — pending students, principal/admin only */}
              {canEdit && isStudent && student && isPending && !editMode && (
                <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#FEF3C7' }}>
                  <Text className="font-sans-semibold mb-1" style={{ color: COLORS.brown }}>
                    Pending approval
                  </Text>
                  <Text className="text-xs mb-3" style={{ color: COLORS.brown }}>
                    Assign a class and approve, or reject with a reason for the parent.
                  </Text>

                  {(classes ?? []).length === 0 ? (
                    <Text className="text-xs mb-3" style={{ color: COLORS.error }}>
                      No classes exist yet — create one first, then approve.
                    </Text>
                  ) : (
                    <View className="flex-row flex-wrap gap-2 mb-3">
                      {(classes ?? []).map((c) => {
                        const active = approveClassId === c.id;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            onPress={() => setApproveClassId(c.id)}
                            className={`px-3 py-1.5 rounded-full ${active ? 'bg-primary' : 'bg-white'}`}
                          >
                            <Text className={`text-xs font-sans-semibold ${active ? 'text-white' : 'text-text-muted'}`}>
                              {c.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {!showReject ? (
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => setShowReject(true)}
                        className="flex-1 rounded-xl py-3 items-center bg-white"
                        style={{ borderWidth: 1, borderColor: COLORS.error }}
                      >
                        <Text className="text-sm font-sans-semibold" style={{ color: COLORS.error }}>
                          Reject
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleApprove}
                        disabled={approveStudent.isPending || !approveClassId}
                        className="flex-1 rounded-xl py-3 items-center"
                        style={{
                          backgroundColor: COLORS.success,
                          opacity: approveStudent.isPending || !approveClassId ? 0.5 : 1,
                        }}
                      >
                        <Text className="text-sm font-sans-semibold text-white">
                          {approveStudent.isPending ? 'Approving…' : 'Approve & Assign'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      <TextInput
                        value={rejectReason}
                        onChangeText={setRejectReason}
                        placeholder="Reason for rejection…"
                        multiline
                        className="text-sm text-text-primary bg-white rounded-lg px-3 py-2 mb-2"
                      />
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => { setShowReject(false); setRejectReason(''); }}
                          className="flex-1 rounded-xl py-3 items-center bg-white"
                        >
                          <Text className="text-sm font-sans-semibold text-text-muted">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleReject}
                          disabled={rejectStudent.isPending}
                          className="flex-1 rounded-xl py-3 items-center"
                          style={{ backgroundColor: COLORS.error, opacity: rejectStudent.isPending ? 0.7 : 1 }}
                        >
                          <Text className="text-sm font-sans-semibold text-white">
                            {rejectStudent.isPending ? 'Rejecting…' : 'Confirm Reject'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Student VIEW mode */}
              {isStudent && student && !editMode && (
                <>
                  <DetailRow label="Student ID" value={student.displayId ?? 'Assigned on approval'} />
                  {student.preferredName && (
                    <DetailRow label="Nickname" value={student.preferredName} />
                  )}
                  <DetailRow label="Date of Birth" value={`${formatDate(student.dob)} (${formatAge(student.dob)})`} />
                  <DetailRow label="Gender" value={student.gender} />
                  <DetailRow label="Class" value={student.className ?? 'Unassigned'} />
                  <DetailRow label="Status" value={student.status} />
                  <DetailRow
                    label="Allergies"
                    value={student.hasAllergies ? (student.allergyNotes ?? 'Yes (no details)') : 'None'}
                  />
                  <DetailRow
                    label="Photo Consent"
                    value={student.photoPublishConsent ? 'Approved' : 'Not approved'}
                  />
                  <DetailRow label="Address" value={student.address} />

                  <View className="mt-3 mb-1">
                    <Text className="text-xs font-sans-semibold" style={{ color: COLORS.navy }}>
                      Parents ({student.parents.length})
                    </Text>
                  </View>
                  {student.parents.length === 0 ? (
                    <DetailRow label="—" value="No parent linked" />
                  ) : (
                    student.parents.map((p, i) => (
                      <View key={p.id} className={i > 0 ? 'mt-2 pt-2 border-t border-gray-100' : ''}>
                        <DetailRow label="Name" value={p.parentName} />
                        <DetailRow
                          label="Phone"
                          value={p.parentPhone}
                          onPress={p.parentPhone ? () => dialPhone(p.parentPhone!) : undefined}
                        />
                        <DetailRow label="Email" value={p.parentEmail} />
                      </View>
                    ))
                  )}
                </>
              )}

              {/* Student EDIT mode */}
              {isStudent && student && editMode && draft && (
                <>
                  <EditRow label="First Name" value={draft.firstName} onChangeText={(v) => setField('firstName', v)} />
                  <EditRow label="Last Name"  value={draft.lastName}  onChangeText={(v) => setField('lastName', v)} />
                  <EditRow label="Nickname"   value={draft.preferredName} onChangeText={(v) => setField('preferredName', v)} />
                  <EditRow label="Date of Birth (YYYY-MM-DD)" value={draft.dob} onChangeText={(v) => setField('dob', v)} keyboardType="default" autoCapitalize="none" />

                  {/* Gender */}
                  <View className="py-2 border-b border-gray-100">
                    <Text className="text-xs text-text-muted mb-1">Gender</Text>
                    <View className="flex-row gap-2">
                      {(['male', 'female', 'other'] as const).map((g) => {
                        const active = draft.gender === g;
                        return (
                          <TouchableOpacity
                            key={g}
                            onPress={() => setField('gender', g)}
                            className={`px-3 py-1.5 rounded-full ${active ? 'bg-primary' : 'bg-gray-100'}`}
                          >
                            <Text className={`text-xs font-sans-semibold capitalize ${active ? 'text-white' : 'text-text-muted'}`}>
                              {g}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Class */}
                  <View className="py-2 border-b border-gray-100">
                    <Text className="text-xs text-text-muted mb-1">Class</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {(classes ?? []).map((c) => {
                        const active = draft.classId === c.id;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            onPress={() => setField('classId', c.id)}
                            className={`px-3 py-1.5 rounded-full ${active ? 'bg-primary' : 'bg-gray-100'}`}
                          >
                            <Text className={`text-xs font-sans-semibold ${active ? 'text-white' : 'text-text-muted'}`}>
                              {c.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Status */}
                  <View className="py-2 border-b border-gray-100">
                    <Text className="text-xs text-text-muted mb-1">Status</Text>
                    <View className="flex-row gap-2">
                      {((draft.status === 'pending'
                        ? ['pending', 'active', 'inactive']
                        : ['active', 'inactive']) as StudentStatus[]).map((s) => {
                        const active = draft.status === s;
                        return (
                          <TouchableOpacity
                            key={s}
                            onPress={() => setField('status', s)}
                            className={`px-3 py-1.5 rounded-full ${active ? 'bg-primary' : 'bg-gray-100'}`}
                          >
                            <Text className={`text-xs font-sans-semibold capitalize ${active ? 'text-white' : 'text-text-muted'}`}>
                              {s}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Allergies */}
                  <View className="py-2 border-b border-gray-100">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-text-muted">Has Allergies</Text>
                      <Switch
                        value={draft.hasAllergies}
                        onValueChange={(v) => setField('hasAllergies', v)}
                        trackColor={{ true: COLORS.primary }}
                      />
                    </View>
                    {draft.hasAllergies && (
                      <TextInput
                        value={draft.allergyNotes}
                        onChangeText={(v) => setField('allergyNotes', v)}
                        placeholder="Notes…"
                        multiline
                        className="text-sm text-text-primary bg-gray-50 rounded-lg px-3 py-2 mt-2"
                      />
                    )}
                  </View>

                  {/* Photo consent */}
                  <View className="py-2 border-b border-gray-100">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-text-muted">Photo Publish Consent</Text>
                      <Switch
                        value={draft.photoPublishConsent}
                        onValueChange={(v) => setField('photoPublishConsent', v)}
                        trackColor={{ true: COLORS.primary }}
                      />
                    </View>
                  </View>

                  <EditRow label="Address" value={draft.address} onChangeText={(v) => setField('address', v)} />

                  {/* Parents (editable) */}
                  <View className="mt-3 mb-1 flex-row items-center justify-between">
                    <Text className="text-xs font-sans-semibold" style={{ color: COLORS.navy }}>
                      Parents ({draft.parents.length})
                    </Text>
                    <TouchableOpacity onPress={addParent}>
                      <Text className="text-xs font-sans-semibold" style={{ color: COLORS.primary }}>+ Add</Text>
                    </TouchableOpacity>
                  </View>
                  {draft.parents.map((p, i) => (
                    <View key={i} className="bg-gray-50 rounded-xl p-3 mb-2">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-xs font-sans-semibold text-text-primary">Parent {i + 1}</Text>
                        <TouchableOpacity onPress={() => removeParent(i)}>
                          <Text className="text-xs text-error">Remove</Text>
                        </TouchableOpacity>
                      </View>
                      <EditRow label="Name" value={p.name} onChangeText={(v) => setParentField(i, 'name', v)} />
                      <EditRow label="Email" value={p.email} onChangeText={(v) => setParentField(i, 'email', v)} keyboardType="email-address" autoCapitalize="none" />
                      <EditRow label="Phone" value={p.phone} onChangeText={(v) => setParentField(i, 'phone', v)} keyboardType="phone-pad" />
                    </View>
                  ))}
                </>
              )}
            </ScrollView>

            {/* Footer buttons */}
            <View className="px-5 py-3 border-t border-gray-100 flex-row gap-2">
              {editMode ? (
                <>
                  <TouchableOpacity
                    onPress={handleCancel}
                    className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
                  >
                    <Text className="text-sm font-sans-semibold text-text-muted">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={!dirty || adminUpdate.isPending}
                    className="flex-1 rounded-xl py-3 items-center"
                    style={{
                      backgroundColor: dirty ? COLORS.primary : COLORS.divider,
                      opacity: adminUpdate.isPending ? 0.7 : 1,
                    }}
                  >
                    <Text className="text-sm font-sans-semibold text-white">
                      {adminUpdate.isPending ? 'Saving…' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={onClose}
                  className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
                >
                  <Text className="text-sm font-sans-semibold text-text-muted">Close</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
