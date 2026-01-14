-- Create security_logs table for tracking all security events
CREATE TABLE public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id UUID,
  email TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blocked_ips table for IP blocking
CREATE TABLE public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_by UUID,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create index for faster lookups
CREATE INDEX idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX idx_security_logs_ip_address ON public.security_logs(ip_address);
CREATE INDEX idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX idx_blocked_ips_ip_address ON public.blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_is_active ON public.blocked_ips(is_active);

-- Enable RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_logs - only admins can view
CREATE POLICY "Admins can view security logs"
ON public.security_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow edge functions to insert logs (service role)
CREATE POLICY "Service can insert security logs"
ON public.security_logs
FOR INSERT
WITH CHECK (true);

-- RLS policies for blocked_ips
CREATE POLICY "Admins can view blocked IPs"
ON public.blocked_ips
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage blocked IPs"
ON public.blocked_ips
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blocked IPs"
ON public.blocked_ips
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blocked IPs"
ON public.blocked_ips
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow public read for blocked IP check (needed for edge functions)
CREATE POLICY "Public can check if IP is blocked"
ON public.blocked_ips
FOR SELECT
USING (is_active = true);