export const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If starts with 964 (country code without +), keep it
  if (cleaned.startsWith('964')) {
    return `+${cleaned}`;
  }

  // If starts with 0, replace with +964
  if (cleaned.startsWith('0')) {
    return `+964${cleaned.substring(1)}`;
  }

  // If already 10 digits (assuming Iraqi number without country code)
  if (cleaned.length === 10) {
    return `+964${cleaned}`;
  }

  // If 13 digits (assuming with country code but without +)
  if (cleaned.length === 13 && cleaned.startsWith('964')) {
    return `+${cleaned}`;
  }

  // Default: add +964 prefix
  return `+964${cleaned}`;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const normalized = normalizePhoneNumber(phone);
  // Iraqi phone numbers should be +964 followed by 10 digits
  const iraqPhoneRegex = /^\+964\d{10}$/;
  return iraqPhoneRegex.test(normalized);
};
