/**
 * HealthMetrics API proxy route.
 * Proxies requests to OpenHealthMetricsMap so the API key is never exposed to the client.
 *
 * City-name search uses the Geocoding API (direct geocoding) to convert
 * city names to coordinates, then fetches healthMetrics by lat/lon — the only
 * non-deprecated path per OpenHealthMetricsMap docs.
 *
 * Required environment variable:
 *   OPENWEATHERMAP_API_KEY=<your_key>   (server-only — no NEXT_PUBLIC_ prefix)
 *
 * Usage:
 *   GET /api/healthMetrics?lat=<lat>&lon=<lon>
 *   GET /api/healthMetrics?city=<city name>
 */

import { NextResponse } from "next/server";

const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/healthMetrics";
const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";

export async function GET(request) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "HealthMetrics API key not configured. Set OPENWEATHERMAP_API_KEY in .env.local",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  let lat = searchParams.get("lat");
  let lon = searchParams.get("lon");
  const city = searchParams.get("city");

  // If city provided, resolve to coordinates via Geocoding API first
  if (!lat && !lon && city) {
    try {
      const geoRes = await fetch(
        `${GEO_URL}?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`,
        { next: { revalidate: 86400 } }, // cache geocoding for 24h
      );

      if (!geoRes.ok) {
        return NextResponse.json(
          { error: `Geocoding failed (${geoRes.status})` },
          { status: geoRes.status },
        );
      }

      const geoData = await geoRes.json();
      if (!Array.isArray(geoData) || geoData.length === 0) {
        return NextResponse.json(
          { error: `City "${city}" not found` },
          { status: 404 },
        );
      }

      lat = geoData[0].lat;
      lon = geoData[0].lon;
    } catch (err) {
      return NextResponse.json(
        { error: "Geocoding request failed: " + err.message },
        { status: 500 },
      );
    }
  }

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Provide lat & lon or a city name" },
      { status: 400 },
    );
  }

  try {
    const owmUrl = `${WEATHER_API_URL}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${apiKey}&units=metric`;
    const res = await fetch(owmUrl, { next: { revalidate: 600 } }); // cache 10 min

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errBody.message || `OpenHealthMetricsMap error ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch healthMetrics: " + err.message },
      { status: 500 },
    );
  }
}
