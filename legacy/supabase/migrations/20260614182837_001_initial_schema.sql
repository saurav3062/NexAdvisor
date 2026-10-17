-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'expert', 'admin')),
  avatar TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert" ON public.users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES public.categories(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_all" ON public.categories FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "categories_admin_all" ON public.categories FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Experts table
CREATE TABLE public.experts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  title TEXT NOT NULL,
  bio TEXT NOT NULL,
  short_bio TEXT,
  hourly_rate DECIMAL(10,2) NOT NULL,
  session_duration INTEGER DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'away', 'busy', 'offline')),
  featured BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  total_consultations INTEGER DEFAULT 0,
  years_of_experience INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 100,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  company TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "experts_select_all" ON public.experts FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "experts_insert_own" ON public.experts FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "experts_update_own" ON public.experts FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Expert skills
CREATE TABLE public.expert_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'expert')),
  years_of_experience INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.expert_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expert_skills_select" ON public.expert_skills FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "expert_skills_manage" ON public.expert_skills FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.experts WHERE id = expert_id AND user_id = auth.uid())
  );

-- Expert certifications
CREATE TABLE public.expert_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  credential_id TEXT,
  credential_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.expert_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expert_certs_select" ON public.expert_certifications FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "expert_certs_manage" ON public.expert_certifications FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.experts WHERE id = expert_id AND user_id = auth.uid())
  );

-- Expert education
CREATE TABLE public.expert_education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.expert_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expert_edu_select" ON public.expert_education FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "expert_edu_manage" ON public.expert_education FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.experts WHERE id = expert_id AND user_id = auth.uid())
  );

-- Expert languages
CREATE TABLE public.expert_languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  proficiency TEXT NOT NULL CHECK (proficiency IN ('basic', 'conversational', 'fluent', 'native')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.expert_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expert_lang_select" ON public.expert_languages FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "expert_lang_manage" ON public.expert_languages FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.experts WHERE id = expert_id AND user_id = auth.uid())
  );

-- Expert availability
CREATE TABLE public.expert_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  buffer_time INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(expert_id, day_of_week)
);

ALTER TABLE public.expert_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expert_avail_select" ON public.expert_availability FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "expert_avail_manage" ON public.expert_availability FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.experts WHERE id = expert_id AND user_id = auth.uid())
  );

-- Expert services
CREATE TABLE public.expert_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  max_participants INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.expert_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expert_services_select" ON public.expert_services FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "expert_services_manage" ON public.expert_services FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.experts WHERE id = expert_id AND user_id = auth.uid())
  );

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID NOT NULL REFERENCES public.experts(id),
  client_id UUID NOT NULL REFERENCES public.users(id),
  service_id UUID REFERENCES public.expert_services(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_intent_id TEXT,
  location_type TEXT DEFAULT 'online' CHECK (location_type IN ('online', 'in_person')),
  meeting_url TEXT,
  notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.users(id),
  cancellation_reason TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_select_own" ON public.bookings FOR SELECT
  TO authenticated USING (client_id = auth.uid() OR expert_id IN (
    SELECT id FROM public.experts WHERE user_id = auth.uid()
  ));

CREATE POLICY "bookings_insert" ON public.bookings FOR INSERT
  TO authenticated WITH CHECK (client_id = auth.uid());

CREATE POLICY "bookings_update_expert" ON public.bookings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.experts WHERE id = expert_id AND user_id = auth.uid())
  );

CREATE POLICY "bookings_update_client" ON public.bookings FOR UPDATE
  TO authenticated USING (client_id = auth.uid());

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES public.experts(id),
  client_id UUID NOT NULL REFERENCES public.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  expert_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_public" ON public.reviews FOR SELECT
  TO authenticated USING (is_public = TRUE OR client_id = auth.uid() OR expert_id IN (
    SELECT id FROM public.experts WHERE user_id = auth.uid()
  ));

CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT
  TO authenticated WITH CHECK (client_id = auth.uid());

CREATE POLICY "reviews_update_expert" ON public.reviews FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.experts WHERE id = expert_id AND user_id = auth.uid())
  );

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  refund_amount DECIMAL(10,2),
  refunded_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own" ON public.payments FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR booking_id IN (
    SELECT id FROM public.bookings WHERE expert_id IN (
      SELECT id FROM public.experts WHERE user_id = auth.uid()
    )
  ));

-- Conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID NOT NULL REFERENCES public.experts(id),
  client_id UUID NOT NULL REFERENCES public.users(id),
  booking_id UUID REFERENCES public.bookings(id),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(expert_id, client_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select_participant" ON public.conversations FOR SELECT
  TO authenticated USING (client_id = auth.uid() OR expert_id IN (
    SELECT id FROM public.experts WHERE user_id = auth.uid()
  ));

CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT
  TO authenticated WITH CHECK (client_id = auth.uid());

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file')),
  file_url TEXT,
  file_name TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_participant" ON public.messages FOR SELECT
  TO authenticated USING (conversation_id IN (
    SELECT id FROM public.conversations 
    WHERE client_id = auth.uid() OR expert_id IN (
      SELECT id FROM public.experts WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "messages_insert" ON public.messages FOR INSERT
  TO authenticated WITH CHECK (sender_id = auth.uid() AND conversation_id IN (
    SELECT id FROM public.conversations 
    WHERE client_id = auth.uid() OR expert_id IN (
      SELECT id FROM public.experts WHERE user_id = auth.uid()
    )
  ));

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid());

-- Favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, expert_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_own" ON public.favorites FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "favorites_insert" ON public.favorites FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_delete_own" ON public.favorites FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experts_updated_at BEFORE UPDATE ON public.experts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_experts_category ON public.experts(category_id);
CREATE INDEX idx_experts_status ON public.experts(status);
CREATE INDEX idx_experts_featured ON public.experts(featured);
CREATE INDEX idx_experts_rating ON public.experts(rating DESC);
CREATE INDEX idx_bookings_expert ON public.bookings(expert_id);
CREATE INDEX idx_bookings_client ON public.bookings(client_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_start_time ON public.bookings(start_time);
CREATE INDEX idx_reviews_expert ON public.reviews(expert_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read_at);