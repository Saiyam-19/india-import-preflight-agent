import { NextResponse } from "next/server";

import {
  ExtractionUploadError,
  LiveExtractionUnavailableError,
  extractSyntheticRouterInvoice,
} from "@/extraction";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  Expires: "0",
  Pragma: "no-cache",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

function isUpload(value: FormDataEntryValue): value is File {
  return typeof value !== "string" && typeof value.arrayBuffer === "function";
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Request body must be multipart form data." }, 400);
  }

  const uploads = [...form.entries()].filter((entry): entry is [string, File] =>
    isUpload(entry[1]),
  );
  if (
    uploads.length !== 1 ||
    uploads[0]?.[0] !== "document" ||
    form.getAll("document").length !== 1
  ) {
    return json(
      { error: "Upload exactly one document: the synthetic router pro-forma-invoice PDF." },
      422,
    );
  }

  const file = uploads[0][1];
  try {
    const result = await extractSyntheticRouterInvoice({
      bytes: new Uint8Array(await file.arrayBuffer()),
      fileName: file.name,
      mediaType: file.type,
      live: process.env.BWMI_LIVE_OPENAI_EXTRACTION === "1",
    });
    return json(result);
  } catch (error) {
    if (error instanceof ExtractionUploadError) {
      return json({ error: error.message }, error.status);
    }
    if (error instanceof LiveExtractionUnavailableError) {
      return json(
        { error: "Live extraction is unavailable because the server has no OpenAI API key." },
        503,
      );
    }
    return json(
      { error: "The invoice could not be extracted. No upload or derived facts were saved." },
      502,
    );
  }
}
