"use server";

import { db } from "@/db/db";
import { runs } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { ComfyDeploy } from "comfydeploy";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { promises as fs } from "node:fs";

const client = new ComfyDeploy({
	bearer: process.env.COMFY_DEPLOY_API_KEY,
});

const isDevelopment = process.env.NODE_ENV === "development";

export async function generateImage(imageUrl: string) {
	const { userId } = auth();

	const headersList = await headers();
	const host = headersList.get("host") || "";
	const protocol = headersList.get("x-forwarded-proto") || "";
	let endpoint = `${protocol}://${host}`;

	if (isDevelopment) {
		const tunnelUrlFilePath = "tunnel_url.txt";

		try {
			const tunnelUrl = await fs.readFile(tunnelUrlFilePath, "utf-8");
			endpoint = tunnelUrl.trim();

			console.log(endpoint);
		} catch (error) {
			console.error(
				`Failed to read tunnel URL from ${tunnelUrlFilePath}:`,
				error,
			);
		}
	}

	if (!userId) throw new Error("User not found");

	const inputs = {
		input_image: imageUrl
	};

	const result = await client.run.queue({
		deploymentId: process.env.COMFY_DEPLOY_WF_DEPLOYMENT_ID,
		webhook: `${endpoint}/api/webhook`, // optional
		inputs: inputs,
	});

	if (result) {
		await db.insert(runs).values({
			run_id: result.runId,
			user_id: userId,
			inputs: inputs,
		});
		return result.runId;
	}

	return undefined;
}

export async function checkStatus(run_id: string) {
	return await client.run.get({
		runId: run_id,
	});
}