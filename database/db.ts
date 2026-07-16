import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';
import { DB_NAME } from '@/constants';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await _db.execAsync('PRAGMA journal_mode = WAL;');
  await _db.execAsync('PRAGMA foreign_keys = ON;');
  return _db;
}

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();
  // Ejecutar cada sentencia CREATE TABLE por separado
  const statements = CREATE_TABLES_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const sql of statements) {
    await db.execAsync(sql + ';');
  }
}

export async function executeQuery<T = unknown>(
  sql: string,
  params: (string | number | null)[] = []
): Promise<T[]> {
  const db = await getDatabase();
  const result = await db.getAllAsync<T>(sql, params);
  return result;
}

export async function executeRun(
  sql: string,
  params: (string | number | null)[] = []
): Promise<SQLite.SQLiteRunResult> {
  const db = await getDatabase();
  return db.runAsync(sql, params);
}

export async function executeFirst<T = unknown>(
  sql: string,
  params: (string | number | null)[] = []
): Promise<T | null> {
  const db = await getDatabase();
  return db.getFirstAsync<T>(sql, params);
}

export async function withTransaction<T>(
  fn: () => Promise<T>
): Promise<T> {
  const db = await getDatabase();
  let result: T;
  await db.withTransactionAsync(async () => {
    result = await fn();
  });
  return result!;
}
