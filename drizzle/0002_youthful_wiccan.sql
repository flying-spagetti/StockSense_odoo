ALTER TABLE "stock_movements" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN "reference" text;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN "supplier" text;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN "from_location_id" text;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN "to_location_id" text;