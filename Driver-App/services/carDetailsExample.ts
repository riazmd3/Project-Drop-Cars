import { addCarDetails, testCarDetailsDataStructure, CarDetailsData } from './signupService';

// Example usage of the car details API
export const exampleCarDetailsUsage = async () => {
  console.log('🚗 Example: Using Car Details API');
  
  // Sample car data matching your Postman request
  const sampleCarData: CarDetailsData = {
    car_name: 'Toyota Camry',
    car_type: 'SEDAN',
    car_number: 'MH-12-AB-1234',
    organization_id: 'org_123',
    vehicle_owner_id: '2819b115-fbcc-42ec-a5b3-81633980d9ce',
    rc_front_img: 'file://path/to/rc_front.png',
    rc_back_img: 'file://path/to/rc_back.png',
    insurance_img: 'file://path/to/insurance.png',
    fc_img: 'file://path/to/fc.png',
    car_img: 'file://path/to/car.png'
  };

  try {
    // Test the data structure first
    console.log('🧪 Testing data structure...');
    const testResult = testCarDetailsDataStructure(sampleCarData);
    console.log('✅ Data structure test completed');

    // Call the API (uncomment when ready to test)
    // console.log('📤 Calling car details API...');
    // const response = await addCarDetails(sampleCarData);
    // console.log('✅ API Response:', response);

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Example of how to handle the API response
export const handleCarDetailsResponse = (response: any) => {
  if (response.status === 'success') {
    console.log('🎉 Car added successfully!');
    console.log('Car ID:', response.car_id);
    console.log('Message:', response.message);
    
    // Access the car details
    const carDetails = response.car_details;
    console.log('Car Details:', {
      name: carDetails.car_name,
      type: carDetails.car_type,
      number: carDetails.car_number,
      rcFrontUrl: carDetails.rc_front_img_url,
      rcBackUrl: carDetails.rc_back_img_url,
      insuranceUrl: carDetails.insurance_img_url,
      fcUrl: carDetails.fc_img_url,
      carUrl: carDetails.car_img_url
    });
  } else {
    console.log('⚠️ API returned non-success status:', response.status);
  }
};

// Example validation function
export const validateCarDetails = (carData: CarDetailsData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required text fields
  if (!carData.car_name?.trim()) errors.push('Car name is required');
  if (!carData.car_type?.trim()) errors.push('Car type is required');
  if (!carData.car_number?.trim()) errors.push('Car number is required');
  if (!carData.organization_id?.trim()) errors.push('Organization ID is required');
  if (!carData.vehicle_owner_id?.trim()) errors.push('Vehicle owner ID is required');
  
  // Required images
  if (!carData.rc_front_img) errors.push('RC front image is required');
  if (!carData.rc_back_img) errors.push('RC back image is required');
  if (!carData.insurance_img) errors.push('Insurance image is required');
  if (!carData.fc_img) errors.push('FC image is required');
  if (!carData.car_img) errors.push('Car image is required');
  
  // Car type validation
  const validCarTypes = ['SEDAN', 'HATCHBACK', 'SUV', 'INNOVA', 'INNOVA CRYSTA', 'OTHER'];
  if (!validCarTypes.includes(carData.car_type)) {
    errors.push(`Car type must be one of: ${validCarTypes.join(', ')}`);
  }
  
  // Car number format validation (basic)
  const carNumberRegex = /^[A-Z]{2}-\d{2}-[A-Z]{2}-\d{4}$/;
  if (!carNumberRegex.test(carData.car_number)) {
    errors.push('Car number must be in format: XX-XX-XX-XXXX (e.g., MH-12-AB-1234)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Example of creating FormData manually (if needed)
export const createCarDetailsFormData = (carData: CarDetailsData): FormData => {
  const formData = new FormData();
  
  // Append text fields
  formData.append('car_name', carData.car_name);
  formData.append('car_type', carData.car_type);
  formData.append('car_number', carData.car_number);
  formData.append('organization_id', carData.organization_id);
  formData.append('vehicle_owner_id', carData.vehicle_owner_id);
  
  // Append image files
  if (carData.rc_front_img) {
    formData.append('rc_front_img', {
      uri: carData.rc_front_img,
      type: 'image/png',
      name: 'rc_front.png'
    } as any);
  }
  
  if (carData.rc_back_img) {
    formData.append('rc_back_img', {
      uri: carData.rc_back_img,
      type: 'image/png',
      name: 'rc_back.png'
    } as any);
  }
  
  if (carData.insurance_img) {
    formData.append('insurance_img', {
      uri: carData.insurance_img,
      type: 'image/png',
      name: 'insurance.png'
    } as any);
  }
  
  if (carData.fc_img) {
    formData.append('fc_img', {
      uri: carData.fc_img,
      type: 'image/png',
      name: 'fc.png'
    } as any);
  }
  
  if (carData.car_img) {
    formData.append('car_img', {
      uri: carData.car_img,
      type: 'image/png',
      name: 'car.png'
    } as any);
  }
  
  return formData;
};

export default {
  exampleCarDetailsUsage,
  handleCarDetailsResponse,
  validateCarDetails,
  createCarDetailsFormData
};
