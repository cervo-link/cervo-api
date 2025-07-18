CREATE TABLE "member" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"username" text,
	"email" text,
	"discord_user_id" bigint,
	"password_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "email_member_idx" ON "member" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "username_member_idx" ON "member" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "discord_user_id_member_idx" ON "member" USING btree ("discord_user_id");