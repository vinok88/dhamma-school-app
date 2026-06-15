import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '@/hooks/useAuth';
import { useClasses } from '@/hooks/useClasses';
import {
  ResolvedRow,
  resolveRowsAgainstExisting,
  useApplyBulkStudents,
} from '@/hooks/useBulkStudents';
import { parseCSVAsRecords, toCSV } from '@/utils/csv';
import { validateRecord, ParsedRow } from '@/utils/bulk-student-validation';
import { showFriendlyError } from '@/utils/errors';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { COLORS } from '@/constants';

const TEMPLATE_HEADERS = [
  'first_name', 'last_name', 'preferred_name', 'dob',
  'gender', 'address', 'class_name',
  'has_allergies', 'allergy_notes', 'photo_publish_consent',
  'parent_emails', 'parent_names', 'parent_phones',
];

const TEMPLATE_EXAMPLE = [
  'Anna', 'Perera', '', '2018-04-01',
  'female', '12 Test St, Carlton', 'Grade 1',
  'false', '', 'true',
  'anna.mum@example.com;anna.dad@example.com', 'Mrs Perera;Mr Perera', '+61400000001;+61400000002',
];

export default function BulkAddStudentsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { data: classes } = useClasses(profile?.schoolId ?? '');
  const applyBulk = useApplyBulkStudents();

  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [resolved, setResolved] = useState<ResolvedRow[] | null>(null);
  const [resolving, setResolving] = useState(false);
  const [working, setWorking] = useState(false);

  const classByName = useMemo(() => {
    const m = new Map<string, string>();
    (classes ?? []).forEach((c) => m.set(c.name.toLowerCase(), c.id));
    return m;
  }, [classes]);

  const validRows = parsed.filter((p) => p.row);
  const errorRows = parsed.filter((p) => !p.row);

  async function downloadTemplate() {
    try {
      const csv = toCSV([TEMPLATE_HEADERS, TEMPLATE_EXAMPLE]);
      const path = `${FileSystem.cacheDirectory}students-template.csv`;
      await FileSystem.writeAsStringAsync(path, csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'text/csv' });
      } else {
        Alert.alert('Template saved', `Saved to ${path}`);
      }
    } catch (e) {
      showFriendlyError("Couldn't share template", e, 'bulk-template');
    }
  }

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const text = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const records = parseCSVAsRecords(text);
      const rows = records.map((rec, idx) => validateRecord(rec, classByName, idx + 2));
      setParsed(rows);
      setResolved(null);
    } catch (e) {
      showFriendlyError("Couldn't read file", e, 'bulk-pick');
    }
  }

  async function preflight() {
    if (!profile || !validRows.length) return;
    setResolving(true);
    try {
      const result = await resolveRowsAgainstExisting(
        profile.schoolId,
        validRows.map((p) => p.row!),
      );
      setResolved(result);
    } catch (e) {
      showFriendlyError("Couldn't check existing students", e, 'bulk-preflight');
    } finally {
      setResolving(false);
    }
  }

  function applyNow() {
    if (!profile || !resolved) return;
    const inserts = resolved.filter((r) => r.action === 'insert').length;
    const updates = resolved.filter((r) => r.action === 'update');
    const replacedLinks = updates.reduce((sum, r) => sum + (r.existingParentCount ?? 0), 0);

    Alert.alert(
      'Apply bulk import?',
      [
        `${inserts} new student${inserts === 1 ? '' : 's'}`,
        `${updates.length} student${updates.length === 1 ? '' : 's'} will be updated`,
        replacedLinks > 0
          ? `${replacedLinks} existing parent link${replacedLinks === 1 ? '' : 's'} will be replaced`
          : '',
        '',
        'This cannot be undone in the app.',
      ].filter(Boolean).join('\n'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          style: 'destructive',
          onPress: async () => {
            setWorking(true);
            try {
              const res = await applyBulk.mutateAsync({ schoolId: profile.schoolId, rows: resolved });
              Alert.alert(
                'Done',
                res.failed.length === 0
                  ? `Imported ${res.ok} student${res.ok === 1 ? '' : 's'}.`
                  : `Imported ${res.ok} OK, ${res.failed.length} failed.\n\n` +
                    res.failed.slice(0, 5).map((f) => `Line ${f.lineNumber}: ${f.message}`).join('\n'),
                [{ text: 'OK', onPress: () => router.back() }],
              );
            } catch (e) {
              showFriendlyError("Couldn't apply import", e, 'bulk-apply');
            } finally {
              setWorking(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title="Bulk Add Students" showBack dark />

      <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
        <View className="bg-white rounded-2xl p-4 mb-3">
          <Text className="font-sans-semibold text-text-primary mb-1">1. Get the template</Text>
          <Text className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
            Open the CSV in Sheets or Excel, fill in one row per student. Use {`';'`} to separate multiple parent emails / names / phones.
          </Text>
          <Button label="Share CSV Template" variant="outline" onPress={downloadTemplate} fullWidth />
        </View>

        <View className="bg-white rounded-2xl p-4 mb-3">
          <Text className="font-sans-semibold text-text-primary mb-1">2. Pick the filled file</Text>
          <Text className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
            Students are matched to existing rows by name + DOB (case-insensitive). Existing parent links will be replaced.
          </Text>
          <Button label="Choose CSV File" onPress={pickFile} fullWidth />
        </View>

        {parsed.length > 0 && (
          <View className="bg-white rounded-2xl p-4 mb-3">
            <Text className="font-sans-semibold text-text-primary mb-2">
              Preview ({validRows.length} valid, {errorRows.length} error{errorRows.length === 1 ? '' : 's'})
            </Text>

            {errorRows.map((p) => (
              <View key={p.lineNumber} className="py-2 border-b border-gray-100">
                <Text className="text-sm font-sans-semibold text-error" numberOfLines={1}>
                  Line {p.lineNumber}: {p.rawNameForDisplay}
                </Text>
                <Text className="text-xs" style={{ color: COLORS.error }}>{p.errors.join('; ')}</Text>
              </View>
            ))}

            {!resolved ? (
              validRows.map((p) => (
                <View key={p.lineNumber} className="py-1 flex-row justify-between">
                  <Text className="text-sm text-text-primary" numberOfLines={1}>{p.rawNameForDisplay}</Text>
                  <Text className="text-xs" style={{ color: COLORS.textMuted }}>Line {p.lineNumber}</Text>
                </View>
              ))
            ) : (
              resolved.map((r) => {
                const isUpdate = r.action === 'update';
                return (
                  <View key={r.lineNumber} className="py-1.5 flex-row justify-between">
                    <Text className="text-sm text-text-primary flex-1 mr-2" numberOfLines={1}>
                      {r.firstName} {r.lastName}
                    </Text>
                    <Text
                      className="text-xs font-sans-semibold"
                      style={{ color: isUpdate ? COLORS.brown : COLORS.success }}
                    >
                      {isUpdate ? `UPDATE${r.existingParentCount ? ` · ${r.existingParentCount} link(s) replace` : ''}` : 'NEW'}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        {parsed.length > 0 && validRows.length > 0 && !resolved && (
          <Button
            label={resolving ? 'Checking…' : `Check ${validRows.length} student${validRows.length === 1 ? '' : 's'} against existing`}
            onPress={preflight}
            loading={resolving}
            fullWidth
            size="lg"
          />
        )}

        {resolved && (
          <Button
            label={working ? 'Importing…' : `Apply ${resolved.length} change${resolved.length === 1 ? '' : 's'}`}
            onPress={applyNow}
            loading={working}
            fullWidth
            size="lg"
          />
        )}

        {(applyBulk.isPending || working) ? <LoadingSpinner label="Importing…" /> : null}
        <View className="h-12" />
      </ScrollView>
    </SafeAreaView>
  );
}
