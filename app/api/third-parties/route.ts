import { collectionRoute } from '@/lib/crud';
import { thirdPartiesResource } from '@/lib/resources';

export const dynamic = 'force-dynamic';

export const { GET, POST } = collectionRoute(thirdPartiesResource);
