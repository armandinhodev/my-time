import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import type { Course, Topic } from '@/types';
import { Plus, ArrowLeft, Trash2, GripVertical, Clock, Pencil } from 'lucide-react';

export function CourseDetailPage() {
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicMinutes, setNewTopicMinutes] = useState('25');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editTopicTitle, setEditTopicTitle] = useState('');
  const [editTopicMinutes, setEditTopicMinutes] = useState('25');
  const [isUpdating, setIsUpdating] = useState(false);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      const [courseData, topicsData] = await Promise.all([
        api.getCourse(id),
        api.listTopics(id),
      ]);
      setCourse(courseData);
      setTopics(topicsData);
    } catch (err) {
      console.error('Error loading course:', err);
      toast({
        title: 'No pudimos cargar el curso',
        description: err instanceof Error ? err.message : 'Intentá nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const createTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newTopicTitle.trim()) return;

    setIsCreating(true);
    try {
      const createdTopic = await api.createTopic(id, {
        title: newTopicTitle,
        estimatedMinutes: parseInt(newTopicMinutes) || 25,
        order: topics.length,
      });
      setTopics((prev) => [...prev, createdTopic].sort((a, b) => a.order - b.order));
      setNewTopicTitle('');
      setNewTopicMinutes('25');
      setDialogOpen(false);
      await loadData();
      toast({
        title: 'Tema creado',
        description: 'El tema ya quedó asociado al curso.',
        variant: 'success',
      });
    } catch (err) {
      console.error('Error creating topic:', err);
      toast({
        title: 'No pudimos crear el tema',
        description: err instanceof Error ? err.message : 'Revisá los datos e intentá otra vez.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const openEditDialog = (topic: Topic) => {
    setEditingTopic(topic);
    setEditTopicTitle(topic.title);
    setEditTopicMinutes(topic.estimatedMinutes.toString());
    setEditDialogOpen(true);
  };

  const handleUpdateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic || !editTopicTitle.trim()) return;

    setIsUpdating(true);
    try {
      await api.updateTopic(editingTopic.id, {
        title: editTopicTitle,
        estimatedMinutes: parseInt(editTopicMinutes) || 25,
      });
      setEditDialogOpen(false);
      setEditingTopic(null);
      await loadData();
      toast({
        title: 'Tema actualizado',
        description: 'Los cambios se guardaron correctamente.',
        variant: 'success',
      });
    } catch (err) {
      console.error('Error updating topic:', err);
      toast({
        title: 'No pudimos actualizar el tema',
        description: err instanceof Error ? err.message : 'Intentá nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const openDeleteConfirm = (topicId: string) => {
    setTopicToDelete(topicId);
    setConfirmOpen(true);
  };

  const handleDeleteTopic = async () => {
    if (!topicToDelete) return;
    const deletedTopicId = topicToDelete;
    // Cerrar el modal inmediatamente
    setConfirmOpen(false);
    setTopicToDelete(null);
    setTopics((prev) => prev.filter((topic) => topic.id !== deletedTopicId));

    try {
      await api.deleteTopic(deletedTopicId);
      await loadData();
      toast({
        title: 'Tema eliminado',
        description: 'Se quitó correctamente del curso.',
        variant: 'success',
      });
    } catch (err) {
      console.error('Error deleting topic:', err);
      await loadData();
      toast({
        title: 'No pudimos eliminar el tema',
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

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">Curso no encontrado</p>
        <Button variant="link" onClick={() => navigate('/courses')}>
          Volver a cursos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/courses')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          {course.description && (
            <p className="text-muted-foreground">{course.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Temas</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Tema
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Tema</DialogTitle>
              <DialogDescription>
                Agregá un tema a este curso
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createTopic}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título</label>
                  <Input
                    placeholder="Ej: Introducción a Hooks"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Minutos estimados</label>
                  <Input
                    type="number"
                    min="1"
                    value={newTopicMinutes}
                    onChange={(e) => setNewTopicMinutes(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creando...' : 'Agregar Tema'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {topics.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              No hay temas en este curso
            </p>
            <p className="text-sm text-muted-foreground">
              Agregá tu primer tema para empezar a estudiar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {topics.map((topic) => (
            <Card key={topic.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{topic.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {topic.estimatedMinutes} min estimados
                    {topic.completedMinutes && topic.completedMinutes > 0 && (
                      <span> · {topic.completedMinutes} min completados</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(topic)}
                  title="Editar tema"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => openDeleteConfirm(topic.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Topic Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tema</DialogTitle>
            <DialogDescription>
              Modificá los datos del tema
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTopic}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input
                  placeholder="Ej: Introducción a Hooks"
                  value={editTopicTitle}
                  onChange={(e) => setEditTopicTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Minutos estimados</label>
                <Input
                  type="number"
                  min="1"
                  value={editTopicMinutes}
                  onChange={(e) => setEditTopicMinutes(e.target.value)}
                  required
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
        title="Eliminar Tema"
        description="¿Estás seguro de que querés eliminar este tema? Esta acción no se puede deshacer."
        onConfirm={handleDeleteTopic}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}
