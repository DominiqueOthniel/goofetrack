import { collectionRoute } from '@/lib/crud';
import { caisseTransactionsResource } from '@/lib/resources';

export const dynamic = 'force-dynamic';

export const { GET, POST } = collectionRoute(caisseTransactionsResource);
