import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StudySessionStats } from '@/types';
import { Clock, BookOpen, Target, TrendingUp } from 'lucide-react';

export function StatsPage() {
  const [stats, setStats] = useState<StudySessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getStudySessionStats()
      .then(setStats)
      .catch((err) => console.error('Error loading stats:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">Error al cargar estadísticas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Estadísticas</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Sesiones
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Minutos Totales
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMinutes}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(stats.totalMinutes / 60 * 10) / 10} horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de Cumplimiento
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stats.completionRate * 100)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Promedio Diario
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.byDay.length > 0
                ? Math.round(stats.totalMinutes / stats.byDay.length)
                : 0} min
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Course */}
      {stats.byCourse.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Por Curso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.byCourse.map((course) => (
              <div key={course.courseId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{course.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {course.minutes} min · {course.sessions} sesiones
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{
                      width: `${stats.totalMinutes > 0 ? (course.minutes / stats.totalMinutes) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* By Day */}
      {stats.byDay.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimos Días</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byDay.slice(-7).map((day) => (
                <div key={day.date} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-24">
                    {new Date(day.date).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <div className="flex-1">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(
                            stats.byDay.reduce((max, d) => Math.max(max, d.minutes), 0),
                            1
                          ) > 0
                            ? (day.minutes /
                                Math.max(
                                  stats.byDay.reduce((max, d) => Math.max(max, d.minutes), 0),
                                  1
                                )) *
                              100
                            : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm w-16 text-right">
                    {day.minutes}m
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
