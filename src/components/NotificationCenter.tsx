import { useNavigate } from 'react-router-dom';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, AlertTriangle, AlertCircle, Info, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const NotificationCenter = () => {
  const { 
    notifications, 
    unreadCount, 
    emergencyCount,
    markAsRead, 
    markAllAsRead, 
    clearNotification 
  } = useNotificationContext();
  const navigate = useNavigate();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      default:
        return <Info className="w-4 h-4 text-info" />;
    }
  };

  const getNotificationStyles = (type: string, read: boolean) => {
    const baseStyles = read ? 'opacity-60' : '';
    switch (type) {
      case 'emergency':
        return cn(baseStyles, !read && 'bg-destructive/5 border-l-2 border-l-destructive');
      case 'urgent':
        return cn(baseStyles, !read && 'bg-warning/5 border-l-2 border-l-warning');
      default:
        return cn(baseStyles, !read && 'bg-info/5 border-l-2 border-l-info');
    }
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    if (notification.referralId) {
      navigate(`/referral/${notification.referralId}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 min-w-[18px] h-[18px] text-xs rounded-full flex items-center justify-center font-medium px-1",
              emergencyCount > 0 
                ? "bg-destructive text-destructive-foreground animate-pulse" 
                : "bg-primary text-primary-foreground"
            )}>
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors relative group",
                    getNotificationStyles(notification.type, notification.read)
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm",
                        !notification.read && "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
