import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle, AlertCircle, Clock, Upload } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface DocumentStatusIconProps {
  status: 'PENDING' | 'INVALID' | 'VERIFIED';
  onPress?: () => void;
  size?: number;
}

export default function DocumentStatusIcon({ 
  status, 
  onPress, 
  size = 24 
}: DocumentStatusIconProps) {
  const { colors } = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'VERIFIED':
        return {
          icon: CheckCircle,
          color: '#10B981', // Green
          backgroundColor: '#D1FAE5',
          text: 'Verified'
        };
      case 'INVALID':
        return {
          icon: AlertCircle,
          color: '#EF4444', // Red
          backgroundColor: '#FEE2E2',
          text: 'Invalid'
        };
      case 'PENDING':
        return {
          icon: Clock,
          color: '#F59E0B', // Orange
          backgroundColor: '#FEF3C7',
          text: 'Pending'
        };
      default:
        return {
          icon: Clock,
          color: colors.textSecondary,
          backgroundColor: colors.background,
          text: 'Unknown'
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  const iconStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: config.backgroundColor,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: config.color,
  };

  if (status === 'INVALID' && onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={[iconStyle, styles.clickable]}>
        <IconComponent size={size * 0.6} color={config.color} />
        <View style={[styles.uploadIcon, { backgroundColor: config.color }]}>
          <Upload size={size * 0.3} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={iconStyle}>
      <IconComponent size={size * 0.6} color={config.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  clickable: {
    position: 'relative',
  },
  uploadIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
