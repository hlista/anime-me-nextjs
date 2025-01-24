import { sql, type InferInsertModel } from "drizzle-orm";
import { integer, sqliteTable, text, real } from "drizzle-orm/sqlite-core";

export const runs = sqliteTable("runs", {
	run_id: text("run_id").notNull().primaryKey(),
	user_id: text("user_id").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(strftime('%s', 'now'))`,
	),
	image_url: text("image_url"),
	inputs: text("inputs", { mode: "json" }).$type<Record<string, string>>(),
	live_status: text("live_status"),
	progress: real("progress"),
	auto_tags: text("auto_tags"),
});

export type UpdateRun = Partial<InferInsertModel<typeof runs>>