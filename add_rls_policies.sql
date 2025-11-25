-- Add permissive RLS policies for development
-- These allow all authenticated and anonymous users to read data
-- You can make these more restrictive later

BEGIN;

-- Posts policies
CREATE POLICY "Allow public read access to posts"
  ON public.posts
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Events policies
CREATE POLICY "Allow public read access to events"
  ON public.events
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert events"
  ON public.events
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Projects policies
CREATE POLICY "Allow public read access to projects"
  ON public.projects
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- User profiles policies
CREATE POLICY "Allow public read access to profiles"
  ON public.user_profiles
  FOR SELECT
  USING (true);

-- Organizations policies
CREATE POLICY "Allow public read access to organizations"
  ON public.organizations
  FOR SELECT
  USING (true);

COMMIT;
