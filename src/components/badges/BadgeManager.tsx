import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  useBadges, useBadgeHolders, useCreateBadge, useUpdateBadge, useArchiveBadge, useUploadBadgeImage, publicBadgeUrl,
} from '@/hooks/useBadges';
import { BadgeAvatar } from './AchievementBadge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { COLORS } from '@/constants';
import { formatDate } from '@/utils/date';
import { showFriendlyError } from '@/utils/errors';
import { BadgeModel, ClassModel } from '@/types';

type Scope = 'school' | 'class';

/** Badge-definition manager. scope 'school' → principal's school-wide badges;
 *  scope 'class' → a teacher's class-wide badges (limited to `classes`). */
export function BadgeManager({ schoolId, scope, classes = [], createdBy }: {
  schoolId: string; scope: Scope; classes?: ClassModel[]; createdBy?: string;
}) {
  const { data: allBadges, isLoading } = useBadges(schoolId);
  const archive = useArchiveBadge();
  const [editing, setEditing] = useState<BadgeModel | 'new' | null>(null);
  const [holdersFor, setHoldersFor] = useState<BadgeModel | null>(null);

  const myClassIds = new Set(classes.map((c) => c.id));
  const badges = (allBadges ?? []).filter((b) =>
    scope === 'school' ? !b.classId : !!(b.classId && myClassIds.has(b.classId)),
  );

  function confirmArchive(b: BadgeModel) {
    Alert.alert('Delete badge', `Delete "${b.name}"? Badges already awarded to students are kept.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await archive.mutateAsync(b.id); }
          catch (e: unknown) { showFriendlyError("Couldn't delete badge", e, 'archive-badge'); }
        },
      },
    ]);
  }

  return (
    <View className="flex-1">
      <View className="px-4 pt-2 pb-3">
        <Button
          label="+ New Badge"
          onPress={() => setEditing('new')}
          fullWidth
          disabled={scope === 'class' && classes.length === 0}
        />
        {scope === 'class' && classes.length === 0 ? (
          <Text className="text-xs text-text-muted mt-2">You need an assigned class to create class badges.</Text>
        ) : null}
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : !badges.length ? (
        <EmptyState icon="🏅" title="No badges yet" subtitle="Create a badge to start recognising achievements." />
      ) : (
        <ScrollView className="flex-1 px-4">
          {badges.map((b) => (
            <View key={b.id} className="bg-white rounded-2xl p-3 mb-2 flex-row items-center">
              <TouchableOpacity
                onPress={() => setHoldersFor(b)}
                className="flex-1 flex-row items-center"
                activeOpacity={0.7}
              >
                <BadgeAvatar imageUrl={b.imageUrl} size={48} />
                <View className="flex-1 ml-3">
                  <Text className="font-sans-semibold text-text-primary">{b.name}</Text>
                  {b.description ? <Text className="text-xs text-text-muted" numberOfLines={2}>{b.description}</Text> : null}
                  <Text className="text-xs" style={{ color: COLORS.textMuted }}>
                    {scope === 'class' ? (b.className ?? 'Class') : 'School-wide'} · Tap to see holders
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditing(b)} className="px-2 py-1">
                <Text className="text-primary text-xs">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmArchive(b)} className="px-2 py-1">
                <Text className="text-error text-xs">Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View className="h-6" />
        </ScrollView>
      )}

      {editing ? (
        <BadgeFormModal
          schoolId={schoolId}
          scope={scope}
          classes={classes}
          createdBy={createdBy}
          badge={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {holdersFor ? (
        <BadgeHoldersModal badge={holdersFor} onClose={() => setHoldersFor(null)} />
      ) : null}
    </View>
  );
}

function BadgeHoldersModal({ badge, onClose }: { badge: BadgeModel; onClose: () => void }) {
  const { data: holders, isLoading } = useBadgeHolders(badge.id);
  const activeCount = (holders ?? []).filter((h) => h.isActive).length;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '85%' }}>
          <View className="w-10 h-1 rounded-full bg-gray-300 self-center my-3" />
          <View className="px-5 pb-3 flex-row items-center">
            <BadgeAvatar imageUrl={badge.imageUrl} size={40} />
            <View className="flex-1 ml-3">
              <Text className="font-sans-semibold text-text-primary">{badge.name}</Text>
              <Text className="text-xs text-text-muted">
                {holders ? `${activeCount} active · ${holders.length} total` : 'Badge holders'}
              </Text>
            </View>
          </View>

          <ScrollView className="px-5" style={{ maxHeight: 420 }}>
            {isLoading ? (
              <LoadingSpinner />
            ) : !holders?.length ? (
              <Text className="text-sm text-text-muted py-4">No students hold this badge yet.</Text>
            ) : (
              holders.map((h) => (
                <View key={h.awardId} className="flex-row items-center py-2 border-b border-gray-50">
                  <View className="flex-1" style={{ opacity: h.isActive ? 1 : 0.5 }}>
                    <Text className="text-sm font-sans-semibold text-text-primary">{h.studentName}</Text>
                    <Text className="text-xs text-text-muted">{h.className ?? 'Unassigned'}</Text>
                  </View>
                  <Text className="text-xs" style={{ color: h.isActive ? COLORS.success : COLORS.textMuted }}>
                    {h.revokedAt
                      ? 'Removed'
                      : !h.isActive
                        ? 'Expired'
                        : h.expiresAt
                          ? `Until ${formatDate(h.expiresAt)}`
                          : 'Active'}
                  </Text>
                </View>
              ))
            )}
            <View className="h-4" />
          </ScrollView>

          <View className="px-5 py-3 border-t border-gray-100">
            <TouchableOpacity onPress={onClose} className="bg-gray-100 rounded-xl py-3 items-center">
              <Text className="text-sm font-sans-semibold text-text-muted">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function BadgeFormModal({ schoolId, scope, classes, createdBy, badge, onClose }: {
  schoolId: string; scope: Scope; classes: ClassModel[]; createdBy?: string; badge: BadgeModel | null; onClose: () => void;
}) {
  const create = useCreateBadge();
  const update = useUpdateBadge();
  const uploadImage = useUploadBadgeImage();
  const [name, setName] = useState(badge?.name ?? '');
  const [description, setDescription] = useState(badge?.description ?? '');
  const [classId, setClassId] = useState(badge?.classId ?? (scope === 'class' ? (classes[0]?.id ?? '') : ''));
  const [imagePath] = useState(badge?.imageUrl ?? '');
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!res.canceled) setLocalUri(res.assets[0].uri);
  }

  async function save() {
    if (!name.trim()) { Alert.alert('Name required', 'Enter a badge name.'); return; }
    if (scope === 'class' && !classId) { Alert.alert('Class required', 'Pick a class for this badge.'); return; }
    setBusy(true);
    try {
      let finalPath = imagePath;
      if (localUri) finalPath = await uploadImage.mutateAsync({ schoolId, uri: localUri });
      if (badge) {
        await update.mutateAsync({ id: badge.id, name, description, imageUrl: finalPath || undefined });
      } else {
        await create.mutateAsync({
          schoolId, classId: scope === 'class' ? classId : null, name, description,
          imageUrl: finalPath || undefined, createdBy,
        });
      }
      onClose();
    } catch (e: unknown) {
      showFriendlyError("Couldn't save badge", e, 'save-badge');
    } finally {
      setBusy(false);
    }
  }

  const previewUri = localUri ?? publicBadgeUrl(imagePath);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '90%' }}>
          <View className="w-10 h-1 rounded-full bg-gray-300 self-center my-3" />
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
            <Text style={{ fontSize: 18, fontFamily: 'DMSerifDisplay_400Regular', color: COLORS.textPrimary }} className="mb-4">
              {badge ? 'Edit Badge' : 'New Badge'}
            </Text>

            <View className="items-center mb-4">
              <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
                {previewUri ? (
                  <Image source={{ uri: previewUri }} style={{ width: 88, height: 88, borderRadius: 44 }} />
                ) : (
                  <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.cream, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 40 }}>🏅</Text>
                  </View>
                )}
                <Text className="text-xs text-primary text-center mt-1">{previewUri ? 'Change image' : 'Add image'}</Text>
              </TouchableOpacity>
            </View>

            <Input label="Name" required value={name} onChangeText={setName} placeholder="e.g. Star Reader" />
            <Input label="Description" value={description} onChangeText={setDescription} placeholder="What it's for" multiline numberOfLines={3} />

            {scope === 'class' && !badge ? (
              <>
                <Text className="text-sm font-sans-semibold text-text-primary mb-2">Class</Text>
                <View className="flex-row flex-wrap gap-2 mb-2">
                  {classes.map((c) => {
                    const active = classId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setClassId(c.id)}
                        className={`px-3 py-1.5 rounded-full border ${active ? 'bg-primary border-primary' : 'border-gray-200'}`}
                      >
                        <Text className={`text-xs font-sans-semibold ${active ? 'text-white' : 'text-text-muted'}`}>{c.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : null}
          </ScrollView>
          <View className="px-5 py-3 border-t border-gray-100 flex-row gap-2">
            <TouchableOpacity onPress={onClose} className="flex-1 bg-gray-100 rounded-xl py-3 items-center">
              <Text className="text-sm font-sans-semibold text-text-muted">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={save}
              disabled={busy}
              className="flex-1 rounded-xl py-3 items-center"
              style={{ backgroundColor: COLORS.primary, opacity: busy ? 0.6 : 1 }}
            >
              <Text className="text-sm font-sans-semibold text-white">{busy ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
