-- Ajouter le score viral et le prompt d'image aux contenus générés
alter table public.generated_content
  add column if not exists viral_score integer default 0,
  add column if not exists image_prompt text default '';

-- Index sur created_at pour les requêtes par semaine
create index if not exists generated_content_created_at_idx
  on public.generated_content(created_at desc);
