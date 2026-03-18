-- Migration script to add missing UTM columns to users table
-- Run this in Supabase SQL Editor if your database was created before these columns were added
-- This fixes the P2022 error: "The column (not available) does not exist"

-- Add UTM columns if they don't exist
DO $$
BEGIN
    -- Add utmSource column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'utmSource'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "utmSource" TEXT;
        RAISE NOTICE 'Added utmSource column';
    END IF;

    -- Add utmMedium column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'utmMedium'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "utmMedium" TEXT;
        RAISE NOTICE 'Added utmMedium column';
    END IF;

    -- Add utmCampaign column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'utmCampaign'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "utmCampaign" TEXT;
        RAISE NOTICE 'Added utmCampaign column';
    END IF;

    -- Add utmTerm column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'utmTerm'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "utmTerm" TEXT;
        RAISE NOTICE 'Added utmTerm column';
    END IF;

    -- Add utmContent column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'utmContent'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "utmContent" TEXT;
        RAISE NOTICE 'Added utmContent column';
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND column_name IN ('utmSource', 'utmMedium', 'utmCampaign', 'utmTerm', 'utmContent')
ORDER BY column_name;
