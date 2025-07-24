CREATE TABLE
	"memberships" (
		"id" uuid PRIMARY KEY NOT NULL,
		"member_id" uuid NOT NULL,
		"workspace_id" uuid NOT NULL
	);

--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "membership_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members" ("id") ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "membership_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces" ("id") ON DELETE no action ON UPDATE no action;