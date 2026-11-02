// Universal links: the addresses the app opens instead of Safari once installed, and the shared
// password login. APPLE_TEAM_ID is the Apple developer team; without it, the file does not exist.
export const dynamic = 'force-dynamic';

const BUNDLE_ID = 'com.mstech.patrimoine';
const PATHS = ['/*/dashboard', '/*/dashboard/*', '/*/login', '/*/register', '/*/reset'];

export function GET() {
  const team = process.env.APPLE_TEAM_ID;
  if (!team) return new Response('Not found', { status: 404 });
  const app = `${team}.${BUNDLE_ID}`;
  return Response.json(
    {
      applinks: { details: [{ appIDs: [app], components: PATHS.map((p) => ({ '/': p })) }] },
      webcredentials: { apps: [app] },
    },
    { headers: { 'cache-control': 'public, max-age=3600' } },
  );
}
