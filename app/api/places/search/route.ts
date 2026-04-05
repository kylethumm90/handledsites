import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Places API not configured" },
      { status: 500 }
    );
  }

  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.reviews",
        },
        body: JSON.stringify({
          textQuery: query,
          maxResultCount: 5,
        }),
      }
    );

    if (!res.ok) {
      console.error("Places API error:", res.status, await res.text());
      return NextResponse.json(
        { error: "Search failed" },
        { status: 502 }
      );
    }

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = (data.places || []).map((p: any) => ({
      placeId: p.id,
      name: p.displayName?.text || "",
      address: p.formattedAddress || "",
      rating: p.rating ?? null,
      reviewCount: p.userRatingCount ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reviews: (p.reviews || []).slice(0, 5).map((r: any) => ({
        text: r.text?.text || r.originalText?.text || "",
        author: r.authorAttribution?.displayName || "Google User",
        rating: r.rating || 0,
      })),
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Places API fetch error:", err);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
