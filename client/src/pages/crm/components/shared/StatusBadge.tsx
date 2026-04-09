import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export default function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const statusLower = status.toLowerCase();
    
    switch (statusLower) {
      case 'active':
      case 'ativo':
      case 'approved':
      case 'aprovado':
      case 'disponível':
      case 'available':
        return { variant: 'default' as const, label: status };
      
      case 'pending':
      case 'pendente':
      case 'aguardando':
        return { variant: 'secondary' as const, label: status };
      
      case 'rejected':
      case 'rejeitado':
      case 'cancelado':
      case 'cancelled':
      case 'inactive':
      case 'inativo':
        return { variant: 'destructive' as const, label: status };
      
      case 'em_estoque':
      case 'in_stock':
        return { 
          variant: 'outline' as const,
          label: status,
          className: 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950'
        };
      
      case 'vendido':
      case 'sold':
        return {
          variant: 'outline' as const,
          label: status,
          className: 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950'
        };
      
      case 'financiado':
      case 'financed':
        return {
          variant: 'outline' as const,
          label: status,
          className: 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950'
        };
      
      case 'investimento':
      case 'investment':
        return {
          variant: 'outline' as const,
          label: status,
          className: 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950'
        };
      
      case 'aluguel':
      case 'rental':
        return {
          variant: 'outline' as const,
          label: status,
          className: 'border-cyan-500 text-cyan-600 bg-cyan-50 dark:bg-cyan-950'
        };
      
      default:
        return { variant: 'outline' as const, label: status };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <Badge 
      variant={variant || config.variant}
      className={className || config.className}
      data-testid={`badge-status-${status.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {config.label}
    </Badge>
  );
}
