import { ReferralStatus, UrgencyLevel } from '@/types/referral';
import { getStatusColor, getUrgencyColor, formatStatus } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ReferralStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
      getStatusColor(status),
      className
    )}>
      {formatStatus(status)}
    </span>
  );
};

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
  className?: string;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency, className }) => {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide',
      getUrgencyColor(urgency),
      className
    )}>
      {urgency}
    </span>
  );
};
