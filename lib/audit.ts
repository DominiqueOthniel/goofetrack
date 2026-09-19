import { supabase } from './db/supabase';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'REMBOURSEMENT';

export type AuditActor = {
  login?: string;
  role?: string;
};

/** Le frontend transmet l'utilisateur courant via des en-tetes dediees. */
export function readActor(request: Request): AuditActor {
  return {
    login: request.headers.get('x-actor-login') ?? undefined,
    role: request.headers.get('x-actor-role') ?? undefined,
  };
}

type AuditEntry = {
  module: string;
  action: AuditAction;
  entityId?: string | null;
  actor: AuditActor;
  summary?: string;
  before?: unknown;
  after?: unknown;
};

/**
 * Le journal d'audit est une fonctionnalite secondaire: une ecriture qui echoue
 * ne doit jamais faire echouer l'operation metier qui vient de reussir.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const { error } = await supabase.from('audit_logs').insert([
      {
        module: entry.module,
        action: entry.action,
        entityId: entry.entityId ?? null,
        actorLogin: entry.actor.login ?? null,
        actorRole: entry.actor.role ?? null,
        summary: entry.summary ?? null,
        beforeData: entry.before ?? null,
        afterData: entry.after ?? null,
      },
    ]);

    if (error) {
      console.warn("Journal d'audit non ecrit:", error.message);
    }
  } catch (error) {
    console.warn("Journal d'audit indisponible:", error);
  }
}
