import { forwardRef, useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string | number;
  onChange?: (value: string) => void;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>("");
    const isTypingRef = useRef(false);

    useEffect(() => {
      if (isTypingRef.current) {
        return;
      }

      if (value === undefined || value === null || value === '') {
        setDisplayValue('');
        return;
      }

      const numValue = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
      
      if (!isNaN(numValue) && numValue !== 0) {
        const formatted = numValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        setDisplayValue(formatted);
      }
    }, [value]);

    const formatWhileTyping = (input: string): string => {
      const cleaned = input.replace(/[^\d,]/g, '');
      
      if (!cleaned) return '';
      
      const parts = cleaned.split(',');
      let integerPart = parts[0];
      const decimalPart = parts[1];
      
      const intWithThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
      if (decimalPart !== undefined) {
        const limitedDecimal = decimalPart.substring(0, 2);
        return `${intWithThousands},${limitedDecimal}`;
      }
      
      return intWithThousands;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      isTypingRef.current = true;
      const inputValue = e.target.value;
      
      if (inputValue === '') {
        setDisplayValue('');
        if (onChange) {
          onChange('');
        }
        isTypingRef.current = false;
        return;
      }
      
      const formatted = formatWhileTyping(inputValue);
      setDisplayValue(formatted);
    };

    const handleBlur = () => {
      isTypingRef.current = false;
      
      if (displayValue) {
        const cleanForParse = displayValue.replace(/\./g, '').replace(',', '.');
        const numericValue = parseFloat(cleanForParse);
        
        if (!isNaN(numericValue)) {
          const formatted = numericValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          setDisplayValue(formatted);
          
          if (onChange) {
            onChange(numericValue.toString());
          }
        }
      } else if (onChange) {
        onChange('');
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="0,00"
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
