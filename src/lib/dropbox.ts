/**
 * Dropbox API utilities for OAuth and file operations.
 */

const DROPBOX_AUTH_URL = "https://www.dropbox.com/oauth2/authorize";
const DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const DROPBOX_API_URL = "https://api.dropboxapi.com/2";
const DROPBOX_CONTENT_URL = "https://content.dropboxapi.com/2";

export interface DropboxTokens {
  access_token: string;
  refresh_token: string;
  account_id: string;
}

export interface DropboxEntry {
  ".tag": "file" | "folder";
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
  size?: number;
  server_modified?: string;
}

export interface DropboxAccount {
  account_id: string;
  name: { display_name: string };
  email: string;
}

/**
 * Build the Dropbox OAuth authorization URL.
 */
export function getDropboxAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.DROPBOX_APP_KEY!,
    redirect_uri: redirectUri,
    response_type: "code",
    token_access_type: "offline",
    state,
  });
  return `${DROPBOX_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for access + refresh tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<DropboxTokens> {
  const response = await fetch(DROPBOX_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: process.env.DROPBOX_APP_KEY!,
      client_secret: process.env.DROPBOX_APP_SECRET!,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Dropbox token exchange failed: ${err}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    account_id: data.account_id,
  };
}

/**
 * Refresh an expired access token using the refresh token.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<string> {
  const response = await fetch(DROPBOX_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      client_id: process.env.DROPBOX_APP_KEY!,
      client_secret: process.env.DROPBOX_APP_SECRET!,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Dropbox token refresh failed: ${err}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Get Dropbox account info for the connected user.
 */
export async function getDropboxAccount(
  accessToken: string
): Promise<DropboxAccount> {
  const response = await fetch(
    `${DROPBOX_API_URL}/users/get_current_account`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get Dropbox account info");
  }

  return response.json();
}

/**
 * List folder contents at a given path.
 * Returns files and folders.
 */
export async function listFolder(
  accessToken: string,
  path: string
): Promise<DropboxEntry[]> {
  const response = await fetch(`${DROPBOX_API_URL}/files/list_folder`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: path === "/" ? "" : path,
      recursive: false,
      include_mounted_folders: true,
      include_non_downloadable_files: false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Dropbox list_folder failed: ${err}`);
  }

  const data = await response.json();
  return data.entries as DropboxEntry[];
}

/**
 * Download a file from Dropbox. Returns the file buffer.
 */
export async function downloadFile(
  accessToken: string,
  path: string
): Promise<{ buffer: Buffer; name: string }> {
  const response = await fetch(`${DROPBOX_CONTENT_URL}/files/download`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({ path }),
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Dropbox download failed: ${err}`);
  }

  // Extract filename from the API result header
  const apiResult = JSON.parse(
    response.headers.get("dropbox-api-result") || "{}"
  );
  const name = apiResult.name || path.split("/").pop() || "unknown";

  const arrayBuffer = await response.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), name };
}

/**
 * Auto-detect governing document category from filename.
 */
export function detectDocCategory(
  filename: string
): string {
  const lower = filename.toLowerCase();

  if (/cc&?r|ccr|covenant|declaration|restriction/i.test(lower)) {
    if (/amend/i.test(lower)) return "amendment";
    return "ccrs";
  }
  if (/bylaw/i.test(lower)) {
    if (/amend/i.test(lower)) return "amendment";
    return "bylaws";
  }
  if (/article|incorporat/i.test(lower)) return "articles";
  if (/rule|regulation/i.test(lower)) return "rules";
  if (/budget/i.test(lower)) return "budget";
  if (/financial|statement/i.test(lower)) return "financial_statement";
  if (/reserve|study|analysis/i.test(lower)) return "reserve_analysis";
  if (/insurance|cert|coverage/i.test(lower)) return "insurance_cert";
  if (/minute|meeting/i.test(lower)) return "minutes";
  if (/plat|survey|map/i.test(lower)) return "plat";
  if (/amend/i.test(lower)) return "amendment";

  // Default — can't detect
  return "rules";
}

/**
 * Get a valid access token for a tenant, refreshing if needed.
 * Updates the token in the database if refreshed.
 */
export async function getValidAccessToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  tenantId: string,
  currentAccessToken: string,
  refreshToken: string
): Promise<string> {
  // Try the current token first
  try {
    await getDropboxAccount(currentAccessToken);
    return currentAccessToken;
  } catch {
    // Token expired — refresh it
  }

  const newAccessToken = await refreshAccessToken(refreshToken);

  // Save the new access token
  await supabaseClient
    .from("tenants")
    .update({ dropbox_access_token: newAccessToken })
    .eq("id", tenantId);

  return newAccessToken;
}
