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
    alert('Please select a file to upload.')
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

  console.log(response)

  if (response.ok) {
    const { url, fields } = await response.json()

    const formData = new FormData()
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value as string)
    })
    formData.append('file', file)

    console.log(formData)

    const uploadResponse = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    if (uploadResponse.ok) {
      alert('Upload successful!')
    } else {
      console.error('S3 Upload Error:', uploadResponse)
      alert('Upload failed.')
    }
  } else {
    alert('Failed to get pre-signed URL.')
  }
}