-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('pending', 'in_progress', 'completed', 'delayed', 'cancelled');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'completed', 'blocked');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'producer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT NOT NULL DEFAULT 'tamil',
    "status" TEXT NOT NULL DEFAULT 'planning',
    "budget" DECIMAL(12,2),
    "genre" TEXT,
    "director_style" TEXT,
    "default_lenses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "start_date" DATE,
    "end_date" DATE,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scripts" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_path" TEXT,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "content" TEXT,
    "language" TEXT DEFAULT 'tamil',
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_versions" (
    "id" TEXT NOT NULL,
    "script_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "change_note" TEXT,
    "extraction_score" INTEGER,
    "raw_text_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "script_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_text_blocks" (
    "id" TEXT NOT NULL,
    "script_id" TEXT NOT NULL,
    "page_number" INTEGER NOT NULL,
    "line_start" INTEGER NOT NULL,
    "line_end" INTEGER NOT NULL,
    "block_type" TEXT NOT NULL,
    "raw_text" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "script_text_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenes" (
    "id" TEXT NOT NULL,
    "script_id" TEXT NOT NULL,
    "scene_number" TEXT NOT NULL,
    "scene_index" INTEGER NOT NULL,
    "heading_raw" TEXT,
    "location" TEXT,
    "location_tamil" TEXT,
    "time_of_day" TEXT,
    "int_ext" TEXT,
    "description" TEXT,
    "description_tamil" TEXT,
    "start_line" INTEGER,
    "end_line" INTEGER,
    "page_start" INTEGER,
    "page_end" INTEGER,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimated_duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_elements" (
    "id" TEXT NOT NULL,
    "scene_id" TEXT NOT NULL,
    "element_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_tamil" TEXT,
    "description" TEXT,
    "is_speaking" BOOLEAN NOT NULL DEFAULT false,
    "is_background" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scene_elements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_tamil" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "actor_name" TEXT,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "role_hint" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_characters" (
    "id" TEXT NOT NULL,
    "scene_id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "is_speaking" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "scene_characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_locations" (
    "id" TEXT NOT NULL,
    "scene_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "details" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "scene_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "props" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "props_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_props" (
    "id" TEXT NOT NULL,
    "scene_id" TEXT NOT NULL,
    "prop_id" TEXT NOT NULL,
    "quantity_hint" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "scene_props_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vfx_notes" (
    "id" TEXT NOT NULL,
    "scene_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vfx_type" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "vfx_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warnings" (
    "id" TEXT NOT NULL,
    "scene_id" TEXT NOT NULL,
    "warning_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'low',

    CONSTRAINT "warnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shots" (
    "id" TEXT NOT NULL,
    "scene_id" TEXT NOT NULL,
    "shot_index" INTEGER NOT NULL,
    "beat_index" INTEGER NOT NULL,
    "shot_text" TEXT NOT NULL,
    "characters" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "shot_size" TEXT,
    "camera_angle" TEXT,
    "camera_movement" TEXT,
    "focal_length_mm" INTEGER,
    "lens_type" TEXT,
    "key_style" TEXT,
    "color_temp" TEXT,
    "duration_est_sec" DOUBLE PRECISION,
    "confidence_camera" DOUBLE PRECISION,
    "confidence_lens" DOUBLE PRECISION,
    "confidence_lighting" DOUBLE PRECISION,
    "confidence_duration" DOUBLE PRECISION,
    "importance" INTEGER DEFAULT 3,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "user_edited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shot_suggestions" (
    "id" TEXT NOT NULL,
    "shot_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "suggestion" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_accepted" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shot_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storyboard_frames" (
    "id" TEXT NOT NULL,
    "shot_id" TEXT NOT NULL,
    "image_url" TEXT,
    "prompt" TEXT,
    "style" TEXT NOT NULL DEFAULT 'cleanLineArt',
    "seed" INTEGER,
    "variation" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "director_notes" TEXT,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storyboard_frames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_tamil" TEXT,
    "address" TEXT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "place_type" TEXT,
    "notes" TEXT,
    "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "center_lat" DECIMAL(65,30) NOT NULL,
    "center_lng" DECIMAL(65,30) NOT NULL,
    "radius_km" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_intents" (
    "id" TEXT NOT NULL,
    "scene_id" TEXT NOT NULL,
    "region_id" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "terrain_type" TEXT,
    "required_features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "avoid_features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "time_of_day" TEXT,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "intent_id" TEXT NOT NULL,
    "name" TEXT,
    "latitude" DECIMAL(65,30) NOT NULL,
    "longitude" DECIMAL(65,30) NOT NULL,
    "osm_id" TEXT,
    "place_type" TEXT,
    "score_total" DOUBLE PRECISION NOT NULL,
    "score_water" DOUBLE PRECISION,
    "score_green" DOUBLE PRECISION,
    "score_access" DOUBLE PRECISION,
    "score_locality" DOUBLE PRECISION,
    "score_flat" DOUBLE PRECISION,
    "risk_flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "explanation" TEXT,
    "travel_time_min" DOUBLE PRECISION,
    "distance_km" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_enrichments" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "enrich_type" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "candidate_enrichments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scout_feedback" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "notes" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scout_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verified_locations" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DECIMAL(65,30) NOT NULL,
    "longitude" DECIMAL(65,30) NOT NULL,
    "address" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),

    CONSTRAINT "verified_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scout_plans" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "export_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scout_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shooting_days" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "scheduled_date" TIMESTAMP(3),
    "call_time" TEXT,
    "location_id" TEXT,
    "estimated_hours" DECIMAL(65,30),
    "weather_data" JSONB,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shooting_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_scenes" (
    "id" TEXT NOT NULL,
    "shooting_day_id" TEXT NOT NULL,
    "scene_id" TEXT NOT NULL,
    "order_number" INTEGER,
    "estimated_minutes" INTEGER,
    "actual_minutes" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "day_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cast_availability" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "date_start" TIMESTAMP(3) NOT NULL,
    "date_end" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "notes" TEXT,

    CONSTRAINT "cast_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew_constraints" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "crew_id" TEXT NOT NULL,
    "date_start" TIMESTAMP(3) NOT NULL,
    "date_end" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unavailable',
    "notes" TEXT,

    CONSTRAINT "crew_constraints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_rentals" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "date_start" TIMESTAMP(3) NOT NULL,
    "date_end" TIMESTAMP(3) NOT NULL,
    "daily_rate" DECIMAL(65,30) NOT NULL,
    "vendor" TEXT,
    "notes" TEXT,

    CONSTRAINT "equipment_rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_versions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "version_num" INTEGER NOT NULL,
    "label" TEXT,
    "summary_text" TEXT,
    "data" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "description" TEXT,
    "quantity" DECIMAL(65,30),
    "unit" TEXT,
    "rate" DECIMAL(65,30),
    "rate_low" DECIMAL(65,30),
    "rate_high" DECIMAL(65,30),
    "tax_rate" DECIMAL(65,30),
    "total" DECIMAL(65,30),
    "actual_cost" DECIMAL(65,30),
    "source" TEXT NOT NULL DEFAULT 'manual',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_versions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "version_num" INTEGER NOT NULL,
    "label" TEXT,
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_categories" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "budget_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "vendor" TEXT,
    "receipt_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "expense_id" TEXT NOT NULL,
    "approver_role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts_rates" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "item_desc" TEXT NOT NULL,
    "contracted_rate" DECIMAL(65,30) NOT NULL,
    "unit" TEXT,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),

    CONSTRAINT "contracts_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmarks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "avg_rate" DECIMAL(65,30) NOT NULL,
    "min_rate" DECIMAL(65,30),
    "max_rate" DECIMAL(65,30),
    "source" TEXT,

    CONSTRAINT "benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "recipient_name" TEXT,
    "vendor_name" TEXT,
    "description" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "due_date" TIMESTAMP(3),
    "paid_date" TIMESTAMP(3),
    "file_url" TEXT,
    "ocr_data" JSONB,
    "verification_result" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storyboard_styles" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "preset_key" TEXT NOT NULL,
    "custom_positive" TEXT,
    "custom_negative" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "storyboard_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storyboard_assets" (
    "id" TEXT NOT NULL,
    "frame_id" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storyboard_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storyboard_locks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "lock_type" TEXT NOT NULL,
    "lock_value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storyboard_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storyboard_jobs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "total_frames" INTEGER NOT NULL DEFAULT 0,
    "completed_frames" INTEGER NOT NULL DEFAULT 0,
    "error_msg" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storyboard_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "censor_analyses" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "script_version_id" TEXT,
    "predicted_certificate" TEXT,
    "confidence" TEXT,
    "deterministic_score" DOUBLE PRECISION,
    "top_drivers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "high_risk_scenes" JSONB,
    "uncertainties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "censor_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "censor_scene_flags" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "scene_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 0,
    "context" TEXT,
    "evidence" JSONB,

    CONSTRAINT "censor_scene_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "censor_suggestions" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "scene_number" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "issue" TEXT NOT NULL,
    "suggested_change" TEXT NOT NULL,
    "why" TEXT,
    "expected_severity_delta" INTEGER,
    "effort" TEXT,
    "creative_risk" TEXT,
    "expected_cert_impact" TEXT,

    CONSTRAINT "censor_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "daily_rate" DECIMAL(65,30),
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_sheets" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "shooting_day_id" TEXT,
    "title" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "content" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "analysis_type" TEXT NOT NULL,
    "input_data" JSONB,
    "result" JSONB,
    "model_used" TEXT,
    "token_count" INTEGER,
    "latency_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'app',
    "recipient" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target_date" TIMESTAMP(3) NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'pending',
    "order" INTEGER NOT NULL DEFAULT 0,
    "phase" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_tasks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "milestone_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_phases" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audience_sentiments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "video_url" TEXT,
    "total_comments" INTEGER NOT NULL DEFAULT 0,
    "analyzed_count" INTEGER NOT NULL DEFAULT 0,
    "positive_count" INTEGER NOT NULL DEFAULT 0,
    "negative_count" INTEGER NOT NULL DEFAULT 0,
    "neutral_count" INTEGER NOT NULL DEFAULT 0,
    "avg_sentiment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "top_positive" JSONB,
    "top_negative" JSONB,
    "takeaways" JSONB,
    "poster_tips" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_msg" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audience_sentiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sentiment_comments" (
    "id" TEXT NOT NULL,
    "sentiment_id" TEXT NOT NULL,
    "comment_text" TEXT NOT NULL,
    "author" TEXT,
    "sentiment" TEXT NOT NULL DEFAULT 'neutral',
    "sentiment_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emotions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "language" TEXT DEFAULT 'en',
    "likes" INTEGER NOT NULL DEFAULT 0,
    "replies" INTEGER NOT NULL DEFAULT 0,
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sentiment_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catering_plans" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "caterer_id" TEXT,
    "dietary_restrictions" JSONB,
    "total_budget" DECIMAL(65,30),
    "total_spent" DECIMAL(65,30),

    CONSTRAINT "catering_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caterers" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "specialty" TEXT,
    "rating" DECIMAL(65,30),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caterers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catering_meals" (
    "id" TEXT NOT NULL,
    "shoot_day_id" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "menu_items" TEXT[],
    "dietary" TEXT[],
    "budget" DECIMAL(65,30),
    "actual_cost" DECIMAL(65,30),
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catering_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catering_shoot_days" (
    "id" TEXT NOT NULL,
    "catering_plan_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total_crew" INTEGER NOT NULL DEFAULT 0,
    "total_cast" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catering_shoot_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'milestone',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "location" TEXT,
    "scenes" INTEGER NOT NULL DEFAULT 0,
    "budget" DECIMAL(12,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_expenses" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" DATE NOT NULL,
    "vendor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travel_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "script_versions_script_id_version_number_key" ON "script_versions"("script_id", "version_number");

-- CreateIndex
CREATE INDEX "script_text_blocks_script_id_page_number_idx" ON "script_text_blocks"("script_id", "page_number");

-- CreateIndex
CREATE INDEX "scenes_script_id_idx" ON "scenes"("script_id");

-- CreateIndex
CREATE INDEX "scene_elements_scene_id_idx" ON "scene_elements"("scene_id");

-- CreateIndex
CREATE UNIQUE INDEX "scene_characters_scene_id_character_id_key" ON "scene_characters"("scene_id", "character_id");

-- CreateIndex
CREATE UNIQUE INDEX "scene_props_scene_id_prop_id_key" ON "scene_props"("scene_id", "prop_id");

-- CreateIndex
CREATE INDEX "shots_scene_id_shot_index_idx" ON "shots"("scene_id", "shot_index");

-- CreateIndex
CREATE INDEX "candidates_intent_id_score_total_idx" ON "candidates"("intent_id", "score_total" DESC);

-- CreateIndex
CREATE INDEX "day_scenes_shooting_day_id_idx" ON "day_scenes"("shooting_day_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_versions_project_id_version_num_key" ON "schedule_versions"("project_id", "version_num");

-- CreateIndex
CREATE INDEX "budget_items_project_id_idx" ON "budget_items"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "budget_versions_project_id_version_num_key" ON "budget_versions"("project_id", "version_num");

-- CreateIndex
CREATE INDEX "expenses_project_id_date_idx" ON "expenses"("project_id", "date");

-- CreateIndex
CREATE INDEX "crew_project_id_idx" ON "crew"("project_id");

-- CreateIndex
CREATE INDEX "notifications_project_id_status_idx" ON "notifications"("project_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key_key" ON "user_settings"("user_id", "key");

-- CreateIndex
CREATE INDEX "milestones_project_id_status_idx" ON "milestones"("project_id", "status");

-- CreateIndex
CREATE INDEX "production_tasks_project_id_status_idx" ON "production_tasks"("project_id", "status");

-- CreateIndex
CREATE INDEX "production_phases_project_id_idx" ON "production_phases"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "production_phases_project_id_name_key" ON "production_phases"("project_id", "name");

-- CreateIndex
CREATE INDEX "audience_sentiments_project_id_idx" ON "audience_sentiments"("project_id");

-- CreateIndex
CREATE INDEX "sentiment_comments_sentiment_id_idx" ON "sentiment_comments"("sentiment_id");

-- CreateIndex
CREATE INDEX "catering_plans_project_id_idx" ON "catering_plans"("project_id");

-- CreateIndex
CREATE INDEX "caterers_project_id_idx" ON "caterers"("project_id");

-- CreateIndex
CREATE INDEX "catering_meals_shoot_day_id_idx" ON "catering_meals"("shoot_day_id");

-- CreateIndex
CREATE UNIQUE INDEX "catering_shoot_days_catering_plan_id_date_key" ON "catering_shoot_days"("catering_plan_id", "date");

-- CreateIndex
CREATE INDEX "notes_project_id_idx" ON "notes"("project_id");

-- CreateIndex
CREATE INDEX "timeline_events_project_id_idx" ON "timeline_events"("project_id");

-- CreateIndex
CREATE INDEX "timeline_events_type_idx" ON "timeline_events"("type");

-- CreateIndex
CREATE INDEX "timeline_events_status_idx" ON "timeline_events"("status");

-- CreateIndex
CREATE INDEX "travel_expenses_project_id_idx" ON "travel_expenses"("project_id");

-- CreateIndex
CREATE INDEX "travel_expenses_category_idx" ON "travel_expenses"("category");

-- CreateIndex
CREATE INDEX "travel_expenses_status_idx" ON "travel_expenses"("status");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_versions" ADD CONSTRAINT "script_versions_script_id_fkey" FOREIGN KEY ("script_id") REFERENCES "scripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_text_blocks" ADD CONSTRAINT "script_text_blocks_script_id_fkey" FOREIGN KEY ("script_id") REFERENCES "scripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_script_id_fkey" FOREIGN KEY ("script_id") REFERENCES "scripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_elements" ADD CONSTRAINT "scene_elements_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_characters" ADD CONSTRAINT "scene_characters_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_characters" ADD CONSTRAINT "scene_characters_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_locations" ADD CONSTRAINT "scene_locations_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "props" ADD CONSTRAINT "props_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_props" ADD CONSTRAINT "scene_props_prop_id_fkey" FOREIGN KEY ("prop_id") REFERENCES "props"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_props" ADD CONSTRAINT "scene_props_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vfx_notes" ADD CONSTRAINT "vfx_notes_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warnings" ADD CONSTRAINT "warnings_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shots" ADD CONSTRAINT "shots_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shot_suggestions" ADD CONSTRAINT "shot_suggestions_shot_id_fkey" FOREIGN KEY ("shot_id") REFERENCES "shots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storyboard_frames" ADD CONSTRAINT "storyboard_frames_shot_id_fkey" FOREIGN KEY ("shot_id") REFERENCES "shots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_intents" ADD CONSTRAINT "location_intents_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_intents" ADD CONSTRAINT "location_intents_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_intent_id_fkey" FOREIGN KEY ("intent_id") REFERENCES "location_intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_enrichments" ADD CONSTRAINT "candidate_enrichments_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scout_feedback" ADD CONSTRAINT "scout_feedback_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shooting_days" ADD CONSTRAINT "shooting_days_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shooting_days" ADD CONSTRAINT "shooting_days_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_scenes" ADD CONSTRAINT "day_scenes_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_scenes" ADD CONSTRAINT "day_scenes_shooting_day_id_fkey" FOREIGN KEY ("shooting_day_id") REFERENCES "shooting_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_versions" ADD CONSTRAINT "schedule_versions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_versions" ADD CONSTRAINT "budget_versions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts_rates" ADD CONSTRAINT "contracts_rates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmarks" ADD CONSTRAINT "benchmarks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storyboard_styles" ADD CONSTRAINT "storyboard_styles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "censor_analyses" ADD CONSTRAINT "censor_analyses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "censor_scene_flags" ADD CONSTRAINT "censor_scene_flags_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "censor_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "censor_scene_flags" ADD CONSTRAINT "censor_scene_flags_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "censor_suggestions" ADD CONSTRAINT "censor_suggestions_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "censor_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew" ADD CONSTRAINT "crew_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_sheets" ADD CONSTRAINT "call_sheets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_sheets" ADD CONSTRAINT "call_sheets_shooting_day_id_fkey" FOREIGN KEY ("shooting_day_id") REFERENCES "shooting_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_phases" ADD CONSTRAINT "production_phases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sentiment_comments" ADD CONSTRAINT "sentiment_comments_sentiment_id_fkey" FOREIGN KEY ("sentiment_id") REFERENCES "audience_sentiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catering_meals" ADD CONSTRAINT "catering_meals_shoot_day_id_fkey" FOREIGN KEY ("shoot_day_id") REFERENCES "catering_shoot_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catering_shoot_days" ADD CONSTRAINT "catering_shoot_days_catering_plan_id_fkey" FOREIGN KEY ("catering_plan_id") REFERENCES "catering_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
