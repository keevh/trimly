import crypto from "node:crypto";
import { pool } from "./db.js";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 3);
const RATE_LIMIT_WINDOW_HOURS = Number(process.env.RATE_LIMIT_WINDOW_HOURS ?? 24);
const DEMO_EXPIRY_DAYS = Number(process.env.DEMO_EXPIRY_DAYS ?? 7);
const CLEANUP_GRACE_DAYS = Number(process.env.CLEANUP_GRACE_DAYS ?? 30);
const IP_HASH_SALT = process.env.IP_HASH_SALT ?? "trimly-dev-salt";

let cleanupPromise = null;
let lastCleanupAt = 0;

export class HttpError extends Error {
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function isHttpErrorLike(error) {
  return Boolean(
    error &&
      typeof error === "object" &&
      typeof error.statusCode === "number" &&
      typeof error.code === "string",
  );
}

export function buildErrorResponse(error) {
  if (isHttpErrorLike(error)) {
    const typedError = error;
    return new Response(
      JSON.stringify({
        error: typedError.code,
        message: typedError.message,
        details: typedError.details ?? null,
      }),
      {
        status: typedError.statusCode,
        headers: { "content-type": "application/json; charset=utf-8" },
      },
    );
  }

  return new Response(
    JSON.stringify({
      error: "internal_error",
      message: "Unexpected server error",
    }),
    {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    },
  );
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function saltHash(value) {
  return sha256(`${IP_HASH_SALT}:${value}`);
}

function toIsoString(value) {
  return new Date(value).toISOString();
}

export function hashIp(ipAddress) {
  return saltHash(ipAddress || "unknown");
}

export function normalizeSlug(value) {
  return value.trim().toLowerCase();
}

export function isValidCustomAlias(value) {
  return /^[a-z0-9](?:[a-z0-9_-]{1,30}[a-z0-9])?$/.test(value);
}

export function generateSlug(length = 6) {
  const bytes = crypto.randomBytes(length);
  let slug = "";

  for (let index = 0; index < length; index += 1) {
    slug += ALPHABET[bytes[index] % ALPHABET.length];
  }

  return slug;
}

export function validateDestinationUrl(value) {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }

    return url.toString();
  } catch {
    throw new HttpError(400, "invalid_url", "destinationUrl must be a valid http(s) URL");
  }
}

export function getClientIp(headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const candidate = forwarded.split(",")[0]?.trim();
    if (candidate) {
      return candidate;
    }
  }

  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-client-ip") ??
    "unknown"
  );
}

export function getDeviceType(userAgent) {
  const value = (userAgent ?? "").toLowerCase();

  if (!value) {
    return "unknown";
  }

  if (
    value.includes("bot") ||
    value.includes("crawler") ||
    value.includes("spider") ||
    value.includes("slurp") ||
    value.includes("preview")
  ) {
    return "bot";
  }

  if (
    value.includes("curl") ||
    value.includes("wget") ||
    value.includes("httpie") ||
    value.includes("postman") ||
    value.includes("insomnia") ||
    value.includes("axios") ||
    value.includes("fetch") ||
    value.includes("undici") ||
    value.includes("python-requests") ||
    value.includes("go-http-client") ||
    value.includes("libwww-perl")
  ) {
    return "cli";
  }

  if (value.includes("ipad") || value.includes("tablet") || value.includes("kindle")) {
    return "tablet";
  }

  if (
    value.includes("mobi") ||
    value.includes("iphone") ||
    value.includes("android")
  ) {
    return "mobile";
  }

  if (
    value.includes("windows") ||
    value.includes("macintosh") ||
    value.includes("linux")
  ) {
    return "desktop";
  }

  return "unknown";
}

export function normalizeReferer(value) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.host.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeCountryCode(value) {
  if (!value) {
    return null;
  }

  const cleaned = value.trim().toUpperCase();
  if (!cleaned) {
    return null;
  }

  return cleaned.slice(0, 2);
}

function countryFromAcceptLanguage(value) {
  if (!value) {
    return null;
  }

  const firstLocale = value.split(",")[0]?.trim();
  if (!firstLocale) {
    return null;
  }

  const parts = firstLocale.split("-");
  const region = parts[1]?.trim();
  if (!region || region.length !== 2) {
    return null;
  }

  return normalizeCountryCode(region);
}

export function getCountryFromHeaders(headers) {
  const keys = [
    "cf-ipcountry",
    "x-vercel-ip-country",
    "x-country-code",
    "x-geo-country",
  ];

  for (const key of keys) {
    const value = normalizeCountryCode(headers.get(key));
    if (value) {
      return value;
    }
  }

  return null;
}

