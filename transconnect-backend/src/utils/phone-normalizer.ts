/**
 * Phone Number Normalization Utility for East Africa
 * Handles various input formats and converts to proper E.164 format
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalizedNumber?: string;
  country?: string;
  countryCode?: string;
  localNumber?: string;
  originalFormat: string;
  issues?: string[];
}

export class PhoneNormalizer {
  // East Africa country mappings
  private static readonly COUNTRY_MAPPINGS = {
    // Uganda
    'UG': { code: '+256', patterns: [/^256/, /^0/, /^7[0-9]{8}/, /^4[0-9]{8}/] },
    // Kenya  
    'KE': { code: '+254', patterns: [/^254/, /^0/, /^7[0-9]{8}/, /^1[0-9]{8}/] },
    // Tanzania
    'TZ': { code: '+255', patterns: [/^255/, /^0/, /^7[0-9]{8}/, /^6[0-9]{8}/] },
    // Rwanda
    'RW': { code: '+250', patterns: [/^250/, /^0/, /^7[0-9]{8}/] },
    // South Sudan
    'SS': { code: '+211', patterns: [/^211/, /^0/, /^9[0-9]{8}/, /^1[0-9]{8}/] },
    // Burundi
    'BI': { code: '+257', patterns: [/^257/, /^0/, /^[679][0-9]{7}/] },
    // Ethiopia
    'ET': { code: '+251', patterns: [/^251/, /^0/, /^9[0-9]{8}/] },
    // Somalia
    'SO': { code: '+252', patterns: [/^252/, /^0/, /^[69][0-9]{7}/] }
  };

  // Default country for the platform (Uganda-based)
  private static readonly DEFAULT_COUNTRY = 'UG';
  private static readonly DEFAULT_COUNTRY_CODE = '+256';

  /**
   * Normalize phone number to E.164 format
   */
  public static normalize(
    phoneNumber: string, 
    defaultCountry: string = PhoneNormalizer.DEFAULT_COUNTRY
  ): PhoneValidationResult {
    const original = phoneNumber;
    const issues: string[] = [];
    
    if (!phoneNumber) {
      return {
        isValid: false,
        originalFormat: original,
        issues: ['Phone number is required']
      };
    }

    // Clean the input
    let cleaned = phoneNumber.trim().replace(/\s+/g, '').replace(/[-()]/g, '');
    
    console.log(`📱 Normalizing: "${original}" → "${cleaned}"`);

    // Handle various formats
    let normalized = this.processPhoneFormat(cleaned, defaultCountry);
    
    if (!normalized.isValid) {
      console.log(`❌ Normalization failed: ${normalized.issues?.join(', ')}`);
      return normalized;
    }

    // Final validation
    const finalValidation = this.validateE164Format(normalized.normalizedNumber!);
    
    if (finalValidation.isValid) {
      console.log(`✅ Normalized: "${original}" → "${normalized.normalizedNumber}"`);
    } else {
      console.log(`❌ Final validation failed: ${finalValidation.issues?.join(', ')}`);
    }

    return {
      ...normalized,
      isValid: finalValidation.isValid,
      issues: finalValidation.isValid ? undefined : finalValidation.issues
    };
  }

  private static processPhoneFormat(cleaned: string, defaultCountry: string): PhoneValidationResult {
    const original = cleaned;

    // Case 1: Already in E.164 format (+256XXXXXXXXX)
    if (cleaned.startsWith('+')) {
      const result = this.validateE164Format(cleaned);
      if (result.isValid) {
        return {
          ...result,
          originalFormat: original
        };
      }
    }

    // Case 2: Starts with country code without + (256XXXXXXXXX)
    for (const [country, config] of Object.entries(this.COUNTRY_MAPPINGS)) {
      const countryCode = config.code.substring(1); // Remove +
      if (cleaned.startsWith(countryCode)) {
        const withPlus = '+' + cleaned;
        const result = this.validateE164Format(withPlus);
        if (result.isValid) {
          return {
            ...result,
            originalFormat: original,
            issues: [`Added missing '+' prefix`]
          };
        }
      }
    }

    // Case 3: Local format (0XXXXXXXXX or 7XXXXXXXX)
    const defaultConfig = this.COUNTRY_MAPPINGS[defaultCountry as keyof typeof this.COUNTRY_MAPPINGS];
    if (!defaultConfig) {
      return {
        isValid: false,
        originalFormat: original,
        issues: [`Unsupported default country: ${defaultCountry}`]
      };
    }

    // Remove leading 0 for local numbers
    if (cleaned.startsWith('0') && cleaned.length >= 9) {
      const withoutZero = cleaned.substring(1);
      const normalized = defaultConfig.code + withoutZero;
      const result = this.validateE164Format(normalized);
      
      if (result.isValid) {
        return {
          ...result,
          originalFormat: original,
          issues: [`Converted local format (removed leading 0, added ${defaultConfig.code})`]
        };
      }
    }

    // Case 4: Mobile number without country code (7XXXXXXXX)
    if (cleaned.match(/^[47][0-9]{8,9}$/)) {
      const normalized = defaultConfig.code + cleaned;
      const result = this.validateE164Format(normalized);
      
      if (result.isValid) {
        return {
          ...result,
          originalFormat: original,
          issues: [`Added country code ${defaultConfig.code} for mobile number`]
        };
      }
    }

    // Case 5: Short number that might need padding or country code
    if (cleaned.length >= 7 && cleaned.length <= 11 && /^[0-9]+$/.test(cleaned)) {
      // Try adding default country code
      const normalized = defaultConfig.code + cleaned;
      const result = this.validateE164Format(normalized);
      
      if (result.isValid) {
        return {
          ...result,
          originalFormat: original,
          issues: [`Added country code ${defaultConfig.code}`]
        };
      }
    }

    return {
      isValid: false,
      originalFormat: original,
      issues: [
        'Unable to normalize phone number',
        `Expected formats: +256XXXXXXXXX, 256XXXXXXXXX, 0XXXXXXXXX, or 7XXXXXXXX`,
        `Received: "${original}"`
      ]
    };
  }

  private static validateE164Format(phoneNumber: string): PhoneValidationResult {
    if (!phoneNumber.startsWith('+')) {
      return {
        isValid: false,
        originalFormat: phoneNumber,
        issues: ['E.164 format must start with +']
      };
    }

    // Check if it matches any known country format
    for (const [countryCode, config] of Object.entries(this.COUNTRY_MAPPINGS)) {
      if (phoneNumber.startsWith(config.code)) {
        const localPart = phoneNumber.substring(config.code.length);
        
        // Validate local number format
        if (this.isValidLocalNumber(localPart, countryCode)) {
          return {
            isValid: true,
            normalizedNumber: phoneNumber,
            country: countryCode,
            countryCode: config.code,
            localNumber: localPart,
            originalFormat: phoneNumber
          };
        } else {
          return {
            isValid: false,
            originalFormat: phoneNumber,
            issues: [`Invalid ${countryCode} local number format: ${localPart}`]
          };
        }
      }
    }

    // Check for international numbers (not East Africa)
    if (phoneNumber.match(/^\+[1-9][0-9]{7,14}$/)) {
      return {
        isValid: true,
        normalizedNumber: phoneNumber,
        country: 'INTERNATIONAL',
        countryCode: phoneNumber.match(/^\+[0-9]+/)?.[0],
        localNumber: phoneNumber.substring(phoneNumber.match(/^\+[0-9]+/)?.[0]?.length || 0),
        originalFormat: phoneNumber
      };
    }

    return {
      isValid: false,
      originalFormat: phoneNumber,
      issues: ['Invalid phone number format']
    };
  }

  private static isValidLocalNumber(localNumber: string, country: string): boolean {
    switch (country) {
      case 'UG': // Uganda: 9 digits, starts with 7 or 4
        return /^[47][0-9]{8}$/.test(localNumber);
      case 'KE': // Kenya: 9 digits, starts with 7 or 1
        return /^[17][0-9]{8}$/.test(localNumber);
      case 'TZ': // Tanzania: 9 digits, starts with 7 or 6
        return /^[67][0-9]{8}$/.test(localNumber);
      case 'RW': // Rwanda: 9 digits, starts with 7
        return /^7[0-9]{8}$/.test(localNumber);
      case 'SS': // South Sudan: 9 digits, starts with 9 or 1
        return /^[91][0-9]{8}$/.test(localNumber);
      case 'BI': // Burundi: 8 digits, starts with 6, 7, or 9
        return /^[679][0-9]{7}$/.test(localNumber);
      case 'ET': // Ethiopia: 9 digits, starts with 9
        return /^9[0-9]{8}$/.test(localNumber);
      case 'SO': // Somalia: 8 digits, starts with 6 or 9
        return /^[69][0-9]{7}$/.test(localNumber);
      default:
        return localNumber.length >= 7 && localNumber.length <= 10;
    }
  }

  /**
   * Batch normalize multiple phone numbers
   */
  public static batchNormalize(
    phoneNumbers: string[], 
    defaultCountry: string = PhoneNormalizer.DEFAULT_COUNTRY
  ): PhoneValidationResult[] {
    return phoneNumbers.map(phone => this.normalize(phone, defaultCountry));
  }

  /**
   * Check if two phone numbers are the same (after normalization)
   */
  public static areEquivalent(phone1: string, phone2: string): boolean {
    const norm1 = this.normalize(phone1);
    const norm2 = this.normalize(phone2);
    
    return norm1.isValid && norm2.isValid && 
           norm1.normalizedNumber === norm2.normalizedNumber;
  }

  /**
   * Get display format for phone number
   */
  public static getDisplayFormat(phoneNumber: string): string {
    const normalized = this.normalize(phoneNumber);
    if (!normalized.isValid) return phoneNumber;

    const number = normalized.normalizedNumber!;
    
    // Format for display based on country
    const formatters: { [key: string]: (local: string) => string } = {
      '+256': (local) => `+256 ${local.substring(0, 3)} ${local.substring(3, 6)} ${local.substring(6)}`, // Uganda
      '+254': (local) => `+254 ${local.substring(0, 3)} ${local.substring(3, 6)} ${local.substring(6)}`, // Kenya
      '+255': (local) => `+255 ${local.substring(0, 3)} ${local.substring(3, 6)} ${local.substring(6)}`, // Tanzania
      '+250': (local) => `+250 ${local.substring(0, 3)} ${local.substring(3, 6)} ${local.substring(6)}`, // Rwanda
      '+211': (local) => `+211 ${local.substring(0, 3)} ${local.substring(3, 6)} ${local.substring(6)}`, // South Sudan
      '+257': (local) => `+257 ${local.substring(0, 2)} ${local.substring(2, 5)} ${local.substring(5)}`,   // Burundi
      '+251': (local) => `+251 ${local.substring(0, 3)} ${local.substring(3, 6)} ${local.substring(6)}`, // Ethiopia
      '+252': (local) => `+252 ${local.substring(0, 2)} ${local.substring(2, 5)} ${local.substring(5)}`,   // Somalia
    };

    for (const [prefix, formatter] of Object.entries(formatters)) {
      if (number.startsWith(prefix)) {
        const local = number.substring(prefix.length);
        return formatter(local);
      }
    }

    return number; // Return as-is for other formats
  }

  /**
   * Detect potential duplicates in a list of phone numbers
   */
  public static findDuplicates(phoneNumbers: string[]): { 
    normalized: string; 
    originalFormats: string[]; 
    count: number;
  }[] {
    const normalizedMap = new Map<string, string[]>();
    
    for (const phone of phoneNumbers) {
      const result = this.normalize(phone);
      if (result.isValid) {
        const key = result.normalizedNumber!;
        if (!normalizedMap.has(key)) {
          normalizedMap.set(key, []);
        }
        normalizedMap.get(key)!.push(phone);
      }
    }

    return Array.from(normalizedMap.entries())
      .filter(([_, formats]) => formats.length > 1)
      .map(([normalized, formats]) => ({
        normalized,
        originalFormats: formats,
        count: formats.length
      }));
  }
}

// Export convenience functions
export const normalizePhone = PhoneNormalizer.normalize;
export const batchNormalizePhones = PhoneNormalizer.batchNormalize;
export const arePhoneNumbersEqual = PhoneNormalizer.areEquivalent;
export const formatPhoneForDisplay = PhoneNormalizer.getDisplayFormat;
export const findPhoneDuplicates = PhoneNormalizer.findDuplicates;