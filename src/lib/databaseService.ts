import { supabase } from "@/integrations/supabase/client";

const DB_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-database`;

async function dbRequest(body: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const resp = await fetch(DB_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const result = await resp.json();
  if (!resp.ok) throw new Error(result.error || "Database error");
  return result.data;
}

export interface DBColumn {
  name: string;
  type: string;
  primary?: boolean;
}

export interface DBTable {
  id: string;
  table_name: string;
  columns: DBColumn[];
  created_at: string;
}

export async function listTables(projectId: string): Promise<DBTable[]> {
  return dbRequest({ action: "list_tables", projectId });
}

export async function createTable(projectId: string, tableName: string, columns: DBColumn[]) {
  return dbRequest({ action: "create_table", projectId, tableName, columns });
}

export async function dropTable(projectId: string, tableName: string) {
  return dbRequest({ action: "drop_table", projectId, tableName });
}

export async function getRows(projectId: string, tableName: string) {
  return dbRequest({ action: "get_rows", projectId, tableName });
}

export async function insertRow(projectId: string, tableName: string, row: Record<string, any>) {
  return dbRequest({ action: "insert_row", projectId, tableName, row });
}

export async function updateRow(projectId: string, tableName: string, rowId: string, updates: Record<string, any>) {
  return dbRequest({ action: "update_row", projectId, tableName, rowId, updates });
}

export async function deleteRow(projectId: string, tableName: string, rowId: string) {
  return dbRequest({ action: "delete_row", projectId, tableName, rowId });
}

export async function runSql(projectId: string, sql: string) {
  return dbRequest({ action: "run_sql", projectId, sql });
}
