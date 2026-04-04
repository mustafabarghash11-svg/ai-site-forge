
CREATE TABLE public.project_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, table_name)
);

ALTER TABLE public.project_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project tables"
ON public.project_tables FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_tables.project_id AND user_id = auth.uid())
);

CREATE POLICY "Users can create own project tables"
ON public.project_tables FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_tables.project_id AND user_id = auth.uid())
);

CREATE POLICY "Users can update own project tables"
ON public.project_tables FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_tables.project_id AND user_id = auth.uid())
);

CREATE POLICY "Users can delete own project tables"
ON public.project_tables FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_tables.project_id AND user_id = auth.uid())
);
