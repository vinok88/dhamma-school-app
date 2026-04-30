import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { useClasses, useCreateClass, useUpdateClass, useDeleteClass } from '@/hooks/useClasses';
import { useTeachers } from '@/hooks/useTeachers';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ClassFormData } from '@/types';
import { COLORS } from '@/constants';
import { showFriendlyError } from '@/utils/errors';

export default function ClassesScreen() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId ?? '';
  const { data: classes, isLoading } = useClasses(schoolId);
  const { data: teachers } = useTeachers(schoolId);
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ClassFormData>({
    defaultValues: { name: '', gradeLevel: '' },
  });

  function openCreate() {
    setEditingId(null);
    reset({ name: '', gradeLevel: '' });
    setModalVisible(true);
  }

  async function onSubmit(data: ClassFormData) {
    try {
      if (editingId) {
        await updateClass.mutateAsync({ classId: editingId, name: data.name, gradeLevel: data.gradeLevel, teacherId: data.teacherId });
      } else {
        await createClass.mutateAsync({ schoolId, name: data.name, gradeLevel: data.gradeLevel, teacherId: data.teacherId });
      }
      setModalVisible(false);
      reset();
    } catch (e: unknown) {
      showFriendlyError("Couldn't save class", e, 'admin-classes');
    }
  }

  function confirmDelete(classId: string, className: string) {
    Alert.alert('Delete Class', `Delete "${className}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteClass.mutate(classId) },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <View className="bg-navy px-5 pt-4 pb-5 flex-row items-center justify-between">
        <View>
          <Text className="text-white" style={{ fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' }}>Classes 🏫</Text>
          <Text className="text-blue-200 text-sm">{classes?.length ?? 0} classes</Text>
        </View>
        <TouchableOpacity onPress={openCreate} className="bg-primary rounded-xl px-4 py-2" activeOpacity={0.8}>
          <Text className="text-white font-sans-semibold text-sm">+ New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : !classes?.length ? (
        <EmptyState icon="🏫" title="No classes yet" subtitle="Tap '+ New' to create one" />
      ) : (
        <FlatList
          data={classes}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item: c }) => (
            <Card>
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1">
                  <Text className="text-lg font-sans-semibold text-text-primary">{c.name}</Text>
                  <Text className="text-sm text-text-muted">{c.gradeLevel}</Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      setEditingId(c.id);
                      reset({ name: c.name, gradeLevel: c.gradeLevel, teacherId: c.teacherId });
                      setModalVisible(true);
                    }}
                    className="bg-gray-100 rounded-lg px-3 py-1.5"
                  >
                    <Text className="text-xs text-text-muted">Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDelete(c.id, c.name)}
                    className="bg-red-50 rounded-lg px-3 py-1.5"
                  >
                    <Text className="text-xs text-error">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row gap-4 mt-1">
                <Text className="text-xs text-text-muted">👥 {c.studentCount} students</Text>
                <Text className="text-xs text-text-muted">👩‍🏫 {c.teacherName ?? 'No teacher'}</Text>
              </View>
            </Card>
          )}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className="bg-white rounded-t-3xl px-5 pt-6 pb-10">
            <Text className="text-lg font-sans-semibold text-text-primary mb-4">
              {editingId ? 'Edit Class' : 'New Class'}
            </Text>
            <Controller control={control} name="name" render={({ field }) => (
              <Input label="Class Name" required value={field.value} onChangeText={field.onChange}
                placeholder="e.g. Little Buds" error={errors.name?.message} />
            )} />
            <Controller control={control} name="gradeLevel" render={({ field }) => (
              <Input label="Grade Level" required value={field.value} onChangeText={field.onChange}
                placeholder="e.g. Ages 4–6" error={errors.gradeLevel?.message} />
            )} />

            {/* Teacher assignment */}
            <Text className="text-sm font-sans-semibold text-text-primary mb-2">Assign Teacher</Text>
            <Controller control={control} name="teacherId" render={({ field }) => (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => field.onChange(undefined)}
                    className={`px-3 py-1.5 rounded-full border ${!field.value ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`text-xs font-sans-semibold ${!field.value ? 'text-white' : 'text-text-muted'}`}>None</Text>
                  </TouchableOpacity>
                  {(teachers ?? []).filter((t) => t.status === 'active').map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => field.onChange(t.id)}
                      className={`px-3 py-1.5 rounded-full border ${field.value === t.id ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                    >
                      <Text className={`text-xs font-sans-semibold ${field.value === t.id ? 'text-white' : 'text-text-muted'}`}>{t.fullName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )} />

            <View className="flex-row gap-3">
              <View className="flex-1"><Button label="Cancel" variant="outline" onPress={() => setModalVisible(false)} fullWidth /></View>
              <View className="flex-1"><Button label={editingId ? 'Save' : 'Create'} onPress={handleSubmit(onSubmit)}
                loading={createClass.isPending || updateClass.isPending} fullWidth /></View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
