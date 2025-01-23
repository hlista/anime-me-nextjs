"use server";

import { db } from "@/db/db";
import { runs } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { ComfyDeploy } from "comfydeploy";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { promises as fs } from "node:fs";


export async function uploadImage(file: File | null) {
  if (!file) {
    throw new Error("Please select a file to upload.");
    return
  }
    const { userId } = auth();
  
    const headersList = headers();
    const host = headersList.get("host") || "";
    const protocol = headersList.get("x-forwarded-proto") || "";
    let endpoint = `${protocol}://${host}`;
    console.log(endpoint)
    const response = await fetch(
    `${endpoint}/api/upload`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    }
  )

  if (response.ok) {
    const { url, fields } = await response.json()

    const formData = new FormData()
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value as string)
    })
    formData.append('file', file)

    const uploadResponse = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    if (uploadResponse.ok) {
      return `${uploadResponse.url}${fields["key"]}`
    } else {
      console.error('S3 Upload Error:', uploadResponse)
      throw new Error("Upload failed.");
    }
  } else {
    throw new Error("Failed to get pre-signed URL.")
  }
}