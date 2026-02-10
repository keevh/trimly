import {
  buildErrorResponse,
  buildPublicUrls,
  fetchLinkStats,
  HttpError,
  isHttpErrorLike,
} from "../../../../lib/links.js";
import type { APIRoute } from "astro";

export const prerender = false;

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const GET: APIRoute = async ({ params, request }) => {
  const slug = params.slug?.trim().toLowerCase();

  if (!slug) {
    return jsonResponse({ error: "invalid_slug", message: "slug is required" }, 400);
  }

  try {
    const stats = await fetchLinkStats(slug);

    if (!stats) {
      throw new HttpError(404, "not_found", "Link not found");
    }

    const urls = buildPublicUrls(request, slug);

    return jsonResponse({
      slug: stats.slug,
      shortUrl: urls.shortUrl,
      destinationUrl: stats.destinationUrl,
      createdAt: stats.createdAt,
      expiresAt: stats.expiresAt,
      status: stats.status,
      totalClicks: stats.totalClicks,
      lastClickedAt: stats.lastClickedAt,
      clicksByDay: stats.clicksByDay,
      topReferrers: stats.topReferrers,
      topDevices: stats.topDevices,
      topCountries: stats.topCountries,
    });
  } catch (error) {
    console.error("[api/links/:slug/stats] GET failed", error);

    if (isHttpErrorLike(error)) {
      const typedError = error as HttpError;
      return jsonResponse(
        {
          error: typedError.code,
          message: typedError.message ?? "Unable to complete request",
        },
        typedError.statusCode,
      );
    }

    return buildErrorResponse(error);
  }
};
