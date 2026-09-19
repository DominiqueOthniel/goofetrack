/**
 * Verifie que le schema Supabase est valide et que chaque table/colonne
 * referencee par les routes API existe reellement.
 *
 * Le schema est execute dans PGlite (PostgreSQL compile en WebAssembly), ce qui
 * permet de le tester sans serveur PostgreSQL.
 *
 * Usage : node scripts/verify-schema.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const ROOT = new URL('..', import.meta.url).pathname;

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const db = new PGlite();
const schemaSql = readFileSync(join(ROOT, 'supabase-schema.sql'), 'utf8');

try {
  await db.exec(schemaSql);
  console.log('Schema applique sans erreur.');
} catch (error) {
  console.error('Le schema SQL est invalide :', error.message);
  process.exit(1);
}

const { rows: columnRows } = await db.query(`
  SELECT table_name, column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
`);

const schema = new Map();
for (const { table_name, column_name } of columnRows) {
  if (!schema.has(table_name)) schema.set(table_name, new Set());
  schema.get(table_name).add(column_name);
}

console.log(`${schema.size} tables detectees.`);

// Colonnes referencees par le code, table par table.
const sources = [
  join(ROOT, 'lib'),
  join(ROOT, 'app/api'),
].flatMap((dir) => walk(dir).filter((file) => file.endsWith('.ts')));

const problems = [];
const checkedTables = new Set();
const checkedColumns = [];

/** `.from('table')` suivi d'appels chaines, dans le meme fichier. */
const FROM_PATTERN = /\.from\(\s*['"`]([a-z_]+)['"`]\s*\)/g;
// .eq('col', ...) / .gte('col', ...) / .order('col', ...) / .ilike('col', ...)
const FILTER_PATTERN =
  /\.(?:eq|neq|gt|gte|lt|lte|like|ilike|order)\(\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g;

const KNOWN_TABLES = new Set(schema.keys());

for (const file of sources) {
  const code = readFileSync(file, 'utf8');
  const relative = file.slice(ROOT.length);

  for (const match of code.matchAll(FROM_PATTERN)) {
    const table = match[1];
    checkedTables.add(table);
    if (!KNOWN_TABLES.has(table)) {
      problems.push(`${relative} : table inconnue « ${table} »`);
    }
  }

  // Les tables citees dans le fichier servent a valider les colonnes filtrees.
  const tablesInFile = [...code.matchAll(FROM_PATTERN)].map((m) => m[1]).filter((t) => KNOWN_TABLES.has(t));
  if (tablesInFile.length === 0) continue;

  for (const match of code.matchAll(FILTER_PATTERN)) {
    const column = match[1];
    const existsSomewhere = tablesInFile.some((table) => schema.get(table)?.has(column));
    checkedColumns.push(`${column} (${tablesInFile.join('|')})`);
    if (!existsSomewhere) {
      problems.push(
        `${relative} : colonne « ${column} » absente des tables ${tablesInFile.join(', ')}`,
      );
    }
  }
}

// Colonnes declarees dans les configurations de ressources.
const resources = readFileSync(join(ROOT, 'lib/resources.ts'), 'utf8');
const RESOURCE_PATTERN =
  /table:\s*'([a-z_]+)'[\s\S]*?(?=\n};)/g;

for (const block of resources.matchAll(RESOURCE_PATTERN)) {
  const [chunk] = block;
  const table = chunk.match(/table:\s*'([a-z_]+)'/)?.[1];
  if (!table || !KNOWN_TABLES.has(table)) continue;

  const orderColumn = chunk.match(/order:\s*\{\s*column:\s*'([A-Za-z_][A-Za-z0-9_]*)'/)?.[1];
  if (orderColumn && !schema.get(table).has(orderColumn)) {
    problems.push(`lib/resources.ts : tri sur « ${orderColumn} » absent de ${table}`);
  }

  // Colonnes imbriquees du select : `alias:table(col, col)`
  for (const embedded of chunk.matchAll(/([a-z_]+)\(([^)]+)\)/g)) {
    const [, embeddedTable, columnList] = embedded;
    if (!KNOWN_TABLES.has(embeddedTable)) continue;
    for (const column of columnList.split(',').map((c) => c.trim())) {
      if (!column || !schema.get(embeddedTable).has(column)) {
        problems.push(
          `lib/resources.ts : colonne « ${column} » absente de ${embeddedTable}`,
        );
      }
    }
  }
}

console.log(`${checkedTables.size} tables referencees, ${checkedColumns.length} filtres verifies.`);

if (problems.length > 0) {
  console.error('\nIncoherences detectees :');
  for (const problem of [...new Set(problems)]) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log('Toutes les tables et colonnes referencees existent dans le schema.');
await db.close();
