export type CourseStatus = 'active' | 'archived';
export type SessionMode = 'focus' | 'shortBreak' | 'longBreak' | 'manual';

export interface Topic {
  id: string;
  courseId: string;
  title: string;
  order: number;
  estimatedMinutes: number;
  completedMinutes: number;
  deletedAt?: string | null;
}

export interface Course {
  id: string;
  title: string;
  description?: string | null;
  status: CourseStatus;
  icon?: string | null;
  totals: {
    completedMinutes: number;
    estimatedMinutes: number;
    progressPercent: number;
    topicCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  courseId: string;
  topicId?: string | null;
  mode: SessionMode;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  notes?: string | null;
}
