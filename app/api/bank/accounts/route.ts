import { collectionRoute } from '@/lib/crud';
import { bankAccountsResource } from '@/lib/resources';

export const dynamic = 'force-dynamic';

export const { GET, POST } = collectionRoute(bankAccountsResource);
