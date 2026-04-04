import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, projectId, tableName, columns, row, rowId, updates, sql } = body;

    // Verify project ownership
    const { data: project, error: projError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!project || projError) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any = null;

    switch (action) {
      case "list_tables": {
        const { data, error } = await supabase
          .from("project_tables")
          .select("id, table_name, columns, created_at")
          .eq("project_id", projectId)
          .order("created_at");
        if (error) throw error;
        result = data;
        break;
      }

      case "create_table": {
        if (!tableName || !columns || !Array.isArray(columns)) {
          return res(400, { error: "tableName and columns[] required" });
        }
        // Add id column automatically
        const fullColumns = [
          { name: "id", type: "uuid", primary: true },
          ...columns.filter((c: any) => c.name !== "id"),
        ];
        const { data, error } = await supabase
          .from("project_tables")
          .insert({
            project_id: projectId,
            table_name: tableName,
            columns: fullColumns,
            rows: [],
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "drop_table": {
        const { error } = await supabase
          .from("project_tables")
          .delete()
          .eq("project_id", projectId)
          .eq("table_name", tableName);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case "get_rows": {
        const { data, error } = await supabase
          .from("project_tables")
          .select("rows, columns")
          .eq("project_id", projectId)
          .eq("table_name", tableName)
          .maybeSingle();
        if (error) throw error;
        if (!data) return res(404, { error: "Table not found" });
        result = { rows: data.rows, columns: data.columns };
        break;
      }

      case "insert_row": {
        const { data: table, error: fetchErr } = await supabase
          .from("project_tables")
          .select("id, rows")
          .eq("project_id", projectId)
          .eq("table_name", tableName)
          .maybeSingle();
        if (fetchErr || !table) return res(404, { error: "Table not found" });

        const newRow = { id: crypto.randomUUID(), ...row };
        const updatedRows = [...(table.rows as any[] || []), newRow];

        const { error: updateErr } = await supabase
          .from("project_tables")
          .update({ rows: updatedRows, updated_at: new Date().toISOString() })
          .eq("id", table.id);
        if (updateErr) throw updateErr;
        result = newRow;
        break;
      }

      case "update_row": {
        const { data: table, error: fetchErr } = await supabase
          .from("project_tables")
          .select("id, rows")
          .eq("project_id", projectId)
          .eq("table_name", tableName)
          .maybeSingle();
        if (fetchErr || !table) return res(404, { error: "Table not found" });

        const rows = (table.rows as any[] || []).map((r: any) =>
          r.id === rowId ? { ...r, ...updates } : r
        );

        const { error: updateErr } = await supabase
          .from("project_tables")
          .update({ rows, updated_at: new Date().toISOString() })
          .eq("id", table.id);
        if (updateErr) throw updateErr;
        result = { success: true };
        break;
      }

      case "delete_row": {
        const { data: table, error: fetchErr } = await supabase
          .from("project_tables")
          .select("id, rows")
          .eq("project_id", projectId)
          .eq("table_name", tableName)
          .maybeSingle();
        if (fetchErr || !table) return res(404, { error: "Table not found" });

        const rows = (table.rows as any[] || []).filter((r: any) => r.id !== rowId);

        const { error: updateErr } = await supabase
          .from("project_tables")
          .update({ rows, updated_at: new Date().toISOString() })
          .eq("id", table.id);
        if (updateErr) throw updateErr;
        result = { success: true };
        break;
      }

      case "run_sql": {
        // Simple SQL-like query parser for SELECT, INSERT, DELETE, CREATE TABLE
        result = await executeSql(supabase, projectId, sql);
        break;
      }

      default:
        return res(400, { error: `Unknown action: ${action}` });
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("manage-database error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function res(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function executeSql(supabase: any, projectId: string, sql: string) {
  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();

  // CREATE TABLE
  if (upper.startsWith("CREATE TABLE")) {
    const match = trimmed.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]+)\)/i);
    if (!match) throw new Error("Invalid CREATE TABLE syntax");
    const tName = match[1];
    const colDefs = match[2].split(",").map((c: string) => {
      const parts = c.trim().split(/\s+/);
      return { name: parts[0], type: parts[1] || "text" };
    }).filter((c: any) => c.name.toUpperCase() !== "PRIMARY" && c.name !== "");

    const { data, error } = await supabase
      .from("project_tables")
      .insert({
        project_id: projectId,
        table_name: tName,
        columns: [{ name: "id", type: "uuid", primary: true }, ...colDefs.filter((c: any) => c.name !== "id")],
        rows: [],
      })
      .select()
      .single();
    if (error) throw error;
    return { message: `Table "${tName}" created`, table: data };
  }

  // DROP TABLE
  if (upper.startsWith("DROP TABLE")) {
    const match = trimmed.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i);
    if (!match) throw new Error("Invalid DROP TABLE syntax");
    const { error } = await supabase
      .from("project_tables")
      .delete()
      .eq("project_id", projectId)
      .eq("table_name", match[1]);
    if (error) throw error;
    return { message: `Table "${match[1]}" dropped` };
  }

  // SELECT
  if (upper.startsWith("SELECT")) {
    const match = trimmed.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);
    if (!match) throw new Error("Invalid SELECT syntax");
    const [, selectCols, tName, whereClause, limit] = match;

    const { data: table, error } = await supabase
      .from("project_tables")
      .select("rows, columns")
      .eq("project_id", projectId)
      .eq("table_name", tName)
      .maybeSingle();
    if (error) throw error;
    if (!table) throw new Error(`Table "${tName}" not found`);

    let rows = table.rows as any[] || [];

    // Simple WHERE (col = 'value')
    if (whereClause) {
      const wMatch = whereClause.match(/(\w+)\s*=\s*'([^']+)'/);
      if (wMatch) {
        rows = rows.filter((r: any) => String(r[wMatch[1]]) === wMatch[2]);
      }
    }

    if (limit) rows = rows.slice(0, parseInt(limit));

    // Column selection
    if (selectCols.trim() !== "*") {
      const cols = selectCols.split(",").map((c: string) => c.trim());
      rows = rows.map((r: any) => {
        const filtered: any = {};
        cols.forEach((c) => { filtered[c] = r[c]; });
        return filtered;
      });
    }

    return { rows, count: rows.length };
  }

  // INSERT
  if (upper.startsWith("INSERT")) {
    const match = trimmed.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (!match) throw new Error("Invalid INSERT syntax");
    const [, tName, colStr, valStr] = match;
    const cols = colStr.split(",").map((c: string) => c.trim());
    const vals = valStr.split(",").map((v: string) => v.trim().replace(/^'|'$/g, ""));

    const { data: table, error: fetchErr } = await supabase
      .from("project_tables")
      .select("id, rows")
      .eq("project_id", projectId)
      .eq("table_name", tName)
      .maybeSingle();
    if (fetchErr || !table) throw new Error(`Table "${tName}" not found`);

    const newRow: any = { id: crypto.randomUUID() };
    cols.forEach((c, i) => { newRow[c] = vals[i]; });

    const updatedRows = [...(table.rows as any[] || []), newRow];
    const { error: updateErr } = await supabase
      .from("project_tables")
      .update({ rows: updatedRows, updated_at: new Date().toISOString() })
      .eq("id", table.id);
    if (updateErr) throw updateErr;
    return { message: "Row inserted", row: newRow };
  }

  // DELETE
  if (upper.startsWith("DELETE")) {
    const match = trimmed.match(/DELETE\s+FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*'([^']+)'/i);
    if (!match) throw new Error("Invalid DELETE syntax. Use: DELETE FROM table WHERE col = 'value'");
    const [, tName, col, val] = match;

    const { data: table, error: fetchErr } = await supabase
      .from("project_tables")
      .select("id, rows")
      .eq("project_id", projectId)
      .eq("table_name", tName)
      .maybeSingle();
    if (fetchErr || !table) throw new Error(`Table "${tName}" not found`);

    const rows = (table.rows as any[] || []).filter((r: any) => String(r[col]) !== val);
    const { error: updateErr } = await supabase
      .from("project_tables")
      .update({ rows, updated_at: new Date().toISOString() })
      .eq("id", table.id);
    if (updateErr) throw updateErr;
    return { message: `Deleted rows where ${col} = '${val}'` };
  }

  throw new Error("Unsupported SQL. Supported: CREATE TABLE, DROP TABLE, SELECT, INSERT, DELETE");
}
