import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  FolderOpen,
  LogOut,
  Loader2,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const Projects = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, description, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async () => {
    if (!projectName.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({ name: projectName.trim(), description: projectDesc.trim() || null, user_id: user!.id })
      .select("id")
      .single();

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      setShowNewDialog(false);
      setProjectName("");
      setProjectDesc("");
      navigate(`/project/${data.id}`);
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingProject || !projectName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("projects")
      .update({ name: projectName.trim(), description: projectDesc.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", editingProject.id);

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      setEditingProject(null);
      setProjectName("");
      setProjectDesc("");
      fetchProjects();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "تم الحذف" });
    }
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDesc(project.description || "");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">مشاريعي</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-muted-foreground">
          <LogOut className="w-4 h-4" />
          خروج
        </Button>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {/* New project button */}
        <Button onClick={() => { setProjectName(""); setProjectDesc(""); setShowNewDialog(true); }} className="mb-6 gap-2">
          <Plus className="w-4 h-4" />
          مشروع جديد
        </Button>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">لا توجد مشاريع بعد</p>
            <p className="text-sm text-muted-foreground">أنشئ مشروعاً جديداً للبدء</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground truncate">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{project.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(project.updated_at)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => { e.stopPropagation(); openEdit(project); }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>مشروع جديد</DialogTitle>
            <DialogDescription>أدخل اسم ووصف المشروع</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input
              placeholder="اسم المشروع"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="text-right"
              autoFocus
            />
            <Input
              placeholder="وصف (اختياري)"
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              className="text-right"
            />
            <Button onClick={handleCreate} disabled={!projectName.trim() || saving} className="w-full">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              إنشاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={!!editingProject} onOpenChange={(v) => { if (!v) setEditingProject(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل المشروع</DialogTitle>
            <DialogDescription>عدّل اسم ووصف المشروع</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input
              placeholder="اسم المشروع"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="text-right"
              autoFocus
            />
            <Input
              placeholder="وصف (اختياري)"
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              className="text-right"
            />
            <Button onClick={handleUpdate} disabled={!projectName.trim() || saving} className="w-full">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
