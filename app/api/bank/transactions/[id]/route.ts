import { itemRoute } from '@/lib/crud';
import { bankTransactionsResource } from '@/lib/resources';

export const dynamic = 'force-dynamic';

export const { GET, PATCH, DELETE } = itemRoute(bankTransactionsResource);
