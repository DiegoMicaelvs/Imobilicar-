/**
 * Formatting utilities for Brazilian data formats
 */

/**
 * Formats a CPF or CNPJ number with proper masking
 * CPF: 000.000.000-00 (11 digits)
 * CNPJ: 00.000.000/0000-00 (14 digits)
 * 
 * @param cpf - The CPF/CNPJ string to format (digits only or already formatted)
 * @returns Formatted CPF or CNPJ string
 */
export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length === 0) return '';
  
  // CNPJ format: 00.000.000/0000-00 (14 digits)
  if (cleaned.length === 14) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
  }
  
  // CPF format: 000.000.000-00 (11 digits)
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
};

/**
 * Formats a Brazilian phone number with proper masking
 * Supports both landline (00) 0000-0000 and mobile (00) 00000-0000
 * 
 * @param phone - The phone string to format (digits only or already formatted)
 * @returns Formatted phone string
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  
  // Mobile (11 digits): (00) 00000-0000
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  }
  
  // Landline (10 digits): (00) 0000-0000
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;
  }
  
  // Handle partial input
  if (cleaned.length <= 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
};

/**
 * Formats a CEP (Brazilian postal code) with proper masking (00000-000)
 * 
 * @param cep - The CEP string to format (digits only or already formatted)
 * @returns Formatted CEP string
 */
export const formatCEP = (cep: string): string => {
  const cleaned = cep.replace(/\D/g, '');
  
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 5) return cleaned;
  
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
};

/**
 * Formats a number as Brazilian Real currency
 * 
 * @param value - The numeric value to format
 * @param includeSymbol - Whether to include the R$ symbol (default: true)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, includeSymbol: boolean = true): string => {
  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return includeSymbol ? `R$ ${formatted}` : formatted;
};

/**
 * Parses a formatted currency string to a number
 * 
 * @param value - The formatted currency string (e.g., "R$ 1.234,56" or "1.234,56")
 * @returns The numeric value
 */
export const parseCurrency = (value: string): number => {
  const cleaned = value
    .replace(/[^\d,.]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  return parseFloat(cleaned) || 0;
};

/**
 * Formats a CNPJ number with proper masking (00.000.000/0000-00)
 * 
 * @param cnpj - The CNPJ string to format (digits only or already formatted)
 * @returns Formatted CNPJ string
 */
export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
  if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
  
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
};

/**
 * Removes all formatting from a string, keeping only digits
 * 
 * @param value - The formatted string
 * @returns String with only digits
 */
export const removeFormatting = (value: string): string => {
  return value.replace(/\D/g, '');
};
