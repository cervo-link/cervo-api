CREATE TABLE "member_platform_identities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"member_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_integrations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
DROP INDEX "discord_user_id_member_idx";--> statement-breakpoint
DROP INDEX "platform_id_platform_workspace_idx";--> statement-breakpoint
ALTER TABLE "member_platform_identities" ADD CONSTRAINT "member_platform_identities_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_integrations" ADD CONSTRAINT "workspace_integrations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "provider_provider_user_id_identity_idx" ON "member_platform_identities" USING btree ("provider","provider_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_provider_id_integration_idx" ON "workspace_integrations" USING btree ("provider","provider_id");--> statement-breakpoint
ALTER TABLE "members" DROP COLUMN "discord_user_id";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "platform";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "platform_id";