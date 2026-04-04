import { useState, useEffect, useCallback } from "react";
import {
  Database, Plus, Trash2, Play, Table2, Terminal,
  RefreshCw, X, ChevronDown, Loader2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  listTables, createTable, dropTable, getRows,
  insertRow, updateRow, deleteRow, runSql,
  DBTable, DBColumn,
} from "@/lib/databaseService";

interface DatabasePanelProps {
  projectId: string;
}

const DatabasePanel = ({ projectId }: DatabasePanelProps) => {
  const [tables, setTables] = useState<DBTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<DBColumn[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"tables" | "sql">("tables");

  // Create table state
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newColumns, setNewColumns] = useState<{ name: string; type: string }[]>([
    { name: "", type: "text" },
  ]);

  // SQL editor
  const [sqlQuery, setSqlQuery] = useState("");
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [sqlRunning, setSqlRunning] = useState(false);

  // Add row state
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});

  // Edit cell state
  const [editingCell, setEditingCell] = useState<{ rowId: string; col: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  const loadTables = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTables(projectId);
      setTables(data || []);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const loadTableData = async (tableName: string) => {
    setSelectedTable(tableName);
    setLoading(true);
    try {
      const data = await getRows(projectId, tableName);
      setColumns(data.columns || []);
      setRows(data.rows || []);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTable = async () => {
    if (!newTableName.trim()) return;
    const validCols = newColumns.filter((c) => c.name.trim());
    if (validCols.length === 0) {
      toast({ title: "خطأ", description: "أضف عمود واحد على الأقل", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await createTable(projectId, newTableName.trim(), validCols);
      toast({ title: "تم", description: `تم إنشاء جدول "${newTableName}"` });
      setShowCreateTable(false);
      setNewTableName("");
      setNewColumns([{ name: "", type: "text" }]);
      await loadTables();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDropTable = async (tableName: string) => {
    if (!confirm(`هل تريد حذف الجدول "${tableName}"؟`)) return;
    try {
      await dropTable(projectId, tableName);
      toast({ title: "تم", description: `تم حذف "${tableName}"` });
      if (selectedTable === tableName) {
        setSelectedTable(null);
        setRows([]);
        setColumns([]);
      }
      await loadTables();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const handleInsertRow = async () => {
    if (!selectedTable) return;
    try {
      await insertRow(projectId, selectedTable, newRowData);
      toast({ title: "تم", description: "تم إضافة الصف" });
      setShowAddRow(false);
      setNewRowData({});
      await loadTableData(selectedTable);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!selectedTable) return;
    try {
      await deleteRow(projectId, selectedTable, rowId);
      setRows((prev) => prev.filter((r) => r.id !== rowId));
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const handleCellEdit = async () => {
    if (!editingCell || !selectedTable) return;
    try {
      await updateRow(projectId, selectedTable, editingCell.rowId, {
        [editingCell.col]: editValue,
      });
      setRows((prev) =>
        prev.map((r) =>
          r.id === editingCell.rowId ? { ...r, [editingCell.col]: editValue } : r
        )
      );
      setEditingCell(null);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const handleRunSql = async () => {
    if (!sqlQuery.trim()) return;
    setSqlRunning(true);
    setSqlError(null);
    setSqlResult(null);
    try {
      const result = await runSql(projectId, sqlQuery.trim());
      setSqlResult(result);
      // Refresh tables list after mutations
      await loadTables();
      if (selectedTable) await loadTableData(selectedTable);
    } catch (e: any) {
      setSqlError(e.message);
    } finally {
      setSqlRunning(false);
    }
  };

  const displayCols = columns.filter((c) => !c.primary);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Tabs */}
      <div className="flex items-center border-b border-border px-3 py-1.5 gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTab("tables")}
          className={`h-7 text-xs gap-1.5 ${tab === "tables" ? "bg-secondary text-primary" : "text-muted-foreground"}`}
        >
          <Table2 className="w-3.5 h-3.5" /> الجداول
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTab("sql")}
          className={`h-7 text-xs gap-1.5 ${tab === "sql" ? "bg-secondary text-primary" : "text-muted-foreground"}`}
        >
          <Terminal className="w-3.5 h-3.5" /> SQL Editor
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={loadTables} className="h-7 w-7 p-0 text-muted-foreground">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {tab === "tables" ? (
        <div className="flex flex-1 min-h-0">
          {/* Sidebar: table list */}
          <div className="w-48 border-r border-border flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground">Tables</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateTable(true)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {tables.length === 0 && !loading && (
                <div className="px-3 py-6 text-center">
                  <Database className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">لا توجد جداول</p>
                </div>
              )}
              {tables.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer text-xs hover:bg-secondary/50 group ${
                    selectedTable === t.table_name ? "bg-secondary text-primary" : "text-foreground"
                  }`}
                  onClick={() => loadTableData(t.table_name)}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Table2 className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{t.table_name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDropTable(t.table_name);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Main: table data */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedTable ? (
              <>
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <span className="text-xs font-semibold">{selectedTable}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">{rows.length} rows</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddRow(true);
                        setNewRowData({});
                      }}
                      className="h-6 text-xs gap-1 text-muted-foreground"
                    >
                      <Plus className="w-3 h-3" /> إضافة
                    </Button>
                  </div>
                </div>

                {/* Add row form */}
                {showAddRow && (
                  <div className="px-3 py-2 border-b border-border bg-secondary/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">صف جديد</span>
                      <button onClick={() => setShowAddRow(false)}>
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {displayCols.map((col) => (
                        <div key={col.name}>
                          <label className="text-[10px] text-muted-foreground">{col.name}</label>
                          <Input
                            className="h-7 text-xs"
                            value={newRowData[col.name] || ""}
                            onChange={(e) =>
                              setNewRowData((prev) => ({ ...prev, [col.name]: e.target.value }))
                            }
                            placeholder={col.type}
                          />
                        </div>
                      ))}
                    </div>
                    <Button size="sm" className="h-7 text-xs" onClick={handleInsertRow}>
                      إضافة
                    </Button>
                  </div>
                )}

                {/* Data table */}
                <div className="flex-1 overflow-auto">
                  {rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Database className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-xs">لا توجد بيانات</p>
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="bg-secondary/50 sticky top-0">
                        <tr>
                          {displayCols.map((col) => (
                            <th key={col.name} className="px-3 py-2 text-left font-medium text-muted-foreground border-b border-border">
                              <div className="flex flex-col">
                                <span>{col.name}</span>
                                <span className="text-[10px] font-normal opacity-50">{col.type}</span>
                              </div>
                            </th>
                          ))}
                          <th className="w-8 border-b border-border" />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.id} className="hover:bg-secondary/30 group">
                            {displayCols.map((col) => (
                              <td
                                key={col.name}
                                className="px-3 py-1.5 border-b border-border cursor-pointer"
                                onClick={() => {
                                  setEditingCell({ rowId: row.id, col: col.name });
                                  setEditValue(String(row[col.name] ?? ""));
                                }}
                              >
                                {editingCell?.rowId === row.id && editingCell.col === col.name ? (
                                  <Input
                                    autoFocus
                                    className="h-6 text-xs p-1"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleCellEdit}
                                    onKeyDown={(e) => e.key === "Enter" && handleCellEdit()}
                                  />
                                ) : (
                                  <span className="text-foreground">{String(row[col.name] ?? "—")}</span>
                                )}
                              </td>
                            ))}
                            <td className="px-1 border-b border-border">
                              <button
                                onClick={() => handleDeleteRow(row.id)}
                                className="opacity-0 group-hover:opacity-100 text-destructive p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Database className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">اختر جدول أو أنشئ جدول جديد</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SQL Editor Tab */
        <div className="flex-1 flex flex-col p-3 gap-3 min-h-0">
          <div className="flex flex-col gap-2">
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="SELECT * FROM users LIMIT 10;"
              className="w-full h-28 bg-secondary rounded-lg p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground resize-none outline-none border border-border focus:border-primary transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleRunSql();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Ctrl+Enter لتنفيذ</span>
              <Button
                size="sm"
                onClick={handleRunSql}
                disabled={sqlRunning || !sqlQuery.trim()}
                className="h-7 text-xs gap-1.5"
              >
                {sqlRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                تنفيذ
              </Button>
            </div>
          </div>

          {/* SQL Result */}
          <div className="flex-1 overflow-auto rounded-lg border border-border bg-secondary/30">
            {sqlError && (
              <div className="flex items-start gap-2 p-3 text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <pre className="text-xs whitespace-pre-wrap font-mono">{sqlError}</pre>
              </div>
            )}
            {sqlResult && !sqlError && (
              <div className="p-3">
                {sqlResult.rows ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">{sqlResult.count} نتيجة</p>
                    {sqlResult.rows.length > 0 && (
                      <table className="w-full text-xs">
                        <thead>
                          <tr>
                            {Object.keys(sqlResult.rows[0]).map((k) => (
                              <th key={k} className="px-2 py-1 text-left font-medium text-muted-foreground border-b border-border">
                                {k}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sqlResult.rows.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-secondary/50">
                              {Object.values(row).map((v: any, j) => (
                                <td key={j} className="px-2 py-1 border-b border-border text-foreground">
                                  {String(v ?? "—")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                ) : (
                  <pre className="text-xs text-foreground font-mono whitespace-pre-wrap">
                    {JSON.stringify(sqlResult, null, 2)}
                  </pre>
                )}
              </div>
            )}
            {!sqlResult && !sqlError && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                <Terminal className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs">نتائج الاستعلام ستظهر هنا</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create table modal */}
      {showCreateTable && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">إنشاء جدول جديد</h3>
              <button onClick={() => setShowCreateTable(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">اسم الجدول</label>
              <Input
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="users"
                className="h-8 text-sm mt-1"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">الأعمدة (id يُضاف تلقائياً)</label>
              {newColumns.map((col, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={col.name}
                    onChange={(e) => {
                      const updated = [...newColumns];
                      updated[i].name = e.target.value;
                      setNewColumns(updated);
                    }}
                    placeholder="اسم العمود"
                    className="h-8 text-xs flex-1"
                  />
                  <select
                    value={col.type}
                    onChange={(e) => {
                      const updated = [...newColumns];
                      updated[i].type = e.target.value;
                      setNewColumns(updated);
                    }}
                    className="h-8 text-xs bg-secondary border border-border rounded px-2 text-foreground"
                  >
                    <option value="text">text</option>
                    <option value="integer">integer</option>
                    <option value="boolean">boolean</option>
                    <option value="timestamp">timestamp</option>
                    <option value="uuid">uuid</option>
                    <option value="jsonb">jsonb</option>
                  </select>
                  {newColumns.length > 1 && (
                    <button
                      onClick={() => setNewColumns((prev) => prev.filter((_, j) => j !== i))}
                      className="text-destructive"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewColumns((prev) => [...prev, { name: "", type: "text" }])}
                className="h-7 text-xs gap-1"
              >
                <Plus className="w-3 h-3" /> عمود
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCreateTable(false)} className="h-8 text-xs">
                إلغاء
              </Button>
              <Button size="sm" onClick={handleCreateTable} disabled={loading} className="h-8 text-xs">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "إنشاء"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabasePanel;
