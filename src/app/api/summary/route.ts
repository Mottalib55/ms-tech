import { computeSummary } from '@/server/summary';
import { requireUser, route } from '@/server/http';

export const GET = route(async () => {
  const user = await requireUser();
  return computeSummary(user.id, user.currency);
});
