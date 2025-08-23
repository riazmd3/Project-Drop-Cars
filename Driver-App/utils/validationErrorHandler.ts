import { Alert } from 'react-native';

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export const handleValidationError = (error: any): void => {
  console.log('🔍 Processing validation error:', error);
  
  // Check if it's a validation error from the backend
  if (error.response?.status === 422 || error.response?.status === 400) {
    const errorData = error.response.data;
    
    // Handle different types of validation errors
    if (errorData.detail) {
      // Check if it's an array of validation errors
      if (Array.isArray(errorData.detail)) {
        const validationErrors = errorData.detail as ValidationError[];
        
        // Find specific field errors
        const mobileError = validationErrors.find(err => 
          err.field === 'primary_number' || 
          err.field === 'secondary_number' ||
          err.message.toLowerCase().includes('mobile') ||
          err.message.toLowerCase().includes('phone') ||
          err.message.toLowerCase().includes('number')
        );
        
        const aadharError = validationErrors.find(err => 
          err.field === 'aadhar_number' ||
          err.message.toLowerCase().includes('aadhar')
        );
        
        const emailError = validationErrors.find(err => 
          err.field === 'email' ||
          err.message.toLowerCase().includes('email')
        );
        
        // Show specific alerts for existing fields
        if (mobileError && mobileError.message.toLowerCase().includes('already exists')) {
          Alert.alert(
            'Mobile Number Already Exists',
            'This mobile number is already registered. Please use a different number or try logging in instead.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        if (aadharError && aadharError.message.toLowerCase().includes('already exists')) {
          Alert.alert(
            'Aadhar Number Already Exists',
            'This Aadhar number is already registered. Please use a different number or try logging in instead.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        if (emailError && emailError.message.toLowerCase().includes('already exists')) {
          Alert.alert(
            'Email Already Exists',
            'This email address is already registered. Please use a different email or try logging in instead.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // Show generic validation error with field details
        const errorMessages = validationErrors.map(err => `${err.field}: ${err.message}`).join('\n');
        Alert.alert('Validation Error', errorMessages, [{ text: 'OK' }]);
        return;
      }
      
      // Handle single validation error
      const errorMessage = errorData.detail;
      
      if (typeof errorMessage === 'string') {
        if (errorMessage.toLowerCase().includes('mobile') && errorMessage.toLowerCase().includes('already exists')) {
          Alert.alert(
            'Mobile Number Already Exists',
            'This mobile number is already registered. Please use a different number or try logging in instead.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        if (errorMessage.toLowerCase().includes('aadhar') && errorMessage.toLowerCase().includes('already exists')) {
          Alert.alert(
            'Aadhar Number Already Exists',
            'This Aadhar number is already registered. Please use a different number or try logging in instead.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already exists')) {
          Alert.alert(
            'Email Already Exists',
            'This email address is already registered. Please use a different email or try logging in instead.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // Show generic validation error
        Alert.alert('Validation Error', errorMessage, [{ text: 'OK' }]);
        return;
      }
    }
    
    // Handle message field
    if (errorData.message) {
      const message = errorData.message.toLowerCase();
      
      if (message.includes('mobile') && message.includes('already exists')) {
        Alert.alert(
          'Mobile Number Already Exists',
          'This mobile number is already registered. Please use a different number or try logging in instead.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      if (message.includes('aadhar') && message.includes('already exists')) {
        Alert.alert(
          'Aadhar Number Already Exists',
          'This Aadhar number is already registered. Please use a different number or try logging in instead.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      if (message.includes('email') && message.includes('already exists')) {
        Alert.alert(
          'Email Already Exists',
          'This email address is already registered. Please use a different email or try logging in instead.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      Alert.alert('Error', errorData.message, [{ text: 'OK' }]);
      return;
    }
  }
  
  // Handle other types of errors
  if (error.code === 'ECONNABORTED') {
    Alert.alert(
      'Request Timeout',
      'Server is taking too long to respond. Please try again.',
      [{ text: 'OK' }]
    );
  } else if (error.code === 'ERR_NETWORK') {
    Alert.alert(
      'Network Error',
      'Please check your internet connection and try again.',
      [{ text: 'OK' }]
    );
  } else if (error.code === 'ENOTFOUND') {
    Alert.alert(
      'Server Not Found',
      'Please check if the backend server is running.',
      [{ text: 'OK' }]
    );
  } else if (error.response?.status === 500) {
    Alert.alert(
      'Server Error',
      'Something went wrong on our end. Please try again later.',
      [{ text: 'OK' }]
    );
  } else if (error.response?.status === 401) {
    Alert.alert(
      'Authentication Failed',
      'Please login again to get a valid token.',
      [{ text: 'OK' }]
    );
  } else if (error.response?.status === 403) {
    Alert.alert(
      'Access Denied',
      'You don\'t have permission to perform this action.',
      [{ text: 'OK' }]
    );
  } else {
    // Generic error fallback
    const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
    Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
  }
};

// Helper function to check if a specific field already exists
export const checkFieldExists = (error: any, fieldName: string): boolean => {
  if (error.response?.status === 422 || error.response?.status === 400) {
    const errorData = error.response.data;
    
    if (errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        return errorData.detail.some((err: ValidationError) => 
          err.field === fieldName && err.message.toLowerCase().includes('already exists')
        );
      }
      
      if (typeof errorData.detail === 'string') {
        return errorData.detail.toLowerCase().includes(fieldName) && 
               errorData.detail.toLowerCase().includes('already exists');
      }
    }
    
    if (errorData.message) {
      return errorData.message.toLowerCase().includes(fieldName) && 
             errorData.message.toLowerCase().includes('already exists');
    }
  }
  
  return false;
};
