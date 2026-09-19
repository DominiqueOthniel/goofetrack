import { itemRoute } from '@/lib/crud';
import { caisseTransactionsResource } from '@/lib/resources';

export const dynamic = 'force-dynamic';

export const { GET, PATCH, DELETE } = itemRoute(caisseTransactionsResource);
