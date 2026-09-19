import { itemRoute } from '@/lib/crud';
import { parcelExpeditionsResource } from '@/lib/resources';

export const dynamic = 'force-dynamic';

export const { GET, PATCH, DELETE } = itemRoute(parcelExpeditionsResource);
