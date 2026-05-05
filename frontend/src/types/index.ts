export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'archived';
  totals: {
    completedMinutes: number;
    estimatedMinutes: number;
    progressPercent: number;
    topicCount: number;
  };
  createdAt: string;
  updatedAt: string;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  courseId: string;
  title: string;
  order: number;
  estimatedMinutes: number;
  completedMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroState {
  active: boolean;
  startedAt?: string;
  endsAt?: string;
  courseId?: string;
  topicId?: string;
  mode: PomodoroMode;
  durationSec: number;
  remainingSec: number;
  status?: 'running' | 'paused';
}

export interface StudySession {
  id: string;
  courseId: string;
  topicId?: string;
  mode: PomodoroMode | 'manual';
  startedAt: string;
  endedAt: string;
  durationSec: number;
  notes?: string;
  createdAt: string;
}

export interface StudySessionStats {
  totalMinutes: number;
  totalSessions: number;
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  attemptedPomodoros: number;
  completedPomodoros: number;
  byDay: Array<{
    date: string;
    minutes: number;
    hours: number;
  }>;
  byCourse: Array<{
    courseId: string;
    title: string;
    minutes: number;
  }>;
  completionRate: number;
}

export interface CreateCourseDto {
  title: string;
  description?: string;
  status?: 'active' | 'archived';
}

export interface UpdateCourseDto {
  title?: string;
  description?: string;
  status?: 'active' | 'archived';
}

export interface CreateTopicDto {
  title: string;
  estimatedMinutes: number;
  order?: number;
}

export interface UpdateTopicDto {
  title?: string;
  estimatedMinutes?: number;
}

export interface ReorderTopicsDto {
  topicIds: string[];
}

export interface CreateStudySessionDto {
  courseId: string;
  topicId?: string;
  mode: PomodoroMode | 'manual';
  startedAt: string;
  endedAt: string;
  durationSec: number;
  notes?: string;
}

export interface StartPomodoroDto {
  courseId: string;
  topicId?: string;
  mode: PomodoroMode;
  durationSec: number;
}

export interface CompletePomodoroDto {
  courseId: string;
  topicId?: string;
  mode: PomodoroMode;
  startedAt: string;
  endedAt: string;
  durationSec: number;
}
