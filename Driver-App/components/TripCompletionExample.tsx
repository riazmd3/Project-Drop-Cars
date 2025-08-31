import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useWallet } from '@/contexts/WalletContext';
import AutoDeductionModal from './AutoDeductionModal';

interface TripData {
  id: string;
  pickup: string;
  drop: string;
  distance: number;
  duration: number;
  fare: number;
  commission: number;
}

interface TripCompletionExampleProps {
  tripData: TripData;
  onTripCompleted: () => void;
}

export default function TripCompletionExample({ 
  tripData, 
  onTripCompleted 
}: TripCompletionExampleProps) {
  const { colors } = useTheme();
  const { balance } = useWallet();
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [deductionData, setDeductionData] = useState(null);

  const calculateDeductions = () => {
    const totalDeduction = tripData.fare + tripData.commission;
    return {
      fare: tripData.fare,
      commission: tripData.commission,
      total: totalDeduction
    };
  };

  const handleTripCompletion = () => {
    const deductions = calculateDeductions();
    
    // Check if user has sufficient balance
    if (balance < deductions.total) {
      Alert.alert(
        'Insufficient Balance',
        `Your wallet balance (₹${balance}) is insufficient for trip completion (₹${deductions.total}). Please add money to your wallet.`,
        [
          { text: 'Add Money', onPress: () => {/* Navigate to wallet */} },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    // Show deduction modal
    setDeductionData({
      amount: deductions.total,
      description: `Trip payment: ${tripData.pickup} to ${tripData.drop}`,
      type: 'trip_payment',
      metadata: {
        trip_id: tripData.id,
        distance: tripData.distance,
        duration: tripData.duration,
        fare: tripData.fare,
        commission: tripData.commission,
        pickup: tripData.pickup,
        drop: tripData.drop
      }
    });
    setShowDeductionModal(true);
  };

  const handleDeductionSuccess = () => {
    // Trip completed successfully
    Alert.alert(
      'Trip Completed! 🎉',
      `Trip from ${tripData.pickup} to ${tripData.drop} has been completed successfully.\n\nAmount deducted: ₹${calculateDeductions().total}`,
      [
        { 
          text: 'OK', 
          onPress: () => {
            onTripCompleted();
          }
        }
      ]
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      margin: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    title: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 16,
    },
    tripDetails: {
      marginBottom: 20,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    deductionSection: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    deductionTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 12,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    totalLabel: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    totalValue: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    balanceInfo: {
      backgroundColor: `${colors.primary}10`,
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
    },
    balanceText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
      textAlign: 'center',
    },
    completeButton: {
      backgroundColor: colors.success,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    completeButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
    },
    disabledButton: {
      backgroundColor: colors.border,
    },
  });

  const deductions = calculateDeductions();

  return (
    <View style={dynamicStyles.container}>
      <Text style={dynamicStyles.title}>Complete Trip</Text>
      
      <View style={dynamicStyles.tripDetails}>
        <View style={dynamicStyles.detailRow}>
          <Text style={dynamicStyles.detailLabel}>From</Text>
          <Text style={dynamicStyles.detailValue}>{tripData.pickup}</Text>
        </View>
        <View style={dynamicStyles.detailRow}>
          <Text style={dynamicStyles.detailLabel}>To</Text>
          <Text style={dynamicStyles.detailValue}>{tripData.drop}</Text>
        </View>
        <View style={dynamicStyles.detailRow}>
          <Text style={dynamicStyles.detailLabel}>Distance</Text>
          <Text style={dynamicStyles.detailValue}>{tripData.distance} km</Text>
        </View>
        <View style={dynamicStyles.detailRow}>
          <Text style={dynamicStyles.detailLabel}>Duration</Text>
          <Text style={dynamicStyles.detailValue}>{tripData.duration} min</Text>
        </View>
      </View>

      <View style={dynamicStyles.deductionSection}>
        <Text style={dynamicStyles.deductionTitle}>Payment Breakdown</Text>
        
        <View style={dynamicStyles.detailRow}>
          <Text style={dynamicStyles.detailLabel}>Trip Fare</Text>
          <Text style={dynamicStyles.detailValue}>₹{deductions.fare}</Text>
        </View>
        
        <View style={dynamicStyles.detailRow}>
          <Text style={dynamicStyles.detailLabel}>Commission</Text>
          <Text style={dynamicStyles.detailValue}>₹{deductions.commission}</Text>
        </View>
        
        <View style={dynamicStyles.totalRow}>
          <Text style={dynamicStyles.totalLabel}>Total Deduction</Text>
          <Text style={dynamicStyles.totalValue}>₹{deductions.total}</Text>
        </View>
      </View>

      <View style={dynamicStyles.balanceInfo}>
        <Text style={dynamicStyles.balanceText}>
          Current Balance: ₹{balance} | After Deduction: ₹{balance - deductions.total}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          dynamicStyles.completeButton,
          balance < deductions.total && dynamicStyles.disabledButton
        ]}
        onPress={handleTripCompletion}
        disabled={balance < deductions.total}
      >
        <Text style={dynamicStyles.completeButtonText}>
          {balance < deductions.total ? 'Insufficient Balance' : 'Complete Trip'}
        </Text>
      </TouchableOpacity>

      <AutoDeductionModal
        visible={showDeductionModal}
        onClose={() => setShowDeductionModal(false)}
        onSuccess={handleDeductionSuccess}
        deductionData={deductionData}
      />
    </View>
  );
}
