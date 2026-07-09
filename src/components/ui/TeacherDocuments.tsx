import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '@/constants';
import { signTeacherDocUrl, useUploadTeacherDocument, TeacherDocKind } from '@/hooks/useTeacherDocs';
import { showFriendlyError } from '@/utils/errors';

/**
 * View-only link to a stored teacher document. Signs a short-lived URL on tap
 * (the bucket is private) and opens it in the in-app browser. No caching.
 * Shows a muted "Not provided" when there is no document.
 */
export function TeacherDocumentLink({ label, path }: { label: string; path?: string }) {
  const [loading, setLoading] = useState(false);

  if (!path) {
    return (
      <Text className="text-xs" style={{ color: COLORS.textMuted }}>
        {label}: Not provided
      </Text>
    );
  }

  async function open() {
    setLoading(true);
    try {
      const url = await signTeacherDocUrl(path!);
      if (url) await WebBrowser.openBrowserAsync(url);
      else Alert.alert('Unavailable', "Couldn't open the document. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity onPress={open} disabled={loading} accessibilityRole="link" className="self-start py-1">
      <Text className="text-xs" style={{ color: COLORS.navy, textDecorationLine: 'underline' }}>
        {loading ? 'Opening…' : label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Row for uploading / replacing a teacher document (PDF). Reports the picked file
 * to the parent, which decides when to upload (immediately in the profile, or on
 * submit during registration). Shows the current stored doc with a view link.
 */
export function TeacherDocumentPicker({
  label,
  hint,
  currentPath,
  pickedName,
  onPick,
  uploading,
}: {
  label: string;
  hint?: string;
  currentPath?: string;
  pickedName?: string | null;
  onPick: (file: { uri: string; name: string }) => void;
  uploading?: boolean;
}) {
  async function pick() {
    const res = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (asset) onPick({ uri: asset.uri, name: asset.name });
  }

  const hasDoc = !!currentPath || !!pickedName;

  return (
    <View className="bg-white rounded-2xl p-4 mb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="font-sans-semibold text-text-primary">{label}</Text>
          {!!hint && <Text className="text-xs text-text-muted">{hint}</Text>}
          <Text
            className="text-xs mt-0.5"
            style={{ color: hasDoc ? COLORS.success : COLORS.textMuted }}
            numberOfLines={1}
          >
            {pickedName ? `Selected: ${pickedName}` : currentPath ? 'Uploaded (PDF)' : 'Not uploaded'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={pick}
          disabled={uploading}
          className="rounded-full px-3 py-2"
          style={{ backgroundColor: COLORS.navy, opacity: uploading ? 0.5 : 1 }}
        >
          <Text className="text-white text-xs font-sans-semibold">
            {uploading ? 'Uploading…' : hasDoc ? 'Replace' : 'Upload PDF'}
          </Text>
        </TouchableOpacity>
      </View>
      {currentPath ? (
        <View className="mt-2">
          <TeacherDocumentLink label="View current document" path={currentPath} />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Self-contained documents card for the teacher's own profile — picks and
 * uploads immediately (the profile row already exists), then refreshes.
 */
export function TeacherDocumentsCard({
  userId,
  wwccPath,
  resumePath,
  onChange,
}: {
  userId: string;
  wwccPath?: string;
  resumePath?: string;
  onChange?: () => void | Promise<void>;
}) {
  const upload = useUploadTeacherDocument();
  const [busy, setBusy] = useState<TeacherDocKind | null>(null);

  async function handlePick(kind: TeacherDocKind, file: { uri: string; name: string }) {
    setBusy(kind);
    try {
      await upload.mutateAsync({ userId, uri: file.uri, kind });
      await onChange?.();
    } catch (e: unknown) {
      showFriendlyError("Couldn't upload document", e, 'teacher-docs');
    } finally {
      setBusy(null);
    }
  }

  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-2">
        <Text className="text-base mr-2">📄</Text>
        <Text className="font-sans-semibold text-text-primary">My Documents</Text>
      </View>
      <TeacherDocumentPicker
        label="Working With Children Check (WWCC)"
        hint="PDF"
        currentPath={wwccPath}
        uploading={busy === 'wwcc'}
        onPick={(f) => handlePick('wwcc', f)}
      />
      <TeacherDocumentPicker
        label="Resume"
        hint="PDF"
        currentPath={resumePath}
        uploading={busy === 'resume'}
        onPick={(f) => handlePick('resume', f)}
      />
    </View>
  );
}
