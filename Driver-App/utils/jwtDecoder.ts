// Utility functions to decode JWT tokens and extract information

export const decodeJWT = (token: string): any => {
  try {
    // Split the JWT token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Use the built-in atob function for base64 decoding
    const decodedPayload = atob(paddedPayload);
    
    // Parse the JSON payload
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('❌ JWT decode error:', error);
    return null;
  }
};

export const extractUserIdFromJWT = (token: string): string | null => {
  try {
    const decoded = decodeJWT(token);
    if (decoded && decoded.sub) {
      return decoded.sub;
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to extract user ID from JWT:', error);
    return null;
  }
};

export const extractOrgIdFromJWT = (token: string): string | null => {
  try {
    const decoded = decodeJWT(token);
    if (decoded && decoded.org_id) {
      return decoded.org_id;
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to extract org ID from JWT:', error);
    return null;
  }
};

export const isJWTExpired = (token: string): boolean => {
  try {
    const decoded = decodeJWT(token);
    if (decoded && decoded.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    }
    return true; // Consider expired if no expiration time
  } catch (error) {
    console.error('❌ Failed to check JWT expiration:', error);
    return true; // Consider expired on error
  }
}; 
