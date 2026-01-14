import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SecurityLog {
  id: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  user_id: string | null;
  email: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface UseSecurityLogsOptions {
  eventType?: string;
  limit?: number;
}

export const useSecurityLogs = (options: UseSecurityLogsOptions = {}) => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { eventType, limit = 100 } = options;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setLogs(data as SecurityLog[] || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch security logs';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const logSecurityEvent = async (
    eventType: string,
    details?: Record<string, unknown>,
    email?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/security-logger`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            event_type: eventType,
            user_id: user?.id,
            email: email || user?.email,
            details,
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to log security event');
      }

      return result;
    } catch (err) {
      console.error('Error logging security event:', err);
      throw err;
    }
  };

  const exportLogsAsCSV = () => {
    if (logs.length === 0) {
      toast({
        title: 'No data',
        description: 'No logs to export',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Date', 'Event Type', 'IP Address', 'Email', 'User Agent', 'Details'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        new Date(log.created_at).toISOString(),
        log.event_type,
        log.ip_address || '',
        log.email || '',
        `"${(log.user_agent || '').replace(/"/g, '""')}"`,
        `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `security-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  useEffect(() => {
    fetchLogs();
  }, [eventType, limit]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('security_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_logs',
        },
        (payload) => {
          setLogs((prev) => [payload.new as SecurityLog, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return {
    logs,
    loading,
    error,
    refetch: fetchLogs,
    logSecurityEvent,
    exportLogsAsCSV,
  };
};
