import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export type NotificationType = 'emergency' | 'urgent' | 'info';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  referralId?: string;
  patientName?: string;
  fromHospital?: string;
  read: boolean;
  createdAt: Date;
}

type ReferralStatus = 'pending' | 'accepted' | 'in_treatment' | 'completed' | 'rejected' | 'more_info_requested';
type UrgencyLevel = 'emergency' | 'urgent' | 'routine';

const statusLabels: Record<ReferralStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_treatment: 'In Treatment',
  completed: 'Completed',
  rejected: 'Rejected',
  more_info_requested: 'More Info Requested',
};

export const useNotifications = () => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [emergencyAlert, setEmergencyAlert] = useState<AppNotification | null>(null);

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50

    // Show emergency alert overlay for emergency referrals
    if (notification.type === 'emergency') {
      setEmergencyAlert(newNotification);
    }

    return newNotification;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissEmergencyAlert = useCallback(() => {
    setEmergencyAlert(null);
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const emergencyCount = notifications.filter(n => n.type === 'emergency' && !n.read).length;

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('referral-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'referrals',
        },
        async (payload) => {
          const oldStatus = payload.old?.status as ReferralStatus;
          const newStatus = payload.new?.status as ReferralStatus;
          const patientName = payload.new?.patient_name as string;
          const fromHospitalId = payload.new?.from_hospital_id as string;
          const toHospitalId = payload.new?.to_hospital_id as string;
          const urgency = payload.new?.urgency as UrgencyLevel;
          const referralId = payload.new?.id as string;

          if (oldStatus !== newStatus) {
            const isAdmin = currentUser.role === 'admin';
            const isFromMyHospital = fromHospitalId === currentUser.hospital_id;
            const isToMyHospital = toHospitalId === currentUser.hospital_id;

            if (isAdmin || isFromMyHospital || isToMyHospital) {
              // Fetch hospital name for better context
              const { data: fromHospital } = await supabase
                .from('hospitals')
                .select('name')
                .eq('id', fromHospitalId)
                .single();

              const notificationType: NotificationType = 
                urgency === 'emergency' ? 'emergency' : 
                urgency === 'urgent' ? 'urgent' : 'info';

              addNotification({
                title: `Referral ${statusLabels[newStatus]}`,
                message: `${patientName}'s referral status changed to "${statusLabels[newStatus]}"`,
                type: notificationType,
                referralId,
                patientName,
                fromHospital: fromHospital?.name,
              });

              queryClient.invalidateQueries({ queryKey: ['referrals'] });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'referrals',
        },
        async (payload) => {
          const toHospitalId = payload.new?.to_hospital_id as string;
          const fromHospitalId = payload.new?.from_hospital_id as string;
          const patientName = payload.new?.patient_name as string;
          const urgency = payload.new?.urgency as UrgencyLevel;
          const referralId = payload.new?.id as string;
          const isAdmin = currentUser.role === 'admin';
          const isToMyHospital = toHospitalId === currentUser.hospital_id;

          if (isAdmin || isToMyHospital) {
            const { data: fromHospital } = await supabase
              .from('hospitals')
              .select('name')
              .eq('id', fromHospitalId)
              .single();

            const notificationType: NotificationType = 
              urgency === 'emergency' ? 'emergency' : 
              urgency === 'urgent' ? 'urgent' : 'info';

            const title = urgency === 'emergency' 
              ? '🚨 EMERGENCY Referral Received'
              : urgency === 'urgent'
              ? '⚠️ Urgent Referral Received'
              : 'New Referral Received';

            addNotification({
              title,
              message: `New ${urgency} referral for ${patientName} from ${fromHospital?.name || 'Unknown Hospital'}`,
              type: notificationType,
              referralId,
              patientName,
              fromHospital: fromHospital?.name,
            });

            queryClient.invalidateQueries({ queryKey: ['referrals'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, queryClient, addNotification]);

  return {
    notifications,
    emergencyAlert,
    unreadCount,
    emergencyCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissEmergencyAlert,
    clearNotification,
  };
};
