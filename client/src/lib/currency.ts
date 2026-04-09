export function formatCurrency(value: string | number): string {
  const numericValue = typeof value === 'string' 
    ? parseFloat(value.replace(/\./g, '').replace(',', '.')) 
    : value;
  
  if (isNaN(numericValue)) return '';
  
  return numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseCurrency(formattedValue: string): string {
  const cleaned = formattedValue.replace(/\./g, '').replace(',', '.');
  const numeric = parseFloat(cleaned);
  return isNaN(numeric) ? '' : numeric.toString();
}

export function formatCurrencyInput(value: string): string {
  let cleaned = value.replace(/\D/g, '');
  
  if (!cleaned) return '';
  
  const numericValue = parseFloat(cleaned) / 100;
  
  return numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCurrencyWhileTyping(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  
  if (!cleaned) return '';
  
  const numericValue = parseFloat(cleaned) / 100;
  
  return numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseCurrencyToNumber(formattedValue: string): number {
  const cleaned = formattedValue.replace(/\./g, '').replace(',', '.');
  const numeric = parseFloat(cleaned);
  return isNaN(numeric) ? 0 : numeric;
}
