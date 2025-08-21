import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, Car, Plus, X, Check, Edit, Trash2 } from 'lucide-react-native';
import { getCars, updateCar, deleteCar, setDefaultCar, CarDetails } from '@/services/carManagementService';
import * as ImagePicker from 'expo-image-picker';

const carTypes = ['Sedan', 'Hatchback', 'SUV', 'Innova', 'Innova Crysta', 'Other'];

export default function MyCarsScreen() {
  const { user, setUser } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [cars, setCars] = useState<CarDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCar, setNewCar] = useState({ name: '', type: '', registration: '' });
  const [editingCar, setEditingCar] = useState<CarDetails | null>(null);
  const [editForm, setEditForm] = useState({
    car_name: '',
    car_type: '',
    car_number: '',
    rc_front_img: null,
    rc_back_img: null,
    insurance_img: null,
    fc_img: null,
    car_img: null
  });

  // Fetch cars from API
  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const carsList = await getCars();
      setCars(carsList);
    } catch (error: any) {
      Alert.alert('Error', `Failed to fetch cars: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addCar = () => {
    if (!newCar.name || !newCar.type || !newCar.registration) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const carToAdd = {
      id: Date.now().toString(),
      ...newCar,
      isDefault: user?.cars?.length === 0,
    };

    const updatedUser = {
      ...user,
      cars: [...(user?.cars || []), carToAdd]
    };

    setUser(updatedUser);
    setNewCar({ name: '', type: '', registration: '' });
    setShowAddModal(false);
    Alert.alert('Success', 'Car added successfully');
  };

  // Edit car functions
  const openEditModal = (car: CarDetails) => {
    setEditingCar(car);
    setEditForm({
      car_name: car.car_name,
      car_type: car.car_type,
      car_number: car.car_number,
      rc_front_img: null,
      rc_back_img: null,
      insurance_img: null,
      fc_img: null,
      car_img: null
    });
    setShowEditModal(true);
  };

  const pickImage = async (fieldName: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setEditForm(prev => ({
          ...prev,
          [fieldName]: result.assets[0].uri
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleEditCar = async () => {
    if (!editingCar) return;

    try {
      setLoading(true);
      const updateData = {
        car_id: editingCar.car_id,
        organization_id: editingCar.organization_id,
        vehicle_owner_id: editingCar.vehicle_owner_id,
        ...editForm
      };

      // Remove null values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === null) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      await updateCar(updateData);
      Alert.alert('Success', 'Car updated successfully');
      setShowEditModal(false);
      fetchCars(); // Refresh the list
    } catch (error: any) {
      Alert.alert('Error', `Failed to update car: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    Alert.alert(
      'Delete Car',
      'Are you sure you want to delete this car?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteCar(carId);
              Alert.alert('Success', 'Car deleted successfully');
              fetchCars(); // Refresh the list
            } catch (error: any) {
              Alert.alert('Error', `Failed to delete car: ${error.message}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSetDefaultCar = async (carId: string) => {
    try {
      setLoading(true);
      await setDefaultCar(carId);
      Alert.alert('Success', 'Default car updated');
      fetchCars(); // Refresh the list
    } catch (error: any) {
      Alert.alert('Error', `Failed to set default car: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setDefaultCar = (carId) => {
    const updatedCars = user?.cars?.map(car => ({
      ...car,
      isDefault: car.id === carId
    }));

    setUser({ ...user, cars: updatedCars });
    Alert.alert('Success', 'Default car updated');
  };



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
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerContent: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 2,
    },
    headerSubtitle: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    carCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    carHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    carName: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    defaultBadge: {
      backgroundColor: colors.success,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    defaultText: {
      fontSize: 10,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    carDetails: {
      marginBottom: 12,
    },
    carDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    carDetailLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    carDetailValue: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    carActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    actionButton: {
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    defaultButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    actionButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      color: colors.textSecondary,
    },
    defaultButtonText: {
      color: '#FFFFFF',
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      marginTop: 20,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      marginTop: 8,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    carHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    carInfo: {
      flex: 1,
    },
    carType: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      marginTop: 2,
    },
    deleteButton: {
      borderColor: colors.error,
      marginLeft: 8,
    },
    imageUploadButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    imageUploadText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      width: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typeSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    typeButton: {
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedTypeButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    selectedTypeButtonText: {
      color: '#FFFFFF',
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 20,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
    },
  });

  const CarCard = ({ car }) => (
    <View style={dynamicStyles.carCard}>
      <View style={dynamicStyles.carHeader}>
        <Text style={dynamicStyles.carName}>{car.name}</Text>
        {car.isDefault && (
          <View style={dynamicStyles.defaultBadge}>
            <Text style={dynamicStyles.defaultText}>DEFAULT</Text>
          </View>
        )}
      </View>

      <View style={dynamicStyles.carDetails}>
        <View style={dynamicStyles.carDetailRow}>
          <Text style={dynamicStyles.carDetailLabel}>Type:</Text>
          <Text style={dynamicStyles.carDetailValue}>{car.type}</Text>
        </View>
        <View style={dynamicStyles.carDetailRow}>
          <Text style={dynamicStyles.carDetailLabel}>Registration:</Text>
          <Text style={dynamicStyles.carDetailValue}>{car.registration}</Text>
        </View>
      </View>

      <View style={dynamicStyles.carActions}>
        {!car.isDefault && (
          <TouchableOpacity 
            style={[dynamicStyles.actionButton, dynamicStyles.defaultButton]}
            onPress={() => setDefaultCar(car.id)}
          >
            <Text style={[dynamicStyles.actionButtonText, dynamicStyles.defaultButtonText]}>
              Set Default
            </Text>
          </TouchableOpacity>
        )}

      </View>
    </View>
  );

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <View style={dynamicStyles.headerContent}>
          <Text style={dynamicStyles.headerTitle}>My Cars</Text>
          <Text style={dynamicStyles.headerSubtitle}>Welcome back, {user?.name}!</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={dynamicStyles.loadingContainer}>
            <Text style={dynamicStyles.loadingText}>Loading cars...</Text>
          </View>
        ) : cars.length > 0 ? (
          cars.map((car) => (
            <View key={car.car_id} style={dynamicStyles.carCard}>
              <View style={dynamicStyles.carHeader}>
                <View style={dynamicStyles.carInfo}>
                  <Text style={dynamicStyles.carName}>{car.car_name}</Text>
                  <Text style={dynamicStyles.carType}>{car.car_type}</Text>
                </View>
                <View style={dynamicStyles.carActions}>
                  <TouchableOpacity 
                    style={dynamicStyles.actionButton}
                    onPress={() => openEditModal(car)}
                  >
                    <Edit color={colors.primary} size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[dynamicStyles.actionButton, dynamicStyles.deleteButton]}
                    onPress={() => handleDeleteCar(car.car_id)}
                  >
                    <Trash2 color={colors.error} size={16} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={dynamicStyles.carDetails}>
                <View style={dynamicStyles.carDetailRow}>
                  <Text style={dynamicStyles.carDetailLabel}>Registration:</Text>
                  <Text style={dynamicStyles.carDetailValue}>{car.car_number}</Text>
                </View>
                <View style={dynamicStyles.carDetailRow}>
                  <Text style={dynamicStyles.carDetailLabel}>Status:</Text>
                  <Text style={dynamicStyles.carDetailValue}>{car.status}</Text>
                </View>
              </View>

              <View style={dynamicStyles.carActions}>
                <TouchableOpacity 
                  style={[dynamicStyles.actionButton, dynamicStyles.defaultButton]}
                  onPress={() => handleSetDefaultCar(car.car_id)}
                >
                  <Text style={dynamicStyles.defaultButtonText}>Set as Default</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={dynamicStyles.emptyState}>
            <Text style={dynamicStyles.emptyStateText}>No cars found</Text>
            <Text style={dynamicStyles.emptyStateSubtext}>Add your first car to get started</Text>
          </View>
        )}

        <TouchableOpacity 
          style={dynamicStyles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus color="#FFFFFF" size={24} />
          <Text style={dynamicStyles.addButtonText}>Add New Car</Text>
        </TouchableOpacity>

        
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Add New Car</Text>
              <TouchableOpacity 
                onPress={() => setShowAddModal(false)}
                style={dynamicStyles.closeButton}
              >
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Car Name</Text>
              <TextInput
                style={dynamicStyles.input}
                placeholder="e.g., Tata Nexon"
                value={newCar.name}
                onChangeText={(value) => setNewCar({ ...newCar, name: value })}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Car Type</Text>
              <View style={dynamicStyles.typeSelector}>
                {carTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      dynamicStyles.typeButton,
                      newCar.type === type && dynamicStyles.selectedTypeButton
                    ]}
                    onPress={() => setNewCar({ ...newCar, type })}
                  >
                    <Text style={[
                      dynamicStyles.typeButtonText,
                      newCar.type === type && dynamicStyles.selectedTypeButtonText
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Registration Number</Text>
              <TextInput
                style={dynamicStyles.input}
                placeholder="e.g., TN10BZ1234"
                value={newCar.registration}
                onChangeText={(value) => setNewCar({ ...newCar, registration: value.toUpperCase() })}
                autoCapitalize="characters"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <TouchableOpacity style={dynamicStyles.submitButton} onPress={addCar}>
              <Text style={dynamicStyles.submitButtonText}>Add Car</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Car Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Edit Car</Text>
              <TouchableOpacity 
                onPress={() => setShowEditModal(false)}
                style={dynamicStyles.closeButton}
              >
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Car Name</Text>
              <TextInput
                style={dynamicStyles.input}
                placeholder="e.g., Tata Nexon"
                value={editForm.car_name}
                onChangeText={(value) => setEditForm({ ...editForm, car_name: value })}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Car Type</Text>
              <View style={dynamicStyles.typeSelector}>
                {carTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      dynamicStyles.typeButton,
                      editForm.car_type === type && dynamicStyles.selectedTypeButton
                    ]}
                    onPress={() => setEditForm({ ...editForm, car_type: type })}
                  >
                    <Text style={[
                      dynamicStyles.typeButtonText,
                      editForm.car_type === type && dynamicStyles.selectedTypeButtonText
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Registration Number</Text>
              <TextInput
                style={dynamicStyles.input}
                placeholder="e.g., TN10BZ1234"
                value={editForm.car_number}
                onChangeText={(value) => setEditForm({ ...editForm, car_number: value.toUpperCase() })}
                autoCapitalize="characters"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Image upload sections */}
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>RC Front Image</Text>
              <TouchableOpacity 
                style={dynamicStyles.imageUploadButton}
                onPress={() => pickImage('rc_front_img')}
              >
                <Text style={dynamicStyles.imageUploadText}>
                  {editForm.rc_front_img ? 'Image Selected' : 'Select Image'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>RC Back Image</Text>
              <TouchableOpacity 
                style={dynamicStyles.imageUploadButton}
                onPress={() => pickImage('rc_back_img')}
              >
                <Text style={dynamicStyles.imageUploadText}>
                  {editForm.rc_back_img ? 'Image Selected' : 'Select Image'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={dynamicStyles.submitButton} 
              onPress={handleEditCar}
              disabled={loading}
            >
              <Text style={dynamicStyles.submitButtonText}>
                {loading ? 'Updating...' : 'Update Car'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
}