import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, Car, Plus, Image as ImageIcon, RefreshCw } from 'lucide-react-native';
import { fetchDashboardData } from '@/services/orders/dashboardService';
import { fetchDocumentStatuses, DocumentStatusResponse } from '@/services/documents/documentStatusService';
import DocumentStatusIcon from '@/components/DocumentStatusIcon';
import DocumentUpdateModal from '@/components/DocumentUpdateModal';

export default function MyCarsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { dashboardData, loading, error, fetchData, refreshData } = useDashboard();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatusResponse[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    entityId: string;
    documentType: string;
    documentName: string;
  } | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Use simple refresh logic - only refresh cars data and document statuses
      await refreshData();
      await fetchDocumentStatuses().then(setDocumentStatuses);
    } catch (error: any) {
      console.error('Error refreshing cars:', error);
      
      // Handle authentication errors
      if (error.message?.includes('No authentication token found') || 
          error.message?.includes('Authentication failed') || 
          error.message?.includes('401')) {
        console.log('🔐 Authentication error detected, redirecting to login');
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login')
            }
          ]
        );
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch document statuses on component mount
  useEffect(() => {
    fetchDocumentStatuses()
      .then(setDocumentStatuses)
      .catch(error => {
        console.error('Failed to fetch document statuses:', error);
      });
  }, []);

  // Get document status for a specific car and document type
  const getDocumentStatus = (carId: string, documentType: string): 'PENDING' | 'INVALID' | 'VERIFIED' => {
    const carStatus = documentStatuses.find(status => 
      status.entity_type === 'car' && status.entity_id === carId
    );
    
    if (!carStatus || !carStatus.documents[documentType]) {
      return 'PENDING';
    }
    
    return carStatus.documents[documentType].status;
  };

  // Handle document update
  const handleDocumentUpdate = (carId: string, documentType: string, documentName: string) => {
    setSelectedDocument({
      entityId: carId,
      documentType,
      documentName,
    });
    setShowUpdateModal(true);
  };

  // Handle successful document update
  const handleDocumentUpdateSuccess = () => {
    // Refresh document statuses
    fetchDocumentStatuses()
      .then(setDocumentStatuses)
      .catch(error => {
        console.error('Failed to refresh document statuses:', error);
      });
  };

  const handleAddCar = () => {
    router.push('/add-car-menu');
  };

  // Edit/Delete not implemented – hide controls

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    refreshButton: {
      padding: 6,
      borderRadius: 8,
    },
    backButton: {
      padding: 8,
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 4,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    carCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    carHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    carTitle: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      flex: 1,
    },
    carActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      padding: 8,
      marginLeft: 8,
    },
    carInfo: {
      marginBottom: 16,
    },
    carRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    carLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      width: 100,
    },
    carValue: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      flex: 1,
    },
    carImages: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    imageItem: {
      width: 80,
      height: 60,
      backgroundColor: colors.border,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageText: {
      fontSize: 10,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    errorText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.error,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.loadingText}>Loading your cars...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.errorContainer}>
          <Text style={dynamicStyles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={dynamicStyles.retryButton} onPress={fetchData}>
            <Text style={dynamicStyles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cars = dashboardData?.cars || [];

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={dynamicStyles.backButton}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>My Cars</Text>
          <TouchableOpacity 
            style={dynamicStyles.refreshButton} 
            onPress={handleRefresh}
          >
            <RefreshCw color={colors.primary} size={16} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={dynamicStyles.addButton} onPress={handleAddCar}>
          <Plus color="#FFFFFF" size={16} />
          <Text style={dynamicStyles.addButtonText}>Add Car</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={dynamicStyles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {cars.length === 0 ? (
          <View style={dynamicStyles.emptyState}>
            <Car color={colors.textSecondary} size={64} style={dynamicStyles.emptyIcon} />
            <Text style={dynamicStyles.emptyTitle}>No Cars Added Yet</Text>
            <Text style={dynamicStyles.emptySubtitle}>
              Add your first car to start earning with Drop Cars
            </Text>
            <TouchableOpacity style={dynamicStyles.addButton} onPress={handleAddCar}>
              <Plus color="#FFFFFF" size={16} />
              <Text style={dynamicStyles.addButtonText}>Add Your First Car</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cars.map((car) => (
            <View key={car.id} style={dynamicStyles.carCard}>
              <View style={dynamicStyles.carHeader}>
                <Text style={dynamicStyles.carTitle}>
                  {car.car_name || `${car.car_brand || ''} ${car.car_model || ''}`.trim() || 'Unnamed Car'}
                </Text>
                {/* Edit/Delete actions removed */}
              </View>

              <View style={dynamicStyles.carInfo}>
                <View style={dynamicStyles.carRow}>
                  <Text style={dynamicStyles.carLabel}>Registration:</Text>
                  <Text style={dynamicStyles.carValue}>{car.car_number}</Text>
                </View>
                <View style={dynamicStyles.carRow}>
                  <Text style={dynamicStyles.carLabel}>Type:</Text>
                  <Text style={dynamicStyles.carValue}>{car.car_type}</Text>
                </View>
                <View style={dynamicStyles.carRow}>
                  <Text style={dynamicStyles.carLabel}>Year:</Text>
                  <Text style={dynamicStyles.carValue}>{car.year_of_the_car || car.car_year || car.year || 'N/A'}</Text>
                </View>
              </View>

              <View style={dynamicStyles.carImages}>
                <TouchableOpacity 
                  style={dynamicStyles.imageItem}
                  onPress={() => {
                    const status = getDocumentStatus(car.id, 'rc_front');
                    if (status === 'INVALID') {
                      handleDocumentUpdate(car.id, 'rc_front', 'RC Front');
                    }
                  }}
                >
                  <ImageIcon color={colors.textSecondary} size={20} />
                  <Text style={dynamicStyles.imageText}>RC Front</Text>
                  <DocumentStatusIcon 
                    status={getDocumentStatus(car.id, 'rc_front')} 
                    size={16}
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={dynamicStyles.imageItem}
                  onPress={() => {
                    const status = getDocumentStatus(car.id, 'rc_back');
                    if (status === 'INVALID') {
                      handleDocumentUpdate(car.id, 'rc_back', 'RC Back');
                    }
                  }}
                >
                  <ImageIcon color={colors.textSecondary} size={20} />
                  <Text style={dynamicStyles.imageText}>RC Back</Text>
                  <DocumentStatusIcon 
                    status={getDocumentStatus(car.id, 'rc_back')} 
                    size={16}
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={dynamicStyles.imageItem}
                  onPress={() => {
                    const status = getDocumentStatus(car.id, 'insurance');
                    if (status === 'INVALID') {
                      handleDocumentUpdate(car.id, 'insurance', 'Insurance');
                    }
                  }}
                >
                  <ImageIcon color={colors.textSecondary} size={20} />
                  <Text style={dynamicStyles.imageText}>Insurance</Text>
                  <DocumentStatusIcon 
                    status={getDocumentStatus(car.id, 'insurance')} 
                    size={16}
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={dynamicStyles.imageItem}
                  onPress={() => {
                    const status = getDocumentStatus(car.id, 'fc');
                    if (status === 'INVALID') {
                      handleDocumentUpdate(car.id, 'fc', 'FC');
                    }
                  }}
                >
                  <ImageIcon color={colors.textSecondary} size={20} />
                  <Text style={dynamicStyles.imageText}>FC</Text>
                  <DocumentStatusIcon 
                    status={getDocumentStatus(car.id, 'fc')} 
                    size={16}
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={dynamicStyles.imageItem}
                  onPress={() => {
                    const status = getDocumentStatus(car.id, 'car_img');
                    if (status === 'INVALID') {
                      handleDocumentUpdate(car.id, 'car_img', 'Car Image');
                    }
                  }}
                >
                  <ImageIcon color={colors.textSecondary} size={20} />
                  <Text style={dynamicStyles.imageText}>Car Image</Text>
                  <DocumentStatusIcon 
                    status={getDocumentStatus(car.id, 'car_img')} 
                    size={16}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Document Update Modal */}
      {selectedDocument && (
        <DocumentUpdateModal
          visible={showUpdateModal}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedDocument(null);
          }}
          entityId={selectedDocument.entityId}
          entityType="car"
          documentType={selectedDocument.documentType}
          documentName={selectedDocument.documentName}
          onSuccess={handleDocumentUpdateSuccess}
        />
      )}
    </SafeAreaView>
  );
}