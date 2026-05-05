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
import type { Course } from '@/types';
import { Plus, BookOpen, Trash2, Archive, ArchiveRestore } from 'lucide-react';

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  const loadCourses = async () => {
    try {
      const data = await api.listCourses();
      setCourses(data.items);
    } catch (err) {
      console.error('Error loading courses:', err);
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
      });
      setNewCourseTitle('');
      setNewCourseDescription('');
      setDialogOpen(false);
      loadCourses();
    } catch (err) {
      console.error('Error creating course:', err);
    } finally {
      setIsCreating(false);
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
    } catch (err) {
      console.error('Error deleting course:', err);
      await loadCourses();
    }
  };

  const toggleArchiveCourse = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'archived' ? 'active' : 'archived';
      await api.updateCourse(id, { status: newStatus });
      loadCourses();
    } catch (err) {
      console.error('Error toggling archive status:', err);
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
                  <div className="flex gap-1">
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
                    {course.completedMinutes} min estudiados
                  </span>
                  <span className="capitalize">
                    {course.status === 'active' ? 'Activo' : 'Archivado'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
