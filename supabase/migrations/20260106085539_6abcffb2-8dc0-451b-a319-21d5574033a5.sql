-- Fix security vulnerabilities by requiring authentication for sensitive tables

-- 1. Drop public access policies on profiles table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new policy requiring authentication to view profiles
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 2. Drop public access policies on hospitals table  
DROP POLICY IF EXISTS "Anyone can view hospitals" ON public.hospitals;

-- Create new policy requiring authentication to view hospitals
CREATE POLICY "Authenticated users can view hospitals" 
ON public.hospitals 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Drop public access policies on doctor_reviews table
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.doctor_reviews;

-- Create new policy requiring authentication to view reviews
CREATE POLICY "Authenticated users can view reviews" 
ON public.doctor_reviews 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 4. Update referral_templates policy to require authentication
DROP POLICY IF EXISTS "Users can view system templates and own templates" ON public.referral_templates;

-- Create new policy requiring authentication for all template access
CREATE POLICY "Authenticated users can view system templates and own templates" 
ON public.referral_templates 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (is_system = true OR created_by = auth.uid())
);