// Dropbox API helpers
// Per-tenant OAuth for governing doc sync

export function getDropboxAppKey(): string {
  const key = process.env.DROPBOX_APP_KEY;
  if (!key) throw new Error("DROPBOX_APP_KEY is not set");
  return key;
}
