import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface DocumentStatusIconProps {
  status: 'VERIFIED' | 'INVALID' | 'PENDING' | string;
  onPress?: () => void;
  size?: number;
}

export default function DocumentStatusIcon({ status, size = 22 }): JSX.Element {
  const { colors } = useTheme();

  let text = 'Unknown';
  let color = colors.textSecondary;
  switch (String(status).toUpperCase()) {
    case 'VERIFIED':
      text = 'Verified';
      color = '#10B981'; // Green
      break;
    case 'INVALID':
      text = 'Invalid';
      color = '#EF4444'; // Red
      break;
    case 'PENDING':
    case 'PROCESSING':
      text = 'Processing'; // Unification for clarity!
      color = '#F59E0B'; // Orange
      break;
    default:
      text = 'Unknown';
      color = colors.textSecondary;
  }

  return (
    <Text style={{
      fontSize: size + 6,
      color,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    }}>
      {text}
    </Text>
  );
}
