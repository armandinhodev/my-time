import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { IconPicker } from '@/components/IconPicker';
import { iconifyService } from '@/lib/iconify';
import type { Course } from '@/types';
import { Plus, BookOpen, Trash2, Archive, ArchiveRestore, Pencil } from 'lucide-react';

export function CoursesPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newCourseIcon, setNewCourseIcon] = useState<string | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState<string | undefined>(undefined);
  const [isUpdating, setIsUpdating] = useState(false);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  const loadCourses = async () => {
    try {
      const data = await api.listCourses();
      setCourses(data.items);
    } catch (err) {
      console.error('Error loading courses:', err);
      toast({
        title: 'No pudimos cargar los cursos',
        description: err instanceof Error ? err.message : 'Intentá nuevamente en unos segundos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    setIsCreating(true);
    try {
      await api.createCourse({
        title: newCourseTitle,
        description: newCourseDescription || undefined,
        icon: newCourseIcon,
      });
      setNewCourseTitle('');
      setNewCourseDescription('');
      setNewCourseIcon(undefined);
      setDialogOpen(false);
      await loadCourses();
      toast({
        title: 'Curso creado',
        description: 'Ya quedó disponible en tu biblioteca.',
        variant: 'success',
      });
    } catch (err) {
      console.error('Error creating course:', err);
      toast({
        title: 'No pudimos crear el curso',
        description: err instanceof Error ? err.message : 'Revisá los datos e intentá otra vez.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditDescription(course.description || '');
    setEditIcon(course.icon);
    setEditDialogOpen(true);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editTitle.trim()) return;

    setIsUpdating(true);
    try {
      await api.updateCourse(editingCourse.id, {
        title: editTitle,
        description: editDescription || undefined,
        icon: editIcon,
      });
      setEditDialogOpen(false);
      setEditingCourse(null);
      await loadCourses();
      toast({
        title: 'Curso actualizado',
        description: 'Los cambios se guardaron correctamente.',
        variant: 'success',
      });
    } catch (err) {
      console.error('Error updating course:', err);
      toast({
        title: 'No pudimos actualizar el curso',
        description: err instanceof Error ? err.message : 'Intentá nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const openDeleteConfirm = (id: string) => {
    setCourseToDelete(id);
    setConfirmOpen(true);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    const deletedCourseId = courseToDelete;
    // Cerrar el modal inmediatamente
    setConfirmOpen(false);
    setCourseToDelete(null);
    setCourses((prev) => prev.filter((course) => course.id !== deletedCourseId));

    try {
      await api.deleteCourse(deletedCourseId);
      await loadCourses();
      toast({
        title: 'Curso eliminado',
        description: 'El curso se quitó correctamente.',
        variant: 'success',
      });
    } catch (err) {
      console.error('Error deleting course:', err);
      await loadCourses();
      toast({
        title: 'No pudimos eliminar el curso',
        description: err instanceof Error ? err.message : 'Intentá nuevamente.',
        variant: 'destructive',
      });
    }
  };

  const toggleArchiveCourse = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'archived' ? 'active' : 'archived';
      await api.updateCourse(id, { status: newStatus });
      await loadCourses();
      toast({
        title: newStatus === 'archived' ? 'Curso archivado' : 'Curso reactivado',
        description: newStatus === 'archived' ? 'Podés volver a activarlo cuando quieras.' : 'Volvió a estar disponible para estudiar.',
        variant: 'success',
      });
    } catch (err) {
      console.error('Error toggling archive status:', err);
      toast({
        title: 'No pudimos actualizar el curso',
        description: err instanceof Error ? err.message : 'Intentá nuevamente.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mis Cursos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Curso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Curso</DialogTitle>
              <DialogDescription>
                Agregá un nuevo curso para organizar tu estudio
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createCourse}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título</label>
                  <Input
                    placeholder="Ej: React Avanzado"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descripción (opcional)</label>
                  <Input
                    placeholder="Breve descripción del curso"
                    value={newCourseDescription}
                    onChange={(e) => setNewCourseDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Icono (opcional)</label>
                  <IconPicker
                    value={newCourseIcon}
                    onChange={setNewCourseIcon}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creando...' : 'Crear Curso'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              No tenés cursos todavía
            </p>
            <p className="text-sm text-muted-foreground">
              Creá tu primer curso para empezar a organizar tu estudio
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id} className={course.status === 'archived' ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {course.icon && (() => {
                      const parsed = iconifyService.parseIconName(course.icon);
                      return parsed ? (
                        <img
                          src={iconifyService.getIconUrl(parsed.prefix, parsed.name)}
                          alt=""
                          width={24}
                          height={24}
                          className="mt-1 flex-shrink-0"
                        />
                      ) : null;
                    })()}
                    <div>
                      <CardTitle className="text-lg">
                        <Link to={`/courses/${course.id}`} className="hover:underline">
                          {course.title}
                        </Link>
                      </CardTitle>
                      {course.description && (
                        <CardDescription>{course.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(course)}
                      title="Editar curso"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleArchiveCourse(course.id, course.status)}
                      title={course.status === 'archived' ? 'Reactivar curso' : 'Archivar curso'}
                    >
                      {course.status === 'archived' ? (
                        <ArchiveRestore className="h-4 w-4" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => openDeleteConfirm(course.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {course.totals.completedMinutes} min estudiados
                  </span>
                  <span className="capitalize">
                    {course.status === 'active' ? 'Activo' : 'Archivado'}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{course.totals.topicCount} temas</span>
                    <span>{course.totals.progressPercent}% progreso</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${course.totals.progressPercent}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
            <DialogDescription>
              Modificá los datos del curso
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCourse}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input
                  placeholder="Ej: React Avanzado"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción (opcional)</label>
                <Input
                  placeholder="Breve descripción del curso"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Icono (opcional)</label>
                <IconPicker
                  value={editIcon}
                  onChange={setEditIcon}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar Curso"
        description="¿Estás seguro de que querés eliminar este curso? Esta acción no se puede deshacer."
        onConfirm={handleDeleteCourse}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}
