/**
 * Ordre volontairement compatible avec les cles etrangeres: les tables
 * referencees sont restaurees avant celles qui les referencent.
 */
export const BACKUP_TABLES = [
  { key: 'thirdParties', table: 'third_parties' },
  { key: 'personnel', table: 'personnel' },
  { key: 'drivers', table: 'drivers' },
  { key: 'driverTransactions', table: 'driver_transactions' },
  { key: 'trucks', table: 'trucks' },
  { key: 'trips', table: 'trips' },
  { key: 'expenses', table: 'expenses' },
  { key: 'invoices', table: 'invoices' },
  { key: 'bankAccounts', table: 'bank_accounts' },
  { key: 'bankTransactions', table: 'bank_transactions' },
  { key: 'parcelExpeditions', table: 'parcel_expeditions' },
] as const;

export type BackupKey = (typeof BACKUP_TABLES)[number]['key'];
