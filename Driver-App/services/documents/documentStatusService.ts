import axiosInstance from '@/app/api/axiosInstance';

export interface DocumentStatus {
  document_type: string;
  status: 'PENDING' | 'INVALID' | 'VERIFIED';
  image_url: string;
  updated_at: string | null;
}

export interface DocumentStatusResponse {
  entity_id: string;
  entity_type: 'vehicle_owner' | 'car' | 'driver';
  documents: Record<string, DocumentStatus>;
}

export interface UpdateDocumentRequest {
  document_type: string;
  document_image: File;
}

// Fetch all document statuses
export const fetchDocumentStatuses = async (): Promise<DocumentStatusResponse[]> => {
  try {
    const response = await axiosInstance.get('/api/users/vehicle-owner/all-document-status');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch document statuses:', error);
    throw error;
  }
};

// Update driver document
export const updateDriverDocument = async (
  entityId: string, 
  documentType: string, 
  documentImage: File
): Promise<void> => {
  try {
    const formData = new FormData();
    formData.append('document_type', documentType);
    
    // Driver documents always use 'licence_image' field
    formData.append('licence_image', documentImage);

    await axiosInstance.post(
      `/api/users/cardriver/${entityId}/update-document`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  } catch (error) {
    console.error('❌ Failed to update driver document:', error);
    throw error;
  }
};

// Update car document
export const updateCarDocument = async (
  entityId: string, 
  documentType: string, 
  documentImage: File
): Promise<void> => {
  try {
    const formData = new FormData();
    formData.append('document_type', documentType);
    
    // Map document types to their corresponding field names
    const fieldNameMap: Record<string, string> = {
      'rc_front': 'rc_front_img',
      'rc_back': 'rc_back_img', 
      'insurance': 'insurance_img',
      'fc': 'fc_img',
      'car_img': 'car_img'
    };
    
    const fieldName = fieldNameMap[documentType] || 'licence_image';
    formData.append(fieldName, documentImage);

    await axiosInstance.post(
      `/api/users/cardetails/${entityId}/update-document`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  } catch (error) {
    console.error('❌ Failed to update car document:', error);
    throw error;
  }
};
