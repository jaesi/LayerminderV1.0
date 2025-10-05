

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."enum_status" AS ENUM (
    'pending',
    'processing',
    'ready',
    'error'
);


ALTER TYPE "public"."enum_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_pin_count"("room_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE layer_rooms
  SET pin_count = GREATEST(COALESCE(pin_count, 0) - 1, 0)
  WHERE id = room_id_param;  -- ← id로!
END;
$$;


ALTER FUNCTION "public"."decrement_pin_count"("room_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_pin_count"("room_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE layer_rooms
  SET pin_count = COALESCE(pin_count, 0) + 1
  WHERE id = room_id_param;  -- ← id로!
END;
$$;


ALTER FUNCTION "public"."increment_pin_count"("room_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_pin_count_dec"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE layer_rooms
  SET pin_count = GREATEST(COALESCE(pin_count, 0) - 1, 0),
      updated_at = NOW()
  WHERE room_id = OLD.room_id;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."trg_pin_count_dec"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_pin_count_inc"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update layer_rooms
  set pin_count = COALESCE(pin_count, 0) + 1,
    updated_at = NOW()
  WHERE room_id = NEW.room_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_pin_count_inc"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."credit_events" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "delta" integer NOT NULL,
    "event_type" "text" NOT NULL,
    "reason" "text",
    "idempotency_key" "text",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "credit_events_delta_check" CHECK (("delta" <> 0))
);


ALTER TABLE "public"."credit_events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."credit_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."credit_events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."credit_events_id_seq" OWNED BY "public"."credit_events"."id";



CREATE TABLE IF NOT EXISTS "public"."credits" (
    "user_id" "uuid" NOT NULL,
    "credits" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "credits_credits_check" CHECK (("credits" >= 0))
);


ALTER TABLE "public"."credits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."history_record_images" (
    "record_id" "uuid" NOT NULL,
    "seq" smallint NOT NULL,
    "image_id" "uuid" NOT NULL
);


ALTER TABLE "public"."history_record_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."history_records" (
    "record_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "reference_image_id" "uuid",
    "story" "text",
    "keywords" "jsonb",
    "image_status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "story_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "keywords_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "recommendation_status" "public"."enum_status",
    "recommendation_error" "text",
    CONSTRAINT "chk_keywords_status" CHECK (("keywords_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'ready'::"text", 'error'::"text"]))),
    CONSTRAINT "chk_story_status" CHECK (("story_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'ready'::"text", 'error'::"text"]))),
    CONSTRAINT "history_records_status_check1" CHECK (("image_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'ready'::"text", 'error'::"text", 'images_ready'::"text"])))
);


ALTER TABLE "public"."history_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."history_sessions" (
    "session_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."history_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."images" (
    "image_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "url" "text" NOT NULL,
    "type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "images_type_check" CHECK (("type" = ANY (ARRAY['input'::"text", 'generated'::"text"])))
);


ALTER TABLE "public"."images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."layer_rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "slug" "text",
    "is_public" boolean DEFAULT false NOT NULL,
    "pin_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "archived_at" timestamp with time zone,
    CONSTRAINT "pin_count_noneg" CHECK (("pin_count" >= 0))
);


ALTER TABLE "public"."layer_rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reference_image_pool" (
    "reference_image_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "url" "text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reference_image_pool" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."room_images" (
    "room_image_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid" NOT NULL,
    "image_id" "uuid" NOT NULL,
    "note" "text",
    "seq" integer,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."room_images" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_image_index" AS
 SELECT "hs"."user_id",
    "hr"."record_id",
    "hri"."seq",
    ("i"."image_id")::"text" AS "image_id",
    "i"."url",
    "hr"."story",
    "hr"."keywords",
    "hr"."created_at" AS "record_created_at",
    'gen'::"text" AS "kind"
   FROM ((("public"."history_record_images" "hri"
     JOIN "public"."images" "i" ON (("i"."image_id" = "hri"."image_id")))
     JOIN "public"."history_records" "hr" ON (("hr"."record_id" = "hri"."record_id")))
     JOIN "public"."history_sessions" "hs" ON (("hs"."session_id" = "hr"."session_id")))
UNION ALL
 SELECT "hs"."user_id",
    "hr"."record_id",
    0 AS "seq",
    ("hr"."reference_image_id")::"text" AS "image_id",
    "jip"."url",
    "hr"."story",
    "hr"."keywords",
    "hr"."created_at" AS "record_created_at",
    'ref'::"text" AS "kind"
   FROM (("public"."history_records" "hr"
     JOIN "public"."history_sessions" "hs" ON (("hs"."session_id" = "hr"."session_id")))
     JOIN "public"."reference_image_pool" "jip" ON (("jip"."reference_image_id" = "hr"."reference_image_id")));


ALTER VIEW "public"."v_image_index" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_record_detail" AS
 WITH "base" AS (
         SELECT "hs"."user_id",
            "hr"."record_id",
            "hr"."story",
            COALESCE("hr"."keywords", '[]'::"jsonb") AS "keywords",
            "jip"."url" AS "reference_image_url",
            "hr"."created_at" AS "record_created_at"
           FROM (("public"."history_records" "hr"
             JOIN "public"."history_sessions" "hs" ON (("hs"."session_id" = "hr"."session_id")))
             LEFT JOIN "public"."reference_image_pool" "jip" ON (("jip"."reference_image_id" = "hr"."reference_image_id")))
        ), "imgs" AS (
         SELECT "hri"."record_id",
            "jsonb_build_object"('seq', "hri"."seq", 'id', ("i"."image_id")::"text", 'url', "i"."url") AS "j"
           FROM ("public"."history_record_images" "hri"
             JOIN "public"."images" "i" ON (("i"."image_id" = "hri"."image_id")))
        )
 SELECT "user_id",
    "record_id",
    "story",
    "keywords",
    "reference_image_url",
    "record_created_at",
    COALESCE(( SELECT "jsonb_agg"("i"."j" ORDER BY (("i"."j" ->> 'seq'::"text"))::integer) AS "jsonb_agg"
           FROM "imgs" "i"
          WHERE ("i"."record_id" = "b"."record_id")), '[]'::"jsonb") AS "images"
   FROM "base" "b";


ALTER VIEW "public"."v_record_detail" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_record_list" AS
 SELECT "hs"."user_id",
    "hr"."record_id",
    "hr"."keywords",
    "hr"."reference_image_id",
    "jip"."url" AS "reference_image_url",
    "max"(
        CASE
            WHEN ("hri"."seq" = 1) THEN ("i"."image_id")::"text"
            ELSE NULL::"text"
        END) AS "gen_image_id_1",
    "max"(
        CASE
            WHEN ("hri"."seq" = 2) THEN ("i"."image_id")::"text"
            ELSE NULL::"text"
        END) AS "gen_image_id_2",
    "max"(
        CASE
            WHEN ("hri"."seq" = 3) THEN ("i"."image_id")::"text"
            ELSE NULL::"text"
        END) AS "gen_image_id_3",
    "max"(
        CASE
            WHEN ("hri"."seq" = 4) THEN ("i"."image_id")::"text"
            ELSE NULL::"text"
        END) AS "gen_image_id_4",
    "max"(
        CASE
            WHEN ("hri"."seq" = 1) THEN "i"."url"
            ELSE NULL::"text"
        END) AS "gen_image_1",
    "max"(
        CASE
            WHEN ("hri"."seq" = 2) THEN "i"."url"
            ELSE NULL::"text"
        END) AS "gen_image_2",
    "max"(
        CASE
            WHEN ("hri"."seq" = 3) THEN "i"."url"
            ELSE NULL::"text"
        END) AS "gen_image_3",
    "max"(
        CASE
            WHEN ("hri"."seq" = 4) THEN "i"."url"
            ELSE NULL::"text"
        END) AS "gen_image_4",
    "date"("hr"."created_at") AS "created_day",
    "hr"."created_at"
   FROM (((("public"."history_sessions" "hs"
     JOIN "public"."history_records" "hr" ON (("hs"."session_id" = "hr"."session_id")))
     JOIN "public"."reference_image_pool" "jip" ON (("hr"."reference_image_id" = "jip"."reference_image_id")))
     JOIN "public"."history_record_images" "hri" ON (("hr"."record_id" = "hri"."record_id")))
     JOIN "public"."images" "i" ON (("hri"."image_id" = "i"."image_id")))
  GROUP BY "hs"."user_id", "hr"."record_id", "hr"."reference_image_id", "hr"."keywords", "jip"."url", "hr"."created_at";


ALTER VIEW "public"."v_record_list" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_session_images" AS
 SELECT "hs"."session_id",
    "hs"."user_id",
    "hr"."record_id",
    "hri"."seq",
    "i"."image_id",
    "i"."url",
    "i"."type",
    "i"."created_at",
    ("i"."created_at")::"date" AS "day"
   FROM ((("public"."history_sessions" "hs"
     JOIN "public"."history_records" "hr" ON (("hr"."session_id" = "hs"."session_id")))
     JOIN "public"."history_record_images" "hri" ON (("hri"."record_id" = "hr"."record_id")))
     JOIN "public"."images" "i" ON (("i"."image_id" = "hri"."image_id")));


ALTER VIEW "public"."v_session_images" OWNER TO "postgres";


ALTER TABLE ONLY "public"."credit_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."credit_events_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."credit_events"
    ADD CONSTRAINT "credit_events_idempotency_key_key" UNIQUE ("idempotency_key");



ALTER TABLE ONLY "public"."credit_events"
    ADD CONSTRAINT "credit_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credits"
    ADD CONSTRAINT "credits_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."history_record_images"
    ADD CONSTRAINT "history_record_images_image_id_key" UNIQUE ("image_id");



ALTER TABLE ONLY "public"."history_record_images"
    ADD CONSTRAINT "history_record_images_pkey" PRIMARY KEY ("record_id", "seq");



ALTER TABLE ONLY "public"."history_sessions"
    ADD CONSTRAINT "history_records_pkey" PRIMARY KEY ("session_id");



ALTER TABLE ONLY "public"."history_records"
    ADD CONSTRAINT "history_records_pkey1" PRIMARY KEY ("record_id");



ALTER TABLE ONLY "public"."reference_image_pool"
    ADD CONSTRAINT "image_pool_pkey" PRIMARY KEY ("reference_image_id");



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_pkey" PRIMARY KEY ("image_id");



ALTER TABLE ONLY "public"."layer_rooms"
    ADD CONSTRAINT "layer_rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."layer_rooms"
    ADD CONSTRAINT "layer_rooms_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."room_images"
    ADD CONSTRAINT "room_images_pkey" PRIMARY KEY ("room_image_id");



ALTER TABLE ONLY "public"."room_images"
    ADD CONSTRAINT "room_images_room_id_image_id_key" UNIQUE ("room_id", "image_id");



CREATE INDEX "credit_evens_user_ctime_idx" ON "public"."credit_events" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "history_record_images_image_id_idx" ON "public"."history_record_images" USING "btree" ("image_id");



CREATE INDEX "history_record_images_record_id_idx" ON "public"."history_record_images" USING "btree" ("record_id");



CREATE INDEX "history_record_images_record_id_seq_idx" ON "public"."history_record_images" USING "btree" ("record_id", "seq");



CREATE INDEX "history_records_session_id_created_at_idx" ON "public"."history_records" USING "btree" ("session_id", "created_at");



CREATE INDEX "history_records_session_id_idx" ON "public"."history_records" USING "btree" ("session_id");



CREATE INDEX "history_sessions_user_id_idx" ON "public"."history_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_history_user_created" ON "public"."history_sessions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_image_pool_created" ON "public"."reference_image_pool" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_images_type" ON "public"."images" USING "btree" ("type");



CREATE INDEX "idx_layer_rooms_owner_active" ON "public"."layer_rooms" USING "btree" ("owner_id", "created_at" DESC) WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_layer_rooms_public_active" ON "public"."layer_rooms" USING "btree" ("is_public", "created_at" DESC) WHERE ("archived_at" IS NULL);



CREATE INDEX "images_created_at_idx" ON "public"."images" USING "btree" ("created_at");



CREATE INDEX "images_image_id_idx" ON "public"."images" USING "btree" ("image_id");



ALTER TABLE ONLY "public"."room_images"
    ADD CONSTRAINT "fk_room_images_images" FOREIGN KEY ("image_id") REFERENCES "public"."images"("image_id");



ALTER TABLE ONLY "public"."history_record_images"
    ADD CONSTRAINT "history_record_images_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."images"("image_id");



ALTER TABLE ONLY "public"."history_record_images"
    ADD CONSTRAINT "history_record_images_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "public"."history_records"("record_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."history_records"
    ADD CONSTRAINT "history_records_reference_image_id_fkey" FOREIGN KEY ("reference_image_id") REFERENCES "public"."reference_image_pool"("reference_image_id");



ALTER TABLE ONLY "public"."history_records"
    ADD CONSTRAINT "history_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."history_sessions"("session_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."history_sessions"
    ADD CONSTRAINT "history_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."layer_rooms"
    ADD CONSTRAINT "layer_rooms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."room_images"
    ADD CONSTRAINT "room_images_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."room_images"
    ADD CONSTRAINT "room_images_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."history_record_images"("image_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_images"
    ADD CONSTRAINT "room_images_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."layer_rooms"("id") ON DELETE CASCADE;



ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "images insert own" ON "public"."images" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "images select own" ON "public"."images" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "images update own" ON "public"."images" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."decrement_pin_count"("room_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_pin_count"("room_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_pin_count_dec"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_pin_count_inc"() TO "service_role";


















GRANT ALL ON TABLE "public"."credit_events" TO "anon";
GRANT ALL ON TABLE "public"."credit_events" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."credit_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."credit_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."credit_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."credits" TO "anon";
GRANT ALL ON TABLE "public"."credits" TO "authenticated";
GRANT ALL ON TABLE "public"."credits" TO "service_role";



GRANT ALL ON TABLE "public"."history_record_images" TO "service_role";



GRANT ALL ON TABLE "public"."history_records" TO "service_role";



GRANT ALL ON TABLE "public"."history_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."images" TO "service_role";



GRANT ALL ON TABLE "public"."layer_rooms" TO "service_role";



GRANT ALL ON TABLE "public"."reference_image_pool" TO "service_role";



GRANT ALL ON TABLE "public"."room_images" TO "service_role";



GRANT ALL ON TABLE "public"."v_image_index" TO "anon";
GRANT ALL ON TABLE "public"."v_image_index" TO "authenticated";
GRANT ALL ON TABLE "public"."v_image_index" TO "service_role";



GRANT ALL ON TABLE "public"."v_record_detail" TO "anon";
GRANT ALL ON TABLE "public"."v_record_detail" TO "authenticated";
GRANT ALL ON TABLE "public"."v_record_detail" TO "service_role";



GRANT ALL ON TABLE "public"."v_record_list" TO "anon";
GRANT ALL ON TABLE "public"."v_record_list" TO "authenticated";
GRANT ALL ON TABLE "public"."v_record_list" TO "service_role";



GRANT ALL ON TABLE "public"."v_session_images" TO "anon";
GRANT ALL ON TABLE "public"."v_session_images" TO "authenticated";
GRANT ALL ON TABLE "public"."v_session_images" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;

  create policy "Allow insert for authenticated users"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() IS NOT NULL));



  create policy "Allow insert for logged-in users 1gzurdc_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'layerminder'::text));



  create policy "Allow insert for logged-in users"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() IS NOT NULL));



