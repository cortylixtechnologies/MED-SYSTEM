import React, { createContext, useContext } from 'react';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';

interface NotificationContextType {
  notifications: AppNotification[];
  emergencyAlert: AppNotification | null;
  unreadCount: number;
  emergencyCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissEmergencyAlert: () => void;
  clearNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationContextProvider = ({ children }: { children: React.ReactNode }) => {
  const notificationState = useNotifications();

  return (
    <NotificationContext.Provider value={notificationState}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationContextProvider');
  }
  return context;
};
