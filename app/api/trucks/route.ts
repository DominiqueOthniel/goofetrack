import { collectionRoute } from '@/lib/crud';
import { trucksResource } from '@/lib/resources';

export const dynamic = 'force-dynamic';

export const { GET, POST } = collectionRoute(trucksResource);
