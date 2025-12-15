import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReferralMessage {
  id: string;
  referral_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

export const useReferralMessages = (referralId: string | undefined) => {
  const [messages, setMessages] = useState<ReferralMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const fetchMessages = async () => {
    if (!referralId) return;

    try {
      const { data, error } = await supabase
        .from('referral_messages')
        .select('*')
        .eq('referral_id', referralId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch sender names
      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', senderIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
        
        setMessages(data.map(m => ({
          ...m,
          sender_name: profileMap.get(m.sender_id) || 'Unknown'
        })));
      } else {
        setMessages([]);
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!referralId || !messageText.trim()) return false;

    setSending(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('referral_messages')
        .insert({
          referral_id: referralId,
          sender_id: userData.user.id,
          message: messageText.trim()
        });

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Send failed',
        description: error.message || 'Failed to send message',
        variant: 'destructive'
      });
      return false;
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    try {
      await supabase
        .from('referral_messages')
        .update({ is_read: true })
        .in('id', messageIds);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Set up real-time subscription
    if (referralId) {
      const channel = supabase
        .channel(`referral-messages-${referralId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'referral_messages',
            filter: `referral_id=eq.${referralId}`
          },
          async (payload) => {
            // Fetch sender name for new message
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', payload.new.sender_id)
              .single();

            const newMessage: ReferralMessage = {
              ...(payload.new as any),
              sender_name: profile?.full_name || 'Unknown'
            };

            setMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [referralId]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    markAsRead,
    refetch: fetchMessages
  };
};
