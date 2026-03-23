CREATE TABLE "waiting_list" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"allow_promo_emails" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "email_waiting_list_idx" ON "waiting_list" USING btree ("email");