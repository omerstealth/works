-- StealthWorks Database Schema
-- Run this in Supabase SQL Editor

-- Programs table
create table public.programs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  brand_colors jsonb default '{"accent": "#58A6FF", "bg": "#0D1117", "orange": "#F78166", "green": "#3FB950"}'::jsonb,
  system_prompt text not null,
  eval_criteria jsonb default '[
    {"key": "problem_clarity", "label": "Problem Clarity", "weight": 1},
    {"key": "ai_nativeness", "label": "AI Nativeness", "weight": 2},
    {"key": "technical_depth", "label": "Technical Depth", "weight": 1},
    {"key": "market_awareness", "label": "Market Awareness", "weight": 1},
    {"key": "founder_energy", "label": "Founder Energy", "weight": 1},
    {"key": "program_fit", "label": "Program Fit", "weight": 1}
  ]'::jsonb,
  settings jsonb default '{"max_questions": 12, "languages": ["en", "tr"], "model": "claude-sonnet-4-5-20250929"}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Interviews table
create table public.interviews (
  id uuid default gen_random_uuid() primary key,
  program_id uuid references public.programs(id) on delete cascade not null,
  candidate_name text,
  language text default 'en',
  status text default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  messages jsonb default '[]'::jsonb,
  evaluation jsonb,
  recommendation text,
  overall_score float,
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- Program members (jury)
create table public.program_members (
  id uuid default gen_random_uuid() primary key,
  program_id uuid references public.programs(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'viewer' check (role in ('owner', 'jury', 'viewer')),
  created_at timestamptz default now(),
  unique(program_id, user_id)
);

-- Indexes
create index idx_programs_slug on public.programs(slug);
create index idx_interviews_program on public.interviews(program_id);
create index idx_interviews_status on public.interviews(status);
create index idx_program_members_user on public.program_members(user_id);

-- RLS Policies
alter table public.programs enable row level security;
alter table public.interviews enable row level security;
alter table public.program_members enable row level security;

-- Programs: anyone can read (for public pages), only members can update
create policy "Programs are viewable by everyone"
  on public.programs for select using (true);

create policy "Programs can be created by authenticated users"
  on public.programs for insert
  with check (auth.uid() = created_by);

create policy "Programs can be updated by owners"
  on public.programs for update
  using (
    exists (
      select 1 from public.program_members
      where program_id = programs.id
      and user_id = auth.uid()
      and role = 'owner'
    )
  );

-- Interviews: anyone can create (candidates), only program members can read
create policy "Anyone can start an interview"
  on public.interviews for insert
  with check (true);

create policy "Anyone can update their own in-progress interview"
  on public.interviews for update
  using (status = 'in_progress');

create policy "Program members can view interviews"
  on public.interviews for select
  using (
    exists (
      select 1 from public.program_members
      where program_id = interviews.program_id
      and user_id = auth.uid()
    )
  );

-- Program members: only owners can manage
create policy "Members can view their own memberships"
  on public.program_members for select
  using (user_id = auth.uid());

create policy "Owners can manage members"
  on public.program_members for all
  using (
    exists (
      select 1 from public.program_members pm
      where pm.program_id = program_members.program_id
      and pm.user_id = auth.uid()
      and pm.role = 'owner'
    )
  );
