import { itemRoute } from '@/lib/crud';
import { creditsResource } from '@/lib/resources';

export const dynamic = 'force-dynamic';

export const { GET, PATCH, DELETE } = itemRoute(creditsResource);
