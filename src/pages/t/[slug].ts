import { recordClick } from "../../lib/links.js";
import type { APIRoute } from "astro";

export const prerender = false;

function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderStatusPage({
  title,
  message,
  slug,
  status,
  statusCode,
}: {
  title: string;
  message: string;
  slug: string;
  status: string;
  statusCode: number;
}) {
  const safeSlug = slug ? String(slug) : "";
  const redirectTarget = `/s/${encodeURIComponent(safeSlug || "demo")}`;
  const escapedTitle = escapeHtml(title);
  const escapedMessage = escapeHtml(message);
  const escapedStatus = escapeHtml(status);
  const escapedRedirectTarget = escapeHtml(redirectTarget);

  return new Response(
    `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #09090b;
        color: #f4f4f5;
        font-family: Inter, system-ui, sans-serif;
      }
      main {
        width: min(560px, calc(100vw - 2rem));
        padding: 2rem;
        border: 1px solid #27272a;
        border-radius: 24px;
        background: rgba(24, 24, 27, 0.8);
        box-shadow: 0 20px 80px rgba(0, 0, 0, 0.45);
      }
      h1 { margin: 0 0 0.75rem; font-size: 2rem; }
      p { margin: 0 0 1.25rem; color: #a1a1aa; line-height: 1.6; }
      a {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: white;
        text-decoration: none;
        background: #4f46e5;
        padding: 0.85rem 1.1rem;
        border-radius: 14px;
        font-weight: 600;
      }
      .badge {
        display: inline-flex;
        margin-bottom: 1rem;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        background: rgba(129, 140, 248, 0.12);
        color: #c7d2fe;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.03em;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <main>
      <div class="badge">${escapedStatus}</div>
      <h1>${escapedTitle}</h1>
      <p>${escapedMessage}</p>
      <a href="${escapedRedirectTarget}">Ver estadísticas</a>
    </main>
  </body>
</html>`,
    {
      status: statusCode,
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  );
}

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const slug = params.slug?.trim().toLowerCase();

    if (!slug) {
      return renderStatusPage({
        title: "Link not found",
        message: "No pudimos encontrar ese enlace.",
        slug: "demo",
        status: "not found",
        statusCode: 404,
      });
    }

    const result = await recordClick(slug, request);

    if (result.status === "active" && result.link) {
      return Response.redirect(result.link.destination_url, 302);
    }

    if (result.status === "expired") {
      return renderStatusPage({
        title: "Link expired",
        message:
          "Este enlace ya expiró. Si conservas el token de gestión, puedes revisar sus estadísticas o eliminarlo desde la página pública.",
        slug,
        status: "expired",
        statusCode: 410,
      });
    }

    return renderStatusPage({
      title: "Link not found",
      message: "No pudimos encontrar ese enlace.",
      slug,
      status: "not found",
      statusCode: 404,
    });
  } catch (error) {
    console.error("[t/:slug] GET failed", error);
    return renderStatusPage({
      title: "Unexpected error",
      message: "No pudimos procesar este enlace en este momento.",
      slug: params.slug?.trim().toLowerCase() ?? "demo",
      status: "error",
      statusCode: 500,
    });
  }
};
