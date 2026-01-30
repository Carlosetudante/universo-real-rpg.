-- ===========================================
-- UNIVERSO REAL - SCHEMA DO BANCO DE DADOS
-- ===========================================
-- Execute este SQL no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query > Cole e Execute
-- ===========================================

-- 1. PROFILES (Perfil do personagem)
-- ===========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  character_class TEXT DEFAULT 'Equilibrado',
  title TEXT DEFAULT 'Viajante',
  aura_color TEXT DEFAULT '#ffdd57',
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  skill_points INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}',
  achievements TEXT[] DEFAULT '{}',
  inventory JSONB DEFAULT '[]',
  relationship_start TIMESTAMPTZ,
  relationship_photo TEXT,
  financial_goal NUMERIC DEFAULT 0,
  last_claim TIMESTAMPTZ,
  play_time INTEGER DEFAULT 0,
  oracle_personality TEXT DEFAULT 'robot',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Cada usuário vê só os próprios dados
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- 2. TASKS (Tarefas/Quests)
-- ===========================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  xp_reward INTEGER DEFAULT 10,
  due_date DATE,
  category TEXT DEFAULT 'geral',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);


-- 3. FINANCE_TRANSACTIONS (Finanças)
-- ===========================================
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_finance_user_id ON finance_transactions(user_id);
CREATE INDEX idx_finance_type ON finance_transactions(type);
CREATE INDEX idx_finance_created_at ON finance_transactions(created_at);

ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own finances"
  ON finance_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own finances"
  ON finance_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own finances"
  ON finance_transactions FOR DELETE
  USING (auth.uid() = user_id);


-- 4. WORK_SESSIONS (Sessões de Trabalho/Ponto)
-- ===========================================
CREATE TABLE IF NOT EXISTS work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  total_seconds INTEGER DEFAULT 0,
  activity_type TEXT DEFAULT 'work',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX idx_work_sessions_start_at ON work_sessions(start_at);

ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own work sessions"
  ON work_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own work sessions"
  ON work_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work sessions"
  ON work_sessions FOR UPDATE
  USING (auth.uid() = user_id);


-- 5. XP_EVENTS (Histórico de XP)
-- ===========================================
CREATE TABLE IF NOT EXISTS xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  delta_xp INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_xp_events_user_id ON xp_events(user_id);
CREATE INDEX idx_xp_events_created_at ON xp_events(created_at);

ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xp events"
  ON xp_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp events"
  ON xp_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- 6. ORACLE_MESSAGES (Mensagens do Oráculo/Chat)
-- ===========================================
CREATE TABLE IF NOT EXISTS oracle_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oracle_messages_user_id ON oracle_messages(user_id);
CREATE INDEX idx_oracle_messages_created_at ON oracle_messages(created_at);

ALTER TABLE oracle_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own oracle messages"
  ON oracle_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oracle messages"
  ON oracle_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- 7. ORACLE_MEMORY (Memória do Oráculo)
-- ===========================================
CREATE TABLE IF NOT EXISTS oracle_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  fact TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oracle_memory_user_id ON oracle_memory(user_id);
CREATE INDEX idx_oracle_memory_tags ON oracle_memory USING GIN(tags);
CREATE INDEX idx_oracle_memory_importance ON oracle_memory(importance);

ALTER TABLE oracle_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own oracle memory"
  ON oracle_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oracle memory"
  ON oracle_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oracle memory"
  ON oracle_memory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own oracle memory"
  ON oracle_memory FOR DELETE
  USING (auth.uid() = user_id);


-- 8. BILLS (Contas a Pagar)
-- ===========================================
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  recurrence TEXT DEFAULT 'once', -- once, monthly, weekly
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_due_date ON bills(due_date);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bills"
  ON bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bills"
  ON bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bills"
  ON bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bills"
  ON bills FOR DELETE
  USING (auth.uid() = user_id);


-- 9. FINANCE_GROUPS (Grupos de Categorias)
-- ===========================================
CREATE TABLE IF NOT EXISTS finance_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  color TEXT DEFAULT '#60a5fa',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE finance_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own finance groups"
  ON finance_groups FOR ALL
  USING (auth.uid() = user_id);


-- ===========================================
-- FUNÇÃO: Criar perfil automaticamente no signup
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, character_name, character_class)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'character_name', 'Novo Herói'),
    COALESCE(NEW.raw_user_meta_data->>'character_class', 'Equilibrado')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil no signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ===========================================
-- VIEWS ÚTEIS (Opcionais)
-- ===========================================

-- View: Resumo financeiro do mês
CREATE OR REPLACE VIEW monthly_finance_summary AS
SELECT 
  user_id,
  DATE_TRUNC('month', created_at) as month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as balance
FROM finance_transactions
GROUP BY user_id, DATE_TRUNC('month', created_at);

-- View: XP ganho por dia
CREATE OR REPLACE VIEW daily_xp_summary AS
SELECT 
  user_id,
  DATE(created_at) as date,
  SUM(delta_xp) as total_xp,
  COUNT(*) as events_count
FROM xp_events
GROUP BY user_id, DATE(created_at);


-- ===========================================
-- ✅ PRONTO! Agora configure no Supabase:
-- 1. Authentication > Providers > Ative Email
-- 2. Authentication > URL Configuration > Site URL
-- ===========================================

SELECT 'Schema criado com sucesso! 🚀' as status;
