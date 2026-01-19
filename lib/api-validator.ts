/**
 * API Request Validator
 * Enterprise-level validation for API requests
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indian format)
 */
export function isValidPhone(phone: string): boolean {
  // Remove spaces, dashes, and plus sign
  const cleaned = phone.replace(/[\s\-+]/g, '');
  // Indian phone: 10 digits, optionally with country code 91
  const phoneRegex = /^(91)?[6-9]\d{9}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate login credentials
 */
export function validateLoginCredentials(email: string, password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!email || !email.trim()) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push('Please enter a valid email address');
  }

  if (!password || !password.trim()) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate registration data
 */
export function validateRegistrationData(data: {
  email: string;
  password: string;
  name: string;
  phone: string;
}): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.name || !data.name.trim()) {
    errors.push('Name is required');
  } else if (data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!data.email || !data.email.trim()) {
    errors.push('Email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('Please enter a valid email address');
  }

  if (!data.password || !data.password.trim()) {
    errors.push('Password is required');
  } else {
    const passwordValidation = isValidPassword(data.password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }
  }

  if (!data.phone || !data.phone.trim()) {
    errors.push('Phone number is required');
  } else if (!isValidPhone(data.phone)) {
    errors.push('Please enter a valid phone number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate product data
 */
export function validateProductData(data: {
  name: string;
  price: number; // Accepts 'price' for backward compatibility, maps to sellingPrice
}): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.name || !data.name.trim()) {
    errors.push('Product name is required');
  } else if (data.name.trim().length < 2) {
    errors.push('Product name must be at least 2 characters long');
  }

  if (data.price === undefined || data.price === null) {
    errors.push('Price is required');
  } else if (data.price < 0) {
    errors.push('Price must be greater than or equal to 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize input (prevent XSS)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-+]/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}
