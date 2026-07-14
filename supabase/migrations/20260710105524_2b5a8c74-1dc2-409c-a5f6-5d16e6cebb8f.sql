
CREATE TABLE public.submissions (
  email TEXT PRIMARY KEY,
  data_a TEXT,
  data_b TEXT,
  a_saved_at TIMESTAMPTZ,
  b_saved_at TIMESTAMPTZ,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (via server-side admin client) can access.
