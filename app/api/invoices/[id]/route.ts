import { itemRoute } from '@/lib/crud';
import { invoicesResource } from '@/lib/resources';

export const dynamic = 'force-dynamic';

export const { GET, PATCH, DELETE } = itemRoute(invoicesResource);
