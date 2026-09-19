import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { supabase } from './db/supabase';
import { readActor, recordAudit } from './audit';
import {
  createdResponse,
  errorResponse,
  noContentResponse,
  notFoundResponse,
  readJsonBody,
  successResponse,
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from './api-response';

type Row = Record<string, unknown>;

export type ResourceConfig = {
  /** Nom exact de la table Supabase. */
  table: string;
  /** Module utilise dans le journal d'audit. */
  module: string;
  /** Libelle singulier pour les messages d'erreur. */
  label: string;
  select?: string;
  order?: { column: string; ascending?: boolean };
  /** Cles ignorees a l'ecriture (relations imbriquees, champs calcules). */
  omit?: string[];
  /** Valeurs appliquees a la creation quand le client ne les fournit pas. */
  defaults?: (body: Row) => Row;
  /** Autorise un identifiant fourni par le client au lieu d'en generer un. */
  acceptClientId?: boolean;
  /** Resume lisible d'une ligne, affiche dans l'historique. */
  summarize?: (row: Row) => string;
};

type ItemContext = { params: { id: string } };

const ALWAYS_OMITTED = ['id', 'createdAt', 'updatedAt'];

function sanitize(body: Row, config: ResourceConfig, options: { keepId?: boolean } = {}): Row {
  const omitted = new Set([...(config.omit ?? []), ...ALWAYS_OMITTED]);
  if (options.keepId) omitted.delete('id');

  const cleaned: Row = {};
  for (const [key, value] of Object.entries(body)) {
    if (omitted.has(key)) continue;
    if (value === undefined) continue;
    cleaned[key] = value;
  }
  return cleaned;
}

function describe(config: ResourceConfig, row: Row | null): string | undefined {
  if (!row || !config.summarize) return undefined;
  try {
    return config.summarize(row);
  } catch {
    return undefined;
  }
}

async function findRow(config: ResourceConfig, id: string) {
  return supabase
    .from(config.table)
    .select(config.select ?? '*')
    .eq('id', id)
    .maybeSingle();
}

export function listHandler(config: ResourceConfig) {
  return async function GET() {
    try {
      let query = supabase.from(config.table).select(config.select ?? '*');
      if (config.order) {
        query = query.order(config.order.column, { ascending: config.order.ascending ?? true });
      }

      const { data, error } = await query;
      if (error) return supabaseErrorResponse(error);

      return successResponse(data ?? []);
    } catch (error) {
      return unexpectedErrorResponse(error);
    }
  };
}

export function createHandler(config: ResourceConfig) {
  return async function POST(request: NextRequest) {
    try {
      const body = await readJsonBody(request);
      const payload = sanitize(body, config, { keepId: config.acceptClientId });

      if (config.defaults) {
        Object.assign(payload, { ...config.defaults(body), ...payload });
      }
      if (!payload.id) {
        payload.id = randomUUID();
      }

      const { data, error } = await supabase
        .from(config.table)
        .insert([payload])
        .select(config.select ?? '*')
        .single();

      if (error) return supabaseErrorResponse(error);

      const row = data as unknown as Row;
      await recordAudit({
        module: config.module,
        action: 'CREATE',
        entityId: String(row.id ?? ''),
        actor: readActor(request),
        summary: describe(config, row),
        after: row,
      });

      return createdResponse(row);
    } catch (error) {
      if (error instanceof Error && error.message.includes('JSON')) {
        return errorResponse(error.message, 400);
      }
      return unexpectedErrorResponse(error);
    }
  };
}

export function readHandler(config: ResourceConfig) {
  return async function GET(_request: NextRequest, { params }: ItemContext) {
    try {
      const { data, error } = await findRow(config, params.id);
      if (error) return supabaseErrorResponse(error, `${config.label} introuvable.`);
      if (!data) return notFoundResponse(`${config.label} introuvable.`);

      return successResponse(data);
    } catch (error) {
      return unexpectedErrorResponse(error);
    }
  };
}

export function updateHandler(config: ResourceConfig) {
  return async function PATCH(request: NextRequest, { params }: ItemContext) {
    try {
      const body = await readJsonBody(request);
      const payload = sanitize(body, config);

      const { data: before } = await findRow(config, params.id);
      if (!before) return notFoundResponse(`${config.label} introuvable.`);

      if (Object.keys(payload).length === 0) {
        return successResponse(before);
      }

      const { data, error } = await supabase
        .from(config.table)
        .update(payload)
        .eq('id', params.id)
        .select(config.select ?? '*')
        .single();

      if (error) return supabaseErrorResponse(error, `${config.label} introuvable.`);

      const row = data as unknown as Row;
      await recordAudit({
        module: config.module,
        action: 'UPDATE',
        entityId: params.id,
        actor: readActor(request),
        summary: describe(config, row),
        before,
        after: row,
      });

      return successResponse(row);
    } catch (error) {
      if (error instanceof Error && error.message.includes('JSON')) {
        return errorResponse(error.message, 400);
      }
      return unexpectedErrorResponse(error);
    }
  };
}

export function deleteHandler(config: ResourceConfig) {
  return async function DELETE(request: NextRequest, { params }: ItemContext) {
    try {
      const { data: before } = await findRow(config, params.id);
      if (!before) return notFoundResponse(`${config.label} introuvable.`);

      const { error } = await supabase.from(config.table).delete().eq('id', params.id);
      if (error) return supabaseErrorResponse(error);

      await recordAudit({
        module: config.module,
        action: 'DELETE',
        entityId: params.id,
        actor: readActor(request),
        summary: describe(config, before as unknown as Row),
        before,
      });

      return noContentResponse();
    } catch (error) {
      return unexpectedErrorResponse(error);
    }
  };
}

/** Handlers de la route collection: `/api/<ressource>`. */
export function collectionRoute(config: ResourceConfig) {
  return { GET: listHandler(config), POST: createHandler(config) };
}

/** Handlers de la route element: `/api/<ressource>/[id]`. */
export function itemRoute(config: ResourceConfig) {
  return {
    GET: readHandler(config),
    PATCH: updateHandler(config),
    DELETE: deleteHandler(config),
  };
}
