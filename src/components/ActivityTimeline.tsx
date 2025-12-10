import { ActivityLog } from '@/types/referral';
import { format } from 'date-fns';
import { Clock, User } from 'lucide-react';

interface ActivityTimelineProps {
  activities: ActivityLog[];
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-foreground">Activity Log</h4>
      <div className="space-y-3">
        {sortedActivities.map((activity, index) => (
          <div
            key={activity.id}
            className="relative pl-6 pb-3 border-l-2 border-border last:border-l-transparent last:pb-0"
          >
            <div className="absolute left-0 top-0 w-3 h-3 -translate-x-[7px] rounded-full bg-primary ring-4 ring-background" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{activity.action}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {activity.performedBy}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              {activity.details && (
                <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded">
                  {activity.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTimeline;
