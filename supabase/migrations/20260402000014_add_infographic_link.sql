-- Link infographics to their parent content variation.
-- The HTML is stored on the same row instead of creating a separate row,
-- so the dashboard can show "View infographic" inline on each variation.
ALTER TABLE public.generated_content
ADD COLUMN IF NOT EXISTS infographic_html TEXT,
ADD COLUMN IF NOT EXISTS infographic_generated_at TIMESTAMPTZ;
