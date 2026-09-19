import { itemRoute } from '@/lib/crud';
import { expensesResource } from '@/lib/resources';

export const dynamic = 'force-dynamic';

export const { GET, PATCH, DELETE } = itemRoute(expensesResource);
