-- ============================================
-- PRODUCTION FUNCTION: Atomic Payment + Enrollment
-- This function ensures atomic transaction processing
-- Run this in Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION process_payment_enrollment(
    p_user_id UUID,
    p_course_id UUID,
    p_amount DECIMAL,
    p_currency TEXT,
    p_provider TEXT,
    p_provider_reference TEXT
) RETURNS JSON AS $$
DECLARE
    v_payment_id UUID;
    v_enrollment_id UUID;
    v_existing_enrollment_id UUID;
    v_existing_payment_id UUID;
BEGIN
    -- Check if enrollment already exists
    SELECT id INTO v_existing_enrollment_id
    FROM enrollments
    WHERE user_id = p_user_id
      AND course_id = p_course_id
      AND status = 'active'
    LIMIT 1;

    IF v_existing_enrollment_id IS NOT NULL THEN
        -- Already enrolled, return existing enrollment
        SELECT id INTO v_existing_payment_id
        FROM payments
        WHERE provider_reference = p_provider_reference
        LIMIT 1;

        RETURN json_build_object(
            'success', true,
            'already_enrolled', true,
            'payment_id', v_existing_payment_id,
            'enrollment_id', v_existing_enrollment_id
        );
    END IF;

    -- Check if payment already exists (idempotency)
    SELECT id INTO v_existing_payment_id
    FROM payments
    WHERE provider_reference = p_provider_reference
    LIMIT 1;

    IF v_existing_payment_id IS NOT NULL THEN
        -- Payment already recorded, just create enrollment
        v_payment_id := v_existing_payment_id;
    ELSE
        -- Insert new payment
        INSERT INTO payments (
            user_id, 
            course_id, 
            amount, 
            currency, 
            provider, 
            provider_reference, 
            status, 
            paid_at
        )
        VALUES (
            p_user_id, 
            p_course_id, 
            p_amount, 
            p_currency, 
            p_provider, 
            p_provider_reference, 
            'success', 
            NOW()
        )
        ON CONFLICT (provider_reference) DO NOTHING
        RETURNING id INTO v_payment_id;

        -- If still null (conflict occurred), fetch existing
        IF v_payment_id IS NULL THEN
            SELECT id INTO v_payment_id
            FROM payments
            WHERE provider_reference = p_provider_reference
            LIMIT 1;
        END IF;
    END IF;

    -- Create enrollment (with conflict handling)
    INSERT INTO enrollments (
        user_id, 
        course_id, 
        status
    )
    VALUES (
        p_user_id, 
        p_course_id, 
        'active'
    )
    ON CONFLICT (user_id, course_id) WHERE status = 'active' DO NOTHING
    RETURNING id INTO v_enrollment_id;

    -- If enrollment already exists (race condition), fetch it
    IF v_enrollment_id IS NULL THEN
        SELECT id INTO v_enrollment_id
        FROM enrollments
        WHERE user_id = p_user_id
          AND course_id = p_course_id
          AND status = 'active'
        LIMIT 1;
    END IF;

    -- Return result
    RETURN json_build_object(
        'success', true,
        'already_enrolled', false,
        'payment_id', v_payment_id,
        'enrollment_id', v_enrollment_id
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Log error and re-raise
        RAISE EXCEPTION 'Payment enrollment transaction failed: % (SQLSTATE: %)', 
            SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_payment_enrollment TO authenticated;
GRANT EXECUTE ON FUNCTION process_payment_enrollment TO service_role;

-- Test query (example):
-- SELECT process_payment_enrollment(
--     'user-uuid-here'::UUID,
--     'course-uuid-here'::UUID,
--     1000.00,
--     'NGN',
--     'paystack',
--     'test-reference-123'
-- );

