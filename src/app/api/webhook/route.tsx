import { db } from "@/db/db";
import { runs, type UpdateRun } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ComfyDeploy } from "comfydeploy";

const cd = new ComfyDeploy();

export async function POST(request: Request) {
	const data = await cd.validateWebhook({ request });

	const { status, runId, outputs, liveStatus, progress } = data;

	if (status === "success") {
		const imgindex = outputs?.findIndex((item) => item.nodeMeta.node_class === 'SaveImage')
		const images = outputs?.[imgindex || 0].data?.images?.[0];
		const promptIndex = outputs?.findIndex((item) => item.nodeMeta.node_class === 'WD14Tagger|pysssss')
		const tags = outputs?.[promptIndex || 0].data?.tags?.[0];
		const updates:UpdateRun = {};

		if (images && typeof images !== "string") {
			updates.image_url = images.url
		}
		if (tags && typeof tags === "string") {
			updates.auto_tags = tags
		}
		if (Object.keys(updates).length > 0) {
			await db.update(runs).set(updates).where(eq(runs.run_id, runId))
			console.log("updated", runId, updates);
		}
	}

	// Do your things
	console.log(status, runId, outputs);

	return NextResponse.json({ message: "success" }, { status: 200 });
}
