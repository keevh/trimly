import { buildErrorResponse, deleteLink, HttpError, isHttpErrorLike } from "../../../lib/links.js";
import type { APIRoute } from "astro";

export const prerender = false;

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const DELETE: APIRoute = async ({ params, request }) => {
  const slug = params.slug?.trim().toLowerCase();

  if (!slug) {
    return jsonResponse({ error: "invalid_slug", message: "slug is required" }, 400);
  }

  try {
    const body = await request.json().catch(() => null);
    const managementToken = body?.managementToken?.trim();

    if (!managementToken) {
      throw new HttpError(400, "missing_token", "managementToken is required");
    }

    await deleteLink(slug, managementToken);

    return jsonResponse({ deleted: true });
  } catch (error) {
    console.error("[api/links/:slug] DELETE failed", error);

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
