-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor');

-- Create enum for urgency levels
CREATE TYPE public.urgency_level AS ENUM ('emergency', 'urgent', 'routine');

-- Create enum for referral status
CREATE TYPE public.referral_status AS ENUM ('pending', 'accepted', 'in_treatment', 'completed', 'rejected', 'more_info_requested');

-- Create hospitals table
CREATE TABLE public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create profiles table for doctors
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  specialty TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  patient_age INTEGER NOT NULL,
  patient_contact TEXT,
  patient_medical_id TEXT,
  medical_summary TEXT NOT NULL,
  reason TEXT NOT NULL,
  urgency urgency_level NOT NULL DEFAULT 'routine',
  status referral_status NOT NULL DEFAULT 'pending',
  from_hospital_id UUID NOT NULL REFERENCES public.hospitals(id),
  to_hospital_id UUID NOT NULL REFERENCES public.hospitals(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_doctor_id UUID REFERENCES auth.users(id),
  patient_code TEXT UNIQUE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create activity logs table
CREATE TABLE public.referral_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's hospital
CREATE OR REPLACE FUNCTION public.get_user_hospital(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hospital_id FROM public.profiles WHERE id = _user_id
$$;

-- Hospitals policies (everyone can read, only admins can modify)
CREATE POLICY "Anyone can view hospitals" ON public.hospitals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert hospitals" ON public.hospitals FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update hospitals" ON public.hospitals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete hospitals" ON public.hospitals FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR id = auth.uid());
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Referrals policies
CREATE POLICY "Doctors can view referrals from/to their hospital" ON public.referrals FOR SELECT TO authenticated 
USING (
  public.has_role(auth.uid(), 'admin') OR
  from_hospital_id = public.get_user_hospital(auth.uid()) OR 
  to_hospital_id = public.get_user_hospital(auth.uid())
);
CREATE POLICY "Doctors can create referrals from their hospital" ON public.referrals FOR INSERT TO authenticated 
WITH CHECK (from_hospital_id = public.get_user_hospital(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Doctors can update referrals they're involved in" ON public.referrals FOR UPDATE TO authenticated 
USING (
  public.has_role(auth.uid(), 'admin') OR
  created_by = auth.uid() OR 
  to_hospital_id = public.get_user_hospital(auth.uid())
);

-- Activity logs policies
CREATE POLICY "Users can view logs for their referrals" ON public.referral_activity_logs FOR SELECT TO authenticated 
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.referrals r 
    WHERE r.id = referral_id 
    AND (r.from_hospital_id = public.get_user_hospital(auth.uid()) OR r.to_hospital_id = public.get_user_hospital(auth.uid()))
  )
);
CREATE POLICY "Authenticated users can insert logs" ON public.referral_activity_logs FOR INSERT TO authenticated 
WITH CHECK (performed_by = auth.uid());

-- Function to generate patient code
CREATE OR REPLACE FUNCTION public.generate_patient_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'REF-';
  i INTEGER;
BEGIN
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for referrals
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;