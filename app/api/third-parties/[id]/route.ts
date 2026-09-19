import { itemRoute } from '@/lib/crud';
import { thirdPartiesResource } from '@/lib/resources';

export const dynamic = 'force-dynamic';

export const { GET, PATCH, DELETE } = itemRoute(thirdPartiesResource);
