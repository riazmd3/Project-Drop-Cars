import axiosInstance from '@/app/api/axiosInstance';

export interface SignupData {
  name: string;
  primaryMobile: string;
  secondaryMobile?: string;
  paymentMethod?: string;
  paymentNumber?: string;
  password: string;
  address: string;
  aadharNumber: string;
  languages: string[];
  documents: {
    aadharFront: string;
  };
}

export interface SignupResponse {
  success: boolean;
  message: string;
  accountId: string;
  token: string;
}

export const signupAccount = async (data: SignupData): Promise<SignupResponse> => {
  try {
    const response = await axiosInstance.post('/api/signup', data);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.message || 'Signup failed');
    }
    throw new Error('Network error. Please try again.');
  }
};
