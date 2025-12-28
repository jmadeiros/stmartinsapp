-- Add social link columns to user_profiles table
-- These columns support the enhanced profile page social links feature

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add optional cover image support
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
