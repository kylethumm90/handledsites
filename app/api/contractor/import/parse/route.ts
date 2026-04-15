import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { validateSessionFromRequest } from "@/lib/contractor-auth";

// Step 1 of the CSV import flow. Contractor uploads a CSV; we parse it
// on the server, compute per-column stats (so the client can show samples
// and filled-count during mapping), and return a preview window. The
// execute route takes the parsed rows back as JSON — we do not persist
// anything here.

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ROWS = 2500;
const PREVIEW_ROWS = 500;
const SAMPLES_PER_COLUMN = 3;

type ColumnStat = {
  header: string;
  filled: number;
  total: number;
  samples: string[];
};

export async function POST(request: NextRequest) {
  const auth = await validateSessionFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fast path: reject oversized uploads before we buffer the body.
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength && contentLength > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large. Max 10 MB." },
      { status: 413 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart body" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing 'file' field" },
      { status: 400 }
    );
  }

  // Belt-and-braces size check: content-length can lie (or be absent) on
  // chunked uploads, so re-check against the realized File.size.
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large. Max 10 MB." },
      { status: 413 }
    );
  }

  if (
    !/\.csv$/i.test(file.name) &&
    !(file.type && file.type.toLowerCase().includes("csv"))
  ) {
    return NextResponse.json(
      { error: "File must be a CSV" },
      { status: 400 }
    );
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return NextResponse.json(
      { error: "Could not read file" },
      { status: 400 }
    );
  }

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    // Strip whitespace and any stray UTF-8 BOM from header cells.
    transformHeader: (h) => h.trim().replace(/^\uFEFF/, ""),
  });

  if (parsed.errors && parsed.errors.length > 0) {
    return NextResponse.json(
      {
        error: "CSV parse error",
        details: parsed.errors.slice(0, 5).map((e) => ({
          row: e.row,
          code: e.code,
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  const rows = parsed.data ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV is empty" }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows. Max ${MAX_ROWS}.` },
      { status: 413 }
    );
  }

  const headers = (parsed.meta?.fields ?? []).filter(
    (h): h is string => typeof h === "string" && h.length > 0
  );

  // Compute per-column stats: how many rows have a non-empty value in
  // this column, plus up to three distinct sample values for the UI.
  const columnStats: ColumnStat[] = headers.map((header) => {
    let filled = 0;
    const sampleSet = new Set<string>();
    for (const row of rows) {
      const cell = row[header];
      if (typeof cell !== "string") continue;
      const trimmed = cell.trim();
      if (trimmed.length === 0) continue;
      filled += 1;
      if (sampleSet.size < SAMPLES_PER_COLUMN) {
        sampleSet.add(trimmed);
      }
    }
    return {
      header,
      filled,
      total: rows.length,
      samples: Array.from(sampleSet),
    };
  });

  return NextResponse.json({
    filename: file.name,
    headers,
    columnStats,
    totalRows: rows.length,
    previewRows: rows.slice(0, PREVIEW_ROWS),
  });
}
