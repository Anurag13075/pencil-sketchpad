CREATE TABLE public.gallery_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid REFERENCES public.boards(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description text CHECK (char_length(description) <= 600),
  author_name text NOT NULL DEFAULT 'Anonymous' CHECK (char_length(author_name) BETWEEN 1 AND 60),
  owner_key text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  like_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.gallery_posts TO anon, authenticated;
GRANT ALL ON public.gallery_posts TO service_role;
ALTER TABLE public.gallery_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gallery readable" ON public.gallery_posts FOR SELECT USING (true);
CREATE POLICY "Gallery insertable" ON public.gallery_posts FOR INSERT WITH CHECK (like_count = 0 AND comment_count = 0);

CREATE TABLE public.gallery_likes (
  post_id uuid NOT NULL REFERENCES public.gallery_posts(id) ON DELETE CASCADE,
  owner_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, owner_key)
);
GRANT SELECT, INSERT, DELETE ON public.gallery_likes TO anon, authenticated;
GRANT ALL ON public.gallery_likes TO service_role;
ALTER TABLE public.gallery_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes readable" ON public.gallery_likes FOR SELECT USING (true);
CREATE POLICY "Likes insertable" ON public.gallery_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Likes deletable" ON public.gallery_likes FOR DELETE USING (true);

CREATE TABLE public.gallery_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.gallery_posts(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Anonymous' CHECK (char_length(author_name) BETWEEN 1 AND 60),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.gallery_comments TO anon, authenticated;
GRANT ALL ON public.gallery_comments TO service_role;
ALTER TABLE public.gallery_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments readable" ON public.gallery_comments FOR SELECT USING (true);
CREATE POLICY "Comments insertable" ON public.gallery_comments FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.gallery_sync_counts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid := COALESCE(NEW.post_id, OLD.post_id);
BEGIN
  UPDATE public.gallery_posts SET
    like_count = (SELECT count(*) FROM public.gallery_likes WHERE post_id = pid),
    comment_count = (SELECT count(*) FROM public.gallery_comments WHERE post_id = pid)
  WHERE id = pid;
  RETURN NULL;
END $$;
CREATE TRIGGER gallery_likes_count AFTER INSERT OR DELETE ON public.gallery_likes FOR EACH ROW EXECUTE FUNCTION public.gallery_sync_counts();
CREATE TRIGGER gallery_comments_count AFTER INSERT OR DELETE ON public.gallery_comments FOR EACH ROW EXECUTE FUNCTION public.gallery_sync_counts();
CREATE INDEX ON public.gallery_posts (created_at DESC);
CREATE INDEX ON public.gallery_comments (post_id, created_at);