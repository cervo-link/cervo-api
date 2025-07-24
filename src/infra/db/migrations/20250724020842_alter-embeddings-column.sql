ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmark_workspace_id_workspace_id_fk";
--> statement-breakpoint
ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmark_member_id_member_id_fk";
--> statement-breakpoint
ALTER TABLE "memberships" DROP CONSTRAINT "membership_member_id_member_id_fk";
--> statement-breakpoint
ALTER TABLE "memberships" DROP CONSTRAINT "membership_workspace_id_workspace_id_fk";
--> statement-breakpoint
ALTER TABLE "bookmarks" ALTER COLUMN "embedding" SET DATA TYPE vector(1536);--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;