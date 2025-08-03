import RazorpayCheckout from 'react-native-razorpay';

export interface RazorpayOptions {
  description: string;
  image: string;
  currency: string;
  key: string;
  amount: string;
  name: string;
  order_id?: string;
  prefill: {
    email: string;
    contact: string;
    name: string;
  };
  theme: {
    color: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export const openRazorpay = (options: RazorpayOptions): Promise<RazorpayResponse> => {
  return new Promise((resolve, reject) => {
    RazorpayCheckout.open(options)
      .then((data: RazorpayResponse) => {
        resolve(data);
      })
      .catch((error: any) => {
        reject(error);
      });
  });
};

export const createRazorpayOrder = async (amount: number): Promise<string> => {
  // In a real app, this would call your backend API to create a Razorpay order
  // For demo purposes, we'll return a mock order ID
  return `order_${Math.random().toString(36).substr(2, 9)}`;
};