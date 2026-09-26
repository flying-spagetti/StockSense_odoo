ALTER TABLE "stock_movements" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "stock_movements" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
DROP TYPE "public"."movement_status";--> statement-breakpoint
CREATE TYPE "public"."movement_status" AS ENUM('draft', 'waiting', 'ready', 'done', 'canceled');--> statement-breakpoint
ALTER TABLE "stock_movements" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."movement_status";--> statement-breakpoint
ALTER TABLE "stock_movements" ALTER COLUMN "status" SET DATA TYPE "public"."movement_status" USING "status"::"public"."movement_status";