import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Course, Topic, PomodoroMode } from '@/types';
import { Bell, BellOff, Play, Square, Volume2, VolumeX } from 'lucide-react';

const MODES: { value: PomodoroMode; label: string; duration: number }[] = [
  { value: 'focus', label: 'Foco', duration: 25 * 60 },
  { value: 'shortBreak', label: 'Descanso Corto', duration: 5 * 60 },
  { value: 'longBreak', label: 'Descanso Largo', duration: 15 * 60 },
];

interface TimerState {
  active: boolean;
  startedAt: string | null;
  endsAt: string | null;
  courseId: string | null;
  topicId: string | null;
  mode: PomodoroMode;
  durationSec: number;
  remainingSec: number;
}

interface PomodoroPreferences {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

const PREFERENCES_KEY = 'pomodoroPreferences';

function readPreferences(): PomodoroPreferences {
  if (typeof window === 'undefined') {
    return { soundEnabled: true, notificationsEnabled: false };
  }

  const saved = window.localStorage.getItem(PREFERENCES_KEY);
  if (!saved) {
    return { soundEnabled: true, notificationsEnabled: false };
  }

  try {
    return JSON.parse(saved) as PomodoroPreferences;
  } catch {
    return { soundEnabled: true, notificationsEnabled: false };
  }
}

function playCompletionSound() {
  const audioContext = new window.AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.18);

  gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.45);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.45);
  oscillator.onended = () => {
    void audioContext.close();
  };
}

function notifyCompletion(mode: PomodoroMode) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const modeLabel = MODES.find((item) => item.value === mode)?.label ?? 'Pomodoro';
  new Notification('Pomodoro finalizado', {
    body: `${modeLabel} terminado. Ya podés seguir con el próximo bloque.`,
    tag: 'pomodoro-finished',
  });
}

function ToggleRow({
  active,
  onToggle,
  icon: Icon,
  title,
  description,
}: {
  active: boolean;
  onToggle: () => void;
  icon: typeof Bell;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition hover:bg-accent"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-secondary p-2 text-secondary-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </div>
      <div
        className={`relative h-6 w-11 rounded-full transition ${active ? 'bg-primary' : 'bg-muted'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${active ? 'left-5' : 'left-0.5'}`}
        />
      </div>
    </button>
  );
}

export function TimerPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timer, setTimer] = useState<TimerState>({
    active: false,
    startedAt: null,
    endsAt: null,
    courseId: null,
    topicId: null,
    mode: 'focus',
    durationSec: MODES[0].duration,
    remainingSec: MODES[0].duration,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<PomodoroPreferences>(() => readPreferences());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    api.listCourses().then((data) => {
      setCourses(data.items);
      if (data.items.length > 0 && !selectedCourse) {
        setSelectedCourse(data.items[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      api.listTopics(selectedCourse).then(setTopics);
      setSelectedTopic('');
    }
  }, [selectedCourse]);

  useEffect(() => {
    const saved = localStorage.getItem('pomodoroState');
    if (saved) {
      try {
        const state: TimerState = JSON.parse(saved);
        if (state.active && state.endsAt) {
          const now = Date.now();
          const endsAt = new Date(state.endsAt).getTime();
          const remaining = Math.max(0, Math.floor((endsAt - now) / 1000));
          if (remaining > 0) {
            setTimer({ ...state, remainingSec: remaining });
            startInterval(remaining);
          } else {
            completeTimer(state);
          }
        }
      } catch {
        localStorage.removeItem('pomodoroState');
      }
    }
  }, []);

  const startInterval = useCallback((duration: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    const endTime = Date.now() + duration * 1000;
    
    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimer((prev) => ({ ...prev, remainingSec: remaining }));
      
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimer((prev) => {
          completeTimer(prev);
          return { ...prev, active: false, remainingSec: 0 };
        });
      }
    }, 1000);
  }, []);

  const completeTimer = useCallback(async (state: TimerState) => {
    if (!state.courseId || !state.startedAt) return;
    
    try {
      const endedAt = new Date().toISOString();
      await api.completePomodoro({
        courseId: state.courseId,
        topicId: state.topicId || undefined,
        startedAt: state.startedAt,
        endedAt,
        durationSec: state.durationSec - state.remainingSec,
      });
      localStorage.removeItem('pomodoroState');
      if (preferences.soundEnabled) {
        playCompletionSound();
      }
      if (preferences.notificationsEnabled) {
        notifyCompletion(state.mode);
      }
    } catch (err) {
      console.error('Error completing pomodoro:', err);
    }
  }, [preferences.notificationsEnabled, preferences.soundEnabled]);

  const toggleSound = useCallback(() => {
    setPreferences((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const toggleNotifications = useCallback(async () => {
    if (!('Notification' in window)) {
      return;
    }

    if (!preferences.notificationsEnabled) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return;
      }
    }

    setPreferences((prev) => ({
      ...prev,
      notificationsEnabled: !prev.notificationsEnabled,
    }));
  }, [preferences.notificationsEnabled]);

  const startTimer = async () => {
    if (!selectedCourse) return;
    
    setIsLoading(true);
    try {
      const duration = MODES.find((m) => m.value === mode)?.duration || MODES[0].duration;
      const response = await api.startPomodoro({
        courseId: selectedCourse,
        topicId: selectedTopic || undefined,
        mode,
        durationSec: duration,
      });

      const newState: TimerState = {
        active: true,
        startedAt: response.startedAt || new Date().toISOString(),
        endsAt: response.endsAt || new Date(Date.now() + duration * 1000).toISOString(),
        courseId: selectedCourse,
        topicId: selectedTopic || null,
        mode,
        durationSec: duration,
        remainingSec: duration,
      };

      setTimer(newState);
      localStorage.setItem('pomodoroState', JSON.stringify(newState));
      startInterval(duration);
    } catch (err) {
      console.error('Error starting pomodoro:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelTimer = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    try {
      await api.cancelPomodoro();
    } catch (err) {
      console.error('Error canceling pomodoro:', err);
    }

    const duration = MODES.find((m) => m.value === mode)?.duration || MODES[0].duration;
    setTimer({
      active: false,
      startedAt: null,
      endsAt: null,
      courseId: null,
      topicId: null,
      mode,
      durationSec: duration,
      remainingSec: duration,
    });
    localStorage.removeItem('pomodoroState');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = timer.durationSec > 0
    ? ((timer.durationSec - timer.remainingSec) / timer.durationSec) * 100
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Timer Pomodoro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div className="text-7xl font-mono font-bold tracking-wider">
              {formatTime(timer.remainingSec)}
            </div>
            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!timer.active ? (
              <Button
                size="lg"
                onClick={startTimer}
                disabled={!selectedCourse || isLoading}
              >
                <Play className="h-5 w-5 mr-2" />
                Iniciar
              </Button>
            ) : (
              <>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={cancelTimer}
                  disabled={isLoading}
                >
                  <Square className="h-5 w-5 mr-2" />
                  Detener
                </Button>
              </>
            )}
          </div>

          {/* Configuration */}
          {!timer.active && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Modo</label>
                  <Select value={mode} onValueChange={(v: string) => setMode(v as PomodoroMode)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label} ({Math.floor(m.duration / 60)}m)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Curso</label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccioná un curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tema (opcional)</label>
                  <Select 
                    value={selectedTopic || "none"} 
                    onValueChange={(v: string) => setSelectedTopic(v === "none" ? "" : v)} 
                    disabled={!selectedCourse}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccioná un tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-2">
                <ToggleRow
                  active={preferences.soundEnabled}
                  onToggle={toggleSound}
                  icon={preferences.soundEnabled ? Volume2 : VolumeX}
                  title="Sonido al finalizar"
                  description="Reproduce un aviso corto cuando termina el bloque."
                />
                <ToggleRow
                  active={preferences.notificationsEnabled}
                  onToggle={() => {
                    void toggleNotifications();
                  }}
                  icon={preferences.notificationsEnabled ? Bell : BellOff}
                  title="Notificación del navegador"
                  description="Muestra un aviso aunque la pestaña no esté al frente."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
