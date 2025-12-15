-- Create referral_attachments table
CREATE TABLE public.referral_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on referral_attachments
ALTER TABLE public.referral_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_attachments
CREATE POLICY "Users can view attachments for their referrals"
ON public.referral_attachments
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM referrals r
    WHERE r.id = referral_attachments.referral_id
    AND (r.from_hospital_id = get_user_hospital(auth.uid()) OR r.to_hospital_id = get_user_hospital(auth.uid()))
  )
);

CREATE POLICY "Users can upload attachments to their referrals"
ON public.referral_attachments
FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM referrals r
    WHERE r.id = referral_attachments.referral_id
    AND (r.from_hospital_id = get_user_hospital(auth.uid()) OR r.to_hospital_id = get_user_hospital(auth.uid()))
  )
);

CREATE POLICY "Users can delete their own attachments"
ON public.referral_attachments
FOR DELETE
USING (
  uploaded_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create referral_messages table
CREATE TABLE public.referral_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on referral_messages
ALTER TABLE public.referral_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_messages
CREATE POLICY "Users can view messages for their referrals"
ON public.referral_messages
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM referrals r
    WHERE r.id = referral_messages.referral_id
    AND (r.from_hospital_id = get_user_hospital(auth.uid()) OR r.to_hospital_id = get_user_hospital(auth.uid()))
  )
);

CREATE POLICY "Users can send messages to their referrals"
ON public.referral_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM referrals r
    WHERE r.id = referral_messages.referral_id
    AND (r.from_hospital_id = get_user_hospital(auth.uid()) OR r.to_hospital_id = get_user_hospital(auth.uid()))
  )
);

CREATE POLICY "Users can mark messages as read"
ON public.referral_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM referrals r
    WHERE r.id = referral_messages.referral_id
    AND (r.from_hospital_id = get_user_hospital(auth.uid()) OR r.to_hospital_id = get_user_hospital(auth.uid()))
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_messages;

-- Create storage bucket for referral documents
INSERT INTO storage.buckets (id, name, public) VALUES ('referral-documents', 'referral-documents', false);

-- Storage policies for referral-documents bucket
CREATE POLICY "Users can view attachments for their referrals"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'referral-documents' AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM referral_attachments ra
      JOIN referrals r ON r.id = ra.referral_id
      WHERE ra.file_path = name
      AND (r.from_hospital_id = get_user_hospital(auth.uid()) OR r.to_hospital_id = get_user_hospital(auth.uid()))
    )
  )
);

CREATE POLICY "Users can upload attachments to their referrals"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'referral-documents'
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'referral-documents' AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM referral_attachments ra
      WHERE ra.file_path = name AND ra.uploaded_by = auth.uid()
    )
  )
);