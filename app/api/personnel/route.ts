import { collectionRoute } from '@/lib/crud';
import { personnelResource } from '@/lib/resources';

export const dynamic = 'force-dynamic';

export const { GET, POST } = collectionRoute(personnelResource);
