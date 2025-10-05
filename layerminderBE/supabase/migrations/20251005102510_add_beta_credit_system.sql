-- 1. New User -> Add 50 credits 

CREATE OR REPLACE FUNCTION public.init_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    -- 1) init 50 in credits table
    INSERT INTO public.credits (user_id, credits)
    VALUES (NEW.id, 50);

    -- 2) leave a log
    INSERT INTO public.credit_events (user_id, delta, event_type, reason)
    VALUES (NEW.id, 50, 'signup_bonus', 'Beta user initial credits');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auth.users after insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.init_user_credits();

-- 2. On Credit Usage: Deduct credits and log the event
CREATE OR REPLACE FUNCTION public.consume_credit(
    p_user_id UUID,
    p_amount INT DEFAULT 1,
    p_reason TEXT DEFAULT 'Image generation'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_credits INT;
BEGIN
    -- 1) Check current credits
    SELECT credits INTO v_current_credits 
    FROM public.credits 
    WHERE user_id = p_user_id
    FOR UPDATE; -- Lock the row for update

    -- 2) If not enough credits, return false
    IF v_current_credits IS NULL or v_current_credits < p_amount THEN
        RETURN FALSE;
    END IF;

    -- 3) Deduct credits
    UPDATE public.credits
    SET credits = credits - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- 4) Log the event
    INSERT INTO public.credit_events (user_id, delta, event_type, reason)
    VALUES (p_user_id, -p_amount, 'consumption', p_reason);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get Current Credits
CREATE OR REPLACE FUNCTION public.get_user_credits(p_user_id UUID)
RETURNS INT AS $$
DECLARE
    v_credits INT;
BEGIN
    SELECT credits INTO v_credits
    FROM public.credits
    WHERE user_id = p_user_id;

    RETURN COALESCE(v_credits, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Get OG users credits
INSERT INTO public.credits (user_id, credits)
SELECT id, 50
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.credits)
ON CONFLICT (user_id) DO NOTHING;

-- 4.1. log OG users credits
INSERT INTO public.credit_events (user_id, delta, event_type, reason)
SELECT id, 50, 'migration_bonus', 'Beta credit migration'
FROM auth.users
WHERE id NOT IN (
    SELECT user_id FROM public.credit_events WHERE event_type = 'migration_bonus'
);

-- 5. Giving Auth Role to the functions
GRANT EXECUTE ON FUNCTION public.consume_credit TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_credits TO authenticated;

-- RLS for credits table
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits" 
    ON public.credits FOR SELECT
    USING (user_id = auth.uid());