-- Add approval_status to user_profiles for admin approval workflow
-- Users completing onboarding will be set to 'pending' until admin approves

-- Create the enum type
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Add approval_status column with default 'approved' for existing users
ALTER TABLE public.user_profiles
ADD COLUMN approval_status public.approval_status DEFAULT 'approved' NOT NULL;

-- Add index for efficient queries on pending users
CREATE INDEX idx_user_profiles_approval_status
ON public.user_profiles(approval_status)
WHERE approval_status = 'pending';

-- Add audit columns for tracking who approved/rejected and when
ALTER TABLE public.user_profiles
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN rejection_reason TEXT;

-- Comment for documentation
COMMENT ON COLUMN public.user_profiles.approval_status IS 'User account approval status: pending (awaiting admin review), approved (full access), rejected (access denied)';
COMMENT ON COLUMN public.user_profiles.approved_at IS 'Timestamp when the user was approved';
COMMENT ON COLUMN public.user_profiles.approved_by IS 'Admin user ID who approved/rejected this user';
COMMENT ON COLUMN public.user_profiles.rejection_reason IS 'Reason provided when rejecting user application';
