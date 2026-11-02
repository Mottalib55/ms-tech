import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getConnector } from '@/connectors/registry';
import { encrypt } from '@/server/encryption';
import { syncConnection } from '@/server/sync';
import { appOrigin, hashState } from '@/server/connections';
import { requireUser } from '@/server/http';
import type { ProviderSlug } from '@/connectors/types';

const back = (query: string) => NextResponse.redirect(`${appOrigin()}/dashboard/connections?${query}`);

// Where every provider's consent page returns. This route did not exist before:
// nothing stored a token, so no connection could ever become active.
export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.redirect(`${appOrigin()}/login?callbackUrl=/dashboard/connections`);
  }
  // The state ties this response to the screen this same user opened.
  const connection = params.state
    ? await prisma.providerConnection.findFirst({
        where: { userId: user.id, status: 'pending', stateHash: hashState(params.state) },
      })
    : null;
  if (!connection) return back('connect_error=expired');

  if (params.error || params.denied) {
    await prisma.providerConnection.delete({ where: { id: connection.id } });
    return back('connect_error=denied');
  }

  try {
    const connector = getConnector(connection.provider as ProviderSlug);
    const result = await connector.handleCallback(params);
    await prisma.providerConnection.update({
      where: { id: connection.id },
      data: {
        status: 'active', stateHash: null, externalId: result.externalId,
        accessTokenEnc: result.accessToken ? await encrypt(result.accessToken) : null,
        refreshTokenEnc: result.refreshToken ? await encrypt(result.refreshToken) : null,
        tokenExpiresAt: result.tokenExpiresAt ?? null,
      },
    });
  } catch (error) {
    console.error('[connect] callback', connection.provider, error);
    await prisma.providerConnection.delete({ where: { id: connection.id } });
    return back('connect_error=failed');
  }

  try {
    await syncConnection(connection.id);
    return back(`connected=${connection.provider}`);
  } catch {
    // The link is good; the sync's error now shows on the connection's card.
    return back('connect_error=sync');
  }
}
