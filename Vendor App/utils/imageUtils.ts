import * as ImagePicker from 'expo-image-picker';

export interface ImageInfo {
  uri: string;
  type: string;
  name: string;
  size: number;
}

export const pickImage = async (): Promise<ImageInfo | null> => {
  try {
    // Request permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      throw new Error('Permission to access camera roll is required!');
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // Validate file size (5MB limit as per API docs)
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }

      // Validate file type
      if (!asset.type || !asset.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      return {
        uri: asset.uri,
        type: asset.type,
        name: `aadhar_${Date.now()}.${asset.type.split('/')[1]}`,
        size: asset.fileSize || 0,
      };
    }

    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

export const validateImage = (imageInfo: ImageInfo): boolean => {
  // Check file size (5MB limit)
  if (imageInfo.size > 5 * 1024 * 1024) {
    throw new Error('Image size must be less than 5MB');
  }

  // Check file type
  if (!imageInfo.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  return true;
};

export const createImageFormData = (imageInfo: ImageInfo): FormData => {
  const formData = new FormData();
  
  // Create a file object from the image URI
  const imageFile = {
    uri: imageInfo.uri,
    type: imageInfo.type,
    name: imageInfo.name,
  } as any;

  formData.append('aadhar_image', imageFile);
  
  return formData;
};
