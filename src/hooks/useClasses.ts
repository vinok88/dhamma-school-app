import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ClassModel } from '@/types';
import { TABLES } from '@/constants';

function mapClass(d: Record<string, unknown>): ClassModel {
  const teachers = ((d.class_teachers as Record<string, unknown>[]) ?? []).map((row) => {
    const profile = row.user_profiles as Record<string, unknown> | null;
    return {
      id: row.teacher_id as string,
      name: (profile?.full_name as string) ?? '',
    };
  });
  return {
    id: d.id as string,
    schoolId: d.school_id as string,
    name: d.name as string,
    gradeLevel: d.grade_level as string,
    teachers,
    studentCount: (d.student_count as number) ?? 0,
    createdAt: d.created_at as string,
  };
}

const CLASS_SELECT = '*, class_teachers(teacher_id, user_profiles(full_name))';

export function useClasses(schoolId: string) {
  return useQuery({
    queryKey: ['classes', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.CLASSES)
        .select(CLASS_SELECT)
        .eq('school_id', schoolId)
        .order('name');
      if (error) throw error;
      const classes = (data ?? []).map(mapClass);
      const counts = await Promise.all(
        classes.map((c) =>
          supabase
            .from(TABLES.STUDENTS)
            .select('id', { count: 'exact', head: true })
            .eq('class_id', c.id)
            .eq('status', 'active')
        )
      );
      return classes.map((c, i) => ({ ...c, studentCount: counts[i].count ?? 0 }));
    },
    enabled: !!schoolId,
  });
}

// Multi-class support: a teacher may be assigned to more than one class.
export function useMyClasses(teacherId: string) {
  return useQuery({
    queryKey: ['classes', 'teacher', teacherId],
    queryFn: async () => {
      // Find class IDs the teacher is linked to via class_teachers, then load
      // the class rows + their full teacher list for each.
      const { data: links, error: linkErr } = await supabase
        .from('class_teachers')
        .select('class_id')
        .eq('teacher_id', teacherId);
      if (linkErr) throw linkErr;
      const ids = (links ?? []).map((l: any) => l.class_id as string);
      if (!ids.length) return [];

      const { data, error } = await supabase
        .from(TABLES.CLASSES)
        .select(CLASS_SELECT)
        .in('id', ids)
        .order('name');
      if (error) throw error;

      const classes = (data ?? []).map(mapClass);
      const counts = await Promise.all(
        classes.map((c) =>
          supabase
            .from(TABLES.STUDENTS)
            .select('id', { count: 'exact', head: true })
            .eq('class_id', c.id)
            .eq('status', 'active')
        )
      );
      return classes.map((c, i) => ({ ...c, studentCount: counts[i].count ?? 0 }));
    },
    enabled: !!teacherId,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

// Backward-compat: returns the first class the teacher belongs to (or null).
// Several legacy callers (admin dashboard cards, edge function preview) still
// expect a single "myClass" — keep this thin wrapper around useMyClasses.
export function useMyClass(teacherId: string) {
  const { data, ...rest } = useMyClasses(teacherId);
  return { ...rest, data: data?.[0] ?? null };
}

async function syncClassTeachers(classId: string, teacherIds: string[]) {
  // Replace the class's teacher set in two steps. RLS ensures only
  // admin/principal can write here.
  const { error: delErr } = await supabase
    .from('class_teachers')
    .delete()
    .eq('class_id', classId);
  if (delErr) throw delErr;
  if (!teacherIds.length) return;
  const { error: insErr } = await supabase
    .from('class_teachers')
    .insert(teacherIds.map((tid) => ({ class_id: classId, teacher_id: tid })));
  if (insErr) throw insErr;
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { schoolId: string; name: string; gradeLevel: string; teacherIds: string[] }) => {
      const { data, error } = await supabase
        .from(TABLES.CLASSES)
        .insert({ school_id: payload.schoolId, name: payload.name, grade_level: payload.gradeLevel })
        .select()
        .single();
      if (error) throw error;
      try {
        await syncClassTeachers(data.id, payload.teacherIds);
      } catch (e) {
        await supabase.from(TABLES.CLASSES).delete().eq('id', data.id);
        throw e;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { classId: string; name?: string; gradeLevel?: string; teacherIds?: string[] }) => {
      if (payload.name || payload.gradeLevel) {
        const { error } = await supabase
          .from(TABLES.CLASSES)
          .update({
            ...(payload.name && { name: payload.name }),
            ...(payload.gradeLevel && { grade_level: payload.gradeLevel }),
          })
          .eq('id', payload.classId);
        if (error) throw error;
      }
      if (payload.teacherIds !== undefined) {
        await syncClassTeachers(payload.classId, payload.teacherIds);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase.from(TABLES.CLASSES).delete().eq('id', classId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  });
}
