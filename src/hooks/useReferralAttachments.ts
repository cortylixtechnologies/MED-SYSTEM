import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReferralAttachment {
  id: string;
  referral_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
  uploader_name?: string;
}

export const useReferralAttachments = (referralId: string | undefined) => {
  const [attachments, setAttachments] = useState<ReferralAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchAttachments = async () => {
    if (!referralId) return;

    try {
      const { data, error } = await supabase
        .from('referral_attachments')
        .select('*')
        .eq('referral_id', referralId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch uploader names
      if (data && data.length > 0) {
        const uploaderIds = [...new Set(data.map(a => a.uploaded_by))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', uploaderIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
        
        setAttachments(data.map(a => ({
          ...a,
          uploader_name: profileMap.get(a.uploaded_by) || 'Unknown'
        })));
      } else {
        setAttachments([]);
      }
    } catch (error: any) {
      console.error('Error fetching attachments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attachments',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (!referralId) return null;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive'
      });
      return null;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Only PDF and image files are allowed',
        variant: 'destructive'
      });
      return null;
    }

    setUploading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const filePath = `${referralId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('referral-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create attachment record
      const { error: insertError } = await supabase
        .from('referral_attachments')
        .insert({
          referral_id: referralId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: userData.user.id
        });

      if (insertError) throw insertError;

      toast({
        title: 'File uploaded',
        description: `${file.name} uploaded successfully`
      });

      await fetchAttachments();
      return filePath;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive'
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteAttachment = async (attachment: ReferralAttachment) => {
    try {
      // Delete from storage
      await supabase.storage
        .from('referral-documents')
        .remove([attachment.file_path]);

      // Delete record
      const { error } = await supabase
        .from('referral_attachments')
        .delete()
        .eq('id', attachment.id);

      if (error) throw error;

      toast({
        title: 'File deleted',
        description: `${attachment.file_name} deleted successfully`
      });

      await fetchAttachments();
    } catch (error: any) {
      console.error('Error deleting attachment:', error);
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete file',
        variant: 'destructive'
      });
    }
  };

  const getDownloadUrl = async (attachment: ReferralAttachment) => {
    const { data } = await supabase.storage
      .from('referral-documents')
      .createSignedUrl(attachment.file_path, 3600);

    return data?.signedUrl || null;
  };

  useEffect(() => {
    fetchAttachments();
  }, [referralId]);

  return {
    attachments,
    loading,
    uploading,
    uploadFile,
    deleteAttachment,
    getDownloadUrl,
    refetch: fetchAttachments
  };
};
