import { requireUser, route } from '@/server/http';
import { refreshCryptoPrices } from '@/server/prices';
import { recordSnapshot } from '@/server/summary';
import { enforce } from '@/server/limiter';

// "Actualiser les cours" on the portfolio: real market prices for crypto positions.
export const POST = route(async () => {
  const user = await requireUser();
  await enforce(`prices:${user.id}`, 10, 60);
  const updated = await refreshCryptoPrices(user.id);
  await recordSnapshot(user.id);
  return { updated };
});
