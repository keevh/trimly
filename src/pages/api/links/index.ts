import {
  buildErrorResponse,
  buildPublicUrls,
  createLink,
  getRateLimitMax,
  getRateLimitWindowHours,
  HttpError,
  isHttpErrorLike,
} from "../../../lib/links.js";
import type { APIRoute } from "astro";

export const prerender = false;

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);
    const destinationUrl = body?.destinationUrl;
    const customAlias = body?.customAlias?.trim() || "";
    const source = body?.source;

    if (source !== "demo") {
      throw new HttpError(400, "invalid_source", "source must be demo");
    }

    if (!destinationUrl || typeof destinationUrl !== "string") {
      throw new HttpError(400, "invalid_url", "destinationUrl is required");
    }

    const result = await createLink({
      request,
      destinationUrl,
      customAlias: customAlias || null,
    });

    const urls = buildPublicUrls(request, result.link.slug);

    return jsonResponse(
      {
        slug: result.link.slug,
        shortUrl: urls.shortUrl,
        statsUrl: urls.statsUrl,
        managementToken: result.managementToken,
        expiresAt: result.link.expires_at,
      },
      201,
    );
  } catch (error) {
    console.error("[api/links] POST failed", error);

    if (isHttpErrorLike(error)) {
      const typedError = error as HttpError;
      return jsonResponse(
        {
          error: typedError.code,
          message: typedError.message ?? "Unable to complete request",
          windowHours:
            typedError.code === "rate_limited" ? getRateLimitWindowHours() : undefined,
          limit: typedError.code === "rate_limited" ? getRateLimitMax() : undefined,
        },
        typedError.statusCode,
      );
    }

    return buildErrorResponse(error);
  }
};