export async function resolveCountryCode(headers, ipAddress) {
  const headerCountry = getCountryFromHeaders(headers);
  if (headerCountry) {
    return headerCountry;
  }

  const languageCountry = countryFromAcceptLanguage(
    headers.get("accept-language"),
  );
  if (languageCountry) {
    return languageCountry;
  }

  if (!ipAddress || ipAddress === "unknown") {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 350);

  try {
    const response = await fetch(
      `https://api.ipquery.io/?ip=${encodeURIComponent(ipAddress)}`,
      { signal: controller.signal },
    );

    if (!response.ok) {
      return null;
    }

    const payload = await response.json().catch(() => null);
    return normalizeCountryCode(
      payload?.country_code ??
        payload?.countryCode ??
        payload?.country ??
        payload?.location?.country_code ??
        payload?.location?.countryCode,
    );
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function buildPublicUrls(request, slug) {
  const configuredBaseUrl = process.env.APP_BASE_URL?.trim();
  const origin = configuredBaseUrl || new URL(request.url).origin;
  return {
    shortUrl: `${origin}/t/${slug}`,
    statsUrl: `${origin}/s/${slug}`,
  };
}

export function buildDeleteErrorMessage(code) {
  if (code === "alias_taken") {
    return "This alias is already in use";
  }

  if (code === "rate_limited") {
    return `You can create up to ${RATE_LIMIT_MAX} links every ${RATE_LIMIT_WINDOW_HOURS} hours`;
  }

  return "Unable to complete request";
}

async function ensureCleanupIfNeeded() {
  const now = Date.now();
  if (cleanupPromise || now - lastCleanupAt < 60 * 60 * 1000) {
    return cleanupPromise;
  }

  cleanupPromise = (async () => {
    lastCleanupAt = Date.now();
    const graceCutoff = new Date(
      Date.now() - CLEANUP_GRACE_DAYS * 24 * 60 * 60 * 1000,
    );

    await pool.query(
      "DELETE FROM links WHERE expires_at < $1",
      [graceCutoff.toISOString()],
    );
  })().finally(() => {
    cleanupPromise = null;
  });

  return cleanupPromise;
}

async function checkRateLimit(createdIpHash) {
  const windowHours = Math.max(1, Number(RATE_LIMIT_WINDOW_HOURS) || 24);
  const { rows } = await pool.query(
    `
      SELECT COUNT(*)::int AS count
      FROM links
      WHERE created_ip_hash = $1
        AND created_at >= NOW() - ($2 * INTERVAL '1 hour')
    `,
    [createdIpHash, windowHours],
  );

  if ((rows[0]?.count ?? 0) >= RATE_LIMIT_MAX) {
    throw new HttpError(
      429,
      "rate_limited",
      `You can create up to ${RATE_LIMIT_MAX} links every ${RATE_LIMIT_WINDOW_HOURS} hours`,
    );
  }
}

async function insertLinkRecord({
  slug,
  destinationUrl,
  managementToken,
  expiresAt,
  createdIpHash,
}) {
  const { rows } = await pool.query(
    `
      INSERT INTO links (
        slug,
        destination_url,
        management_token,
        created_at,
        expires_at,
        is_demo,
        created_ip_hash
      )
      VALUES ($1, $2, $3, NOW(), $4, TRUE, $5)
      RETURNING *
    `,
    [slug, destinationUrl, managementToken, expiresAt.toISOString(), createdIpHash],
  );

  return rows[0];
}

async function slugIsTaken(slug) {
  const { rowCount } = await pool.query(
    "SELECT 1 FROM links WHERE slug = $1 LIMIT 1",
    [slug],
  );
  return rowCount > 0;
}

function getManagementToken() {
  return crypto.randomBytes(18).toString("base64url");
}

export async function createLink({ request, destinationUrl, customAlias }) {
  await ensureCleanupIfNeeded();

  const normalizedDestinationUrl = validateDestinationUrl(destinationUrl);
  const createdIp = getClientIp(request.headers);
  const createdIpHash = hashIp(createdIp);

  await checkRateLimit(createdIpHash);

  const expiresAt = new Date(
    Date.now() + DEMO_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );
  const managementToken = getManagementToken();

  if (customAlias) {
    const slug = normalizeSlug(customAlias);
    if (!isValidCustomAlias(slug)) {
      throw new HttpError(
        400,
        "invalid_alias",
        "customAlias must be 3-32 characters and use lowercase letters, numbers, hyphens, or underscores",
      );
    }

    if (await slugIsTaken(slug)) {
      throw new HttpError(409, "alias_taken", "This alias is already in use");
    }

    const link = await insertLinkRecord({
      slug,
      destinationUrl: normalizedDestinationUrl,
      managementToken,
      expiresAt,
      createdIpHash,
    });

    return {
      link,
      managementToken,
    };
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = generateSlug();
    try {
      const link = await insertLinkRecord({
        slug,
        destinationUrl: normalizedDestinationUrl,
        managementToken,
        expiresAt,
        createdIpHash,
      });

      return {
        link,
        managementToken,
      };
    } catch (error) {
      if (error?.code !== "23505") {
        throw error;
      }
    }
  }

  throw new HttpError(500, "slug_generation_failed", "Unable to allocate a unique slug");
}

export async function fetchLinkBySlug(slug) {
  const { rows } = await pool.query(
    "SELECT * FROM links WHERE slug = $1 LIMIT 1",
    [slug],
  );

  return rows[0] ?? null;
}

export async function fetchLinkStats(slug) {
  const link = await fetchLinkBySlug(slug);
  if (!link) {
    return null;
  }

  const { rows: totalsRows } = await pool.query(
    `
      SELECT
        COUNT(*)::int AS total_clicks,
        MAX(clicked_at) AS last_clicked_at
      FROM click_events
      WHERE link_id = $1
    `,
    [link.id],
  );

  const { rows: dayRows } = await pool.query(
    `
      WITH day_series AS (
        SELECT generate_series(
          date_trunc('day', link.created_at),
          date_trunc('day', link.expires_at),
          INTERVAL '1 day'
        ) AS day
        FROM links link
        WHERE link.id = $1
      ),
      clicks AS (
        SELECT date_trunc('day', clicked_at) AS day, COUNT(*)::int AS clicks
        FROM click_events
        WHERE link_id = $1
        GROUP BY 1
      )
      SELECT
        to_char(day_series.day, 'YYYY-MM-DD') AS date,
        COALESCE(clicks.clicks, 0)::int AS clicks
      FROM day_series
      LEFT JOIN clicks USING (day)
      ORDER BY day_series.day
    `,
    [link.id],
  );

  const { rows: referrerRows } = await pool.query(
    `
      SELECT
        COALESCE(referer, 'Direct / sin referer') AS source,
        COUNT(*)::int AS clicks
      FROM click_events
      WHERE link_id = $1
      GROUP BY 1
      ORDER BY clicks DESC, source ASC
      LIMIT 5
    `,
    [link.id],
  );

  const { rows: deviceRows } = await pool.query(
    `
      SELECT
        device_type AS device,
        COUNT(*)::int AS clicks
      FROM click_events
      WHERE link_id = $1
      GROUP BY 1
      ORDER BY clicks DESC, device ASC
      LIMIT 5
    `,
    [link.id],
  );

  const { rows: countryRows } = await pool.query(
    `
      SELECT
        COALESCE(country_code, 'Unknown') AS "countryCode",
        COUNT(*)::int AS clicks
      FROM click_events
      WHERE link_id = $1
      GROUP BY 1
      ORDER BY clicks DESC, "countryCode" ASC
      LIMIT 5
    `,
    [link.id],
  );

  const totalClicks = totalsRows[0]?.total_clicks ?? 0;
  const status = new Date(link.expires_at).getTime() < Date.now() ? "expired" : "active";

  return {
    slug: link.slug,
    shortUrl: null,
    destinationUrl: link.destination_url,
    createdAt: toIsoString(link.created_at),
    expiresAt: toIsoString(link.expires_at),
    status,
    totalClicks,
    lastClickedAt: totalsRows[0]?.last_clicked_at
      ? toIsoString(totalsRows[0].last_clicked_at)
      : null,
    clicksByDay: dayRows,
    topReferrers: referrerRows,
    topDevices: deviceRows,
    topCountries: countryRows,
  };
}

export async function recordClick(slug, request) {
  await ensureCleanupIfNeeded();

  const link = await fetchLinkBySlug(slug);
  if (!link) {
    return { status: "missing", link: null };
  }

  if (new Date(link.expires_at).getTime() < Date.now()) {
    return { status: "expired", link };
  }

  const ipAddress = getClientIp(request.headers);
  const visitorIpHash = hashIp(ipAddress);
  const deviceType = getDeviceType(request.headers.get("user-agent"));
  const referer = normalizeReferer(request.headers.get("referer"));
  const isBot = deviceType === "bot";
  const countryCode = await resolveCountryCode(request.headers, ipAddress);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO click_events (
          link_id,
          clicked_at,
          referer,
          device_type,
          country_code,
          is_bot,
          visitor_ip_hash
        )
        VALUES ($1, NOW(), $2, $3, $4, $5, $6)
      `,
      [
        link.id,
        referer,
        deviceType,
        countryCode,
        isBot,
        visitorIpHash,
      ],
    );

    await client.query(
      "UPDATE links SET last_clicked_at = NOW() WHERE id = $1",
      [link.id],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return {
    status: "active",
    link,
  };
}

export async function deleteLink(slug, managementToken) {
  const link = await fetchLinkBySlug(slug);

  if (!link) {
    throw new HttpError(404, "not_found", "Link not found");
  }

  if (link.management_token !== managementToken) {
    throw new HttpError(401, "invalid_token", "managementToken is invalid");
  }

  await pool.query("DELETE FROM links WHERE id = $1", [link.id]);

  return true;
}

export function getRateLimitWindowHours() {
  return RATE_LIMIT_WINDOW_HOURS;
}

export function getRateLimitMax() {
  return RATE_LIMIT_MAX;
}
