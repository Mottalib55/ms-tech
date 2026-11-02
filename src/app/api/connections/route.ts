import { randomUUID } from 'node:crypto';
import { prisma } from '@/server/db';
import { ApiError, parseBody, requireUser, route } from '@/server/http';
import { enforce } from '@/server/limiter';
import { getConnector } from '@/connectors/registry';
import { encrypt } from '@/server/encryption';
import { syncConnection } from '@/server/sync';
import { appOrigin, availableProviders, hashState, newState } from '@/server/connections';
import { connectKeysSchema, connectProviderSchema } from '@/server/validations';

export const GET = route(async () => {
  const user = await requireUser();
  const connections = await prisma.providerConnection.findMany({
    // An abandoned consent screen is not a connection.
    where: { userId: user.id, status: { not: 'pending' } },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, provider: true, status: true, lastSyncAt: true, lastSyncStatus: true, lastSyncError: true, createdAt: true,
      _count: { select: { financialAccounts: true } },
    },
  });
  return { connections, providers: availableProviders(user.isDemo) };
});

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  await enforce(`connect:${user.id}`, 20, 300);
  const body = (await req.json().catch(() => null)) as { provider?: string } | null;
  if (!body) throw new ApiError(400, 'Requête invalide');

  if (body.provider === 'binance' || body.provider === 'ibkr') {
    const { provider, apiKey, apiSecret } = connectKeysSchema.parse(body);
    const available = availableProviders(user.isDemo).find((p) => p.slug === provider);
    if (!available?.configured) throw new ApiError(503, `${available?.name ?? provider} n'est pas encore activé sur cette plateforme.`);
    const connection = await prisma.providerConnection.create({
      data: {
        userId: user.id, provider, status: 'pending', externalId: `${provider}-${randomUUID()}`,
        accessTokenEnc: await encrypt(apiKey), apiSecretEnc: await encrypt(apiSecret),
      },
    });
    try {
      await syncConnection(connection.id);
    } catch {
      // Credentials the provider refuses are not worth keeping: say so and leave nothing behind.
      await prisma.providerConnection.delete({ where: { id: connection.id } });
      throw new ApiError(400, provider === 'binance'
        ? 'Binance a refusé ces clés. Vérifiez la clé, le secret et l\'autorisation « lecture ».'
        : 'Interactive Brokers a refusé ces identifiants. Vérifiez le jeton et le numéro de requête Flex.');
    }
    return { connectionId: connection.id, type: 'done' };
  }

  const { provider } = connectProviderSchema.parse(body);
  const available = availableProviders(user.isDemo).find((p) => p.slug === provider);
  if (!available) throw new ApiError(403, 'Ce fournisseur n\'est pas disponible.');
  if (!available.configured) throw new ApiError(503, `${available.name} n'est pas encore activé sur cette plateforme.`);

  const connector = getConnector(provider);
  const state = newState();
  const result = await connector.initiateConnection(user.id, `${appOrigin()}/api/connections/callback`, state);
  await prisma.providerConnection.deleteMany({ where: { userId: user.id, provider, status: 'pending' } });
  const connection = await prisma.providerConnection.create({
    data: { userId: user.id, provider, status: 'pending', stateHash: hashState(state), externalId: result.connectionId },
  });
  return { connectionId: connection.id, ...result };
});
