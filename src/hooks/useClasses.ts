import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ClassModel } from '@/types';
import { TABLES } from '@/constants';

function mapClass(d: Record<string, unknown>): ClassModel {
  const teacher = d.user_profiles as Record<string, unknown> | null;
  return {
    id: d.id as string,
    schoolId: d.school_id as string,
    name: d.name as string,
    gradeLevel: d.grade_level as string,
    teacherId: d.teacher_id as string | undefined,
    teacherName: teacher?.full_name as string | undefined,
    studentCount: (d.student_count as number) ?? 0,
    createdAt: d.created_at as string,
  };
}

export function useClasses(schoolId: string) {
  return useQuery({
    queryKey: ['classes', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.CLASSES)
        .select('*, user_profiles(full_name)')
        .eq('school_id', schoolId)
        .order('name');
      if (error) throw error;
      // Attach student count
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

export function useMyClass(teacherId: string) {
  return useQuery({
    queryKey: ['class', 'teacher', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.CLASSES)
        .select('*, user_profiles(full_name)')
        .eq('teacher_id', teacherId)
        .single();
      if (error) return null;
      return mapClass(data);
    },
    enabled: !!teacherId,
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { schoolId: string; name: string; gradeLevel: string; teacherId?: string }) => {
      const { error } = await supabase.from(TABLES.CLASSES).insert({
        school_id: payload.schoolId,
        name: payload.name,
        grade_level: payload.gradeLevel,
        teacher_id: payload.teacherId,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { classId: string; name?: string; gradeLevel?: string; teacherId?: string }) => {
      const { error } = await supabase
        .from(TABLES.CLASSES)
        .update({
          ...(payload.name && { name: payload.name }),
          ...(payload.gradeLevel && { grade_level: payload.gradeLevel }),
          ...(payload.teacherId !== undefined && { teacher_id: payload.teacherId }),
        })
        .eq('id', payload.classId);
      if (error) throw error;
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
