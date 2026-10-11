-- ============================================================================
-- RASHY: YouTube videos (replaces the blog)
--
-- Run once: Supabase dashboard > SQL Editor > New query > paste this file > Run.
-- Safe to run again. After this, add videos in the admin panel: Videos > Add Video.
--
-- The old blog_posts table is not touched. If you want it gone later, run:
--   DROP TABLE IF EXISTS public.blog_posts;
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  youtube_id text NOT NULL CHECK (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),  -- the 11 characters after v= in a YouTube link
  description text,
  sort_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_videos_updated_at ON public.videos;
CREATE TRIGGER trg_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Visitors see published videos only; the admin sees and edits everything
DROP POLICY IF EXISTS "Public can view published videos" ON public.videos;
CREATE POLICY "Public can view published videos"
ON public.videos FOR SELECT
USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin full access on videos" ON public.videos;
CREATE POLICY "Admin full access on videos"
ON public.videos FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_videos_order ON public.videos (sort_order, created_at DESC);

-- Check: should return 0 rows now (no videos yet), and rls_on = true
SELECT (SELECT count(*) FROM public.videos) AS videos,
       (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.videos'::regclass) AS rls_on;
