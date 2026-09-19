import { collectionRoute } from '@/lib/crud';
import { tripsResource } from '@/lib/resources';

export const dynamic = 'force-dynamic';

export const { GET, POST } = collectionRoute(tripsResource);
