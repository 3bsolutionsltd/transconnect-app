import { PhoneNormalizer } from './phone-normalizer';

export interface ContactFieldError {
  field: 'email' | 'phone';
  message: string;
}

export interface ContactValidationResult {
  isValid: boolean;
  normalizedEmail?: string;
  normalizedPhone?: string;
  errors: ContactFieldError[];
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateEmail(email: string): { isValid: boolean; normalizedEmail?: string; message?: string } {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return { isValid: false, message: 'Email is required' };
  }

  if (normalizedEmail.length > 254) {
    return { isValid: false, message: 'Email address is too long' };
  }

  const basicEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!basicEmailPattern.test(normalizedEmail)) {
    return { isValid: false, message: 'Please provide a valid email address' };
  }

  if (normalizedEmail.includes('..')) {
    return { isValid: false, message: 'Email address cannot contain consecutive dots' };
  }

  const [localPart, domainPart] = normalizedEmail.split('@');
  if (!localPart || !domainPart || domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return { isValid: false, message: 'Please provide a valid email address' };
  }

  return { isValid: true, normalizedEmail };
}

function validatePhone(phone: string, defaultCountry = 'UG'): { isValid: boolean; normalizedPhone?: string; message?: string } {
  const rawPhone = phone?.trim() || '';

  if (!rawPhone) {
    return { isValid: false, message: 'Phone number is required' };
  }

  if (!/^[+\d\s()\-]+$/.test(rawPhone)) {
    return { isValid: false, message: 'Phone number contains invalid characters' };
  }

  if ((rawPhone.match(/\+/g) || []).length > 1) {
    return { isValid: false, message: 'Phone number contains too many + signs' };
  }

  if (rawPhone.includes(',') || rawPhone.includes('/') || rawPhone.includes(';')) {
    return { isValid: false, message: 'Please enter only one phone number' };
  }

  const normalized = PhoneNormalizer.normalize(rawPhone, defaultCountry);
  if (!normalized.isValid || !normalized.normalizedNumber) {
    return {
      isValid: false,
      message: normalized.issues?.[0] || 'Please provide a valid phone number',
    };
  }

  return { isValid: true, normalizedPhone: normalized.normalizedNumber };
}

export function validateAndNormalizeContact(input: {
  email?: string;
  phone?: string;
  defaultCountry?: string;
}): ContactValidationResult {
  const errors: ContactFieldError[] = [];
  let normalizedEmail: string | undefined;
  let normalizedPhone: string | undefined;

  if (input.email !== undefined) {
    const emailResult = validateEmail(input.email);
    if (!emailResult.isValid) {
      errors.push({ field: 'email', message: emailResult.message || 'Invalid email address' });
    } else {
      normalizedEmail = emailResult.normalizedEmail;
    }
  }

  if (input.phone !== undefined) {
    const phoneResult = validatePhone(input.phone, input.defaultCountry);
    if (!phoneResult.isValid) {
      errors.push({ field: 'phone', message: phoneResult.message || 'Invalid phone number' });
    } else {
      normalizedPhone = phoneResult.normalizedPhone;
    }
  }

  return {
    isValid: errors.length === 0,
    normalizedEmail,
    normalizedPhone,
    errors,
  };
}
