import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_by: string | null;
  blocked_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export const useIPBlocking = () => {
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBlockedIPs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blocked_ips')
        .select('*')
        .order('blocked_at', { ascending: false });

      if (error) throw error;
      setBlockedIPs(data as BlockedIP[] || []);
    } catch (err) {
      console.error('Error fetching blocked IPs:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch blocked IPs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const blockIP = async (ipAddress: string, reason: string, expiresIn?: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const expiresAt = expiresIn 
        ? new Date(Date.now() + expiresIn * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('blocked_ips')
        .upsert({
          ip_address: ipAddress,
          reason,
          blocked_by: user?.id,
          blocked_at: new Date().toISOString(),
          expires_at: expiresAt,
          is_active: true,
        }, { onConflict: 'ip_address' });

      if (error) throw error;

      toast({
        title: 'IP Blocked',
        description: `${ipAddress} has been blocked${expiresIn ? ` for ${expiresIn} hours` : ' permanently'}`,
      });

      fetchBlockedIPs();
    } catch (err) {
      console.error('Error blocking IP:', err);
      toast({
        title: 'Error',
        description: 'Failed to block IP address',
        variant: 'destructive',
      });
    }
  };

  const unblockIP = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocked_ips')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'IP Unblocked',
        description: 'The IP address has been unblocked',
      });

      fetchBlockedIPs();
    } catch (err) {
      console.error('Error unblocking IP:', err);
      toast({
        title: 'Error',
        description: 'Failed to unblock IP address',
        variant: 'destructive',
      });
    }
  };

  const deleteBlock = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocked_ips')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Block Removed',
        description: 'The block record has been deleted',
      });

      fetchBlockedIPs();
    } catch (err) {
      console.error('Error deleting block:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete block record',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchBlockedIPs();
  }, []);

  return {
    blockedIPs,
    activeBlocks: blockedIPs.filter(ip => ip.is_active),
    loading,
    blockIP,
    unblockIP,
    deleteBlock,
    refetch: fetchBlockedIPs,
  };
};
