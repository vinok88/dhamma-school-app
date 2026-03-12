import React from 'react';
import { View, Text } from 'react-native';
import { STUDENT_STATUS_CONFIG, ATTENDANCE_STATUS_CONFIG, ANNOUNCEMENT_TYPE_CONFIG } from '@/constants';

type BadgeType = 'student' | 'attendance' | 'announcement' | 'custom';

interface BadgeProps {
  label: string;
  type?: BadgeType;
  status?: string;
  color?: string;
  bg?: string;
}

export function Badge({ label, type = 'custom', status, color, bg }: BadgeProps) {
  let resolvedColor = color ?? '#6B7280';
  let resolvedBg = bg ?? '#F3F4F6';

  if (status) {
    if (type === 'student' && STUDENT_STATUS_CONFIG[status]) {
      resolvedColor = STUDENT_STATUS_CONFIG[status].color;
      resolvedBg = STUDENT_STATUS_CONFIG[status].bg;
      label = label || STUDENT_STATUS_CONFIG[status].label;
    } else if (type === 'attendance' && ATTENDANCE_STATUS_CONFIG[status]) {
      resolvedColor = ATTENDANCE_STATUS_CONFIG[status].color;
      resolvedBg = ATTENDANCE_STATUS_CONFIG[status].bg;
      label = label || ATTENDANCE_STATUS_CONFIG[status].label;
    } else if (type === 'announcement' && ANNOUNCEMENT_TYPE_CONFIG[status]) {
      resolvedColor = ANNOUNCEMENT_TYPE_CONFIG[status].color;
      resolvedBg = '#F0F4FF';
      label = label || ANNOUNCEMENT_TYPE_CONFIG[status].label;
    }
  }

  return (
    <View
      className="rounded-full px-3 py-1 self-start"
      style={{ backgroundColor: resolvedBg }}
    >
      <Text className="text-xs font-sans-semibold" style={{ color: resolvedColor }}>
        {label}
      </Text>
    </View>
  );
}
