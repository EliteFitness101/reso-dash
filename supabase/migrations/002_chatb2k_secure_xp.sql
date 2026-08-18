-- ChatB2K™ production hardening
-- Server owns XP values; browser-supplied p_xp_amount is intentionally ignored.

CREATE UNIQUE INDEX IF NOT EXISTS ux_resofit_telemetry_completed_action
  ON public.resofit_action_telemetry (user_id, action_id, event_type)
  WHERE event_type = 'COMPLETE';

CREATE OR REPLACE FUNCTION public.award_member_xp(
    p_user_id UUID,
    p_action_id VARCHAR(100),
    p_action_type VARCHAR(50),
    p_xp_amount INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_xp INT;
    v_new_day INT;
    v_current_day INT;
    v_new_tier member_tier;
    v_reward INT;
    v_rows INT := 0;
BEGIN
    IF (SELECT auth.uid()) IS NULL OR (SELECT auth.uid()) <> p_user_id THEN
        RAISE EXCEPTION 'Unauthorized XP Award Request';
    END IF;

    -- Canonical server-side reward table. Client p_xp_amount is never trusted.
    v_reward := CASE p_action_id
        WHEN 'nba-daily-move-001' THEN 50
        WHEN 'nba-day7-upgrade' THEN 250
        WHEN 'nba-solar-001' THEN 120
        ELSE NULL
    END;

    IF v_reward IS NULL THEN
        RAISE EXCEPTION 'Unknown ChatB2K action: %', p_action_id;
    END IF;

    IF p_action_type NOT IN ('MOVE', 'EAT', 'RECOVER', 'LEARN', 'UPGRADE') THEN
        RAISE EXCEPTION 'Unsupported ChatB2K action type: %', p_action_type;
    END IF;

    INSERT INTO public.resofit_action_telemetry
      (user_id, action_id, action_type, xp_awarded, event_type)
    VALUES
      (p_user_id, p_action_id, p_action_type, v_reward, 'COMPLETE')
    ON CONFLICT (user_id, action_id, event_type) DO NOTHING;

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    SELECT day_count
      INTO v_current_day
      FROM public.resofit_member_states
     WHERE user_id = p_user_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Member state not found';
    END IF;

    IF v_rows = 0 THEN
        SELECT xp_total, day_count, tier
          INTO v_new_xp, v_new_day, v_new_tier
          FROM public.resofit_member_states
         WHERE user_id = p_user_id;

        RETURN jsonb_build_object(
            'success', true,
            'duplicate', true,
            'new_xp', v_new_xp,
            'day_count', v_new_day,
            'tier', v_new_tier
        );
    END IF;

    UPDATE public.resofit_member_states
       SET xp_total = xp_total + v_reward,
           day_count = CASE WHEN p_action_type = 'MOVE' THEN day_count + 1 ELSE day_count END,
           tier = CASE
             WHEN xp_total + v_reward >= 2500 THEN 'Sovereign_Elite'::member_tier
             WHEN xp_total + v_reward >= 900 THEN 'LuxeGold'::member_tier
             ELSE 'Foundation'::member_tier
           END,
           current_phase = CASE
             WHEN (CASE WHEN p_action_type = 'MOVE' THEN day_count + 1 ELSE day_count END) >= 7
               THEN 'day_7_milestone'::journey_phase
             ELSE current_phase
           END,
           updated_at = NOW()
     WHERE user_id = p_user_id
     RETURNING xp_total, day_count, tier INTO v_new_xp, v_new_day, v_new_tier;

    RETURN jsonb_build_object(
      'success', true,
      'duplicate', false,
      'new_xp', v_new_xp,
      'day_count', v_new_day,
      'tier', v_new_tier
    );
END;
$$;

REVOKE ALL ON FUNCTION public.award_member_xp(UUID, VARCHAR, VARCHAR, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_member_xp(UUID, VARCHAR, VARCHAR, INT) TO authenticated;

REVOKE ALL ON TABLE public.resofit_member_states FROM anon;
REVOKE ALL ON TABLE public.resofit_member_states FROM authenticated;
REVOKE ALL ON TABLE public.resofit_action_telemetry FROM anon;
REVOKE ALL ON TABLE public.resofit_action_telemetry FROM authenticated;

GRANT SELECT, INSERT ON TABLE public.resofit_member_states TO authenticated;
GRANT SELECT ON TABLE public.resofit_action_telemetry TO authenticated;

DROP POLICY IF EXISTS "Member state update policy" ON public.resofit_member_states;
CREATE POLICY "Member state update policy" ON public.resofit_member_states
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
