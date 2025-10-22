import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Camera, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import axiosInstance from '@/app/api/axiosInstance';

interface DocumentUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  entityId: string;
  entityType: 'car' | 'driver';
  documentType: string;
  documentName: string;
  onSuccess: () => void;
}

export default function DocumentUpdateModal({
  visible,
  onClose,
  entityId,
  entityType,
  documentType,
  documentName,
  onSuccess,
}: DocumentUpdateModalProps) {
  const { colors } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadDocument = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first.');
      return;
    }

    try {
      setUploading(true);

      // For React Native, we need to create a proper FormData object
      const formData = new FormData();
      formData.append('document_type', documentType);
      
      // Create the file object for React Native
      const file = {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'document.jpg',
      } as any;

      if (entityType === 'driver') {
        // Driver documents always use 'licence_image' field
        formData.append('licence_image', file);
        
        await axiosInstance.post(
          `/api/users/cardriver/${entityId}/update-document`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        // Car documents use specific field names
        const fieldNameMap: Record<string, string> = {
          'rc_front': 'rc_front_img',
          'rc_back': 'rc_back_img', 
          'insurance': 'insurance_img',
          'fc': 'fc_img',
          'car_img': 'car_img'
        };
        
        const fieldName = fieldNameMap[documentType] || 'licence_image';
        formData.append(fieldName, file);
        
        await axiosInstance.post(
          `/api/users/cardetails/${entityId}/update-document`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }

      Alert.alert('Success', 'Document updated successfully!');
      onSuccess();
      onClose();
      setSelectedImage(null);
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'Failed to update document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Update {documentName}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Take a new photo or select from gallery
            </Text>

            {selectedImage ? (
              <View style={styles.imageContainer}>
                <Text style={[styles.imageText, { color: colors.text }]}>
                  Image selected
                </Text>
                <TouchableOpacity
                  style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                  onPress={uploadDocument}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Upload size={20} color="#FFFFFF" />
                  )}
                  <Text style={styles.uploadButtonText}>
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={takePhoto}
                >
                  <Camera size={24} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
                  onPress={pickImage}
                >
                  <Upload size={24} color={colors.text} />
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  imageText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
    width: '100%',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
