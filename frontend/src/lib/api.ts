import { AuthResponse, Course, Topic, StudySession, StudySessionStats, CreateCourseDto, UpdateCourseDto, CreateTopicDto, UpdateTopicDto, ReorderTopicsDto, CreateStudySessionDto, StartPomodoroDto, CompletePomodoroDto, PomodoroState } from '@/types';

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE = (configuredApiBase && configuredApiBase.length > 0 ? configuredApiBase : '/api').replace(/\/$/, '');

const REFRESH_TOKEN_KEY = 'mytime_refresh_token';

class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private setRefreshToken(token: string | null) {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  private async refreshToken(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    
    this.refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Refresh failed');
        }
        const data: AuthResponse = await res.json();
        this.accessToken = data.accessToken;
        this.setRefreshToken(data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    let response = await fetch(url, config);

    if (response.status === 401 && this.accessToken) {
      try {
        await this.refreshToken();
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...config, headers });
      } catch {
        this.accessToken = null;
        this.setRefreshToken(null);
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.accessToken = data.accessToken;
    this.setRefreshToken(data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.accessToken = data.accessToken;
    this.setRefreshToken(data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async logout(): Promise<void> {
    await this.request<void>('/auth/logout', { method: 'POST' });
    this.accessToken = null;
    this.setRefreshToken(null);
    localStorage.removeItem('user');
  }

  async refresh(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    const data = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    this.accessToken = data.accessToken;
    this.setRefreshToken(data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  // Courses
  async listCourses(): Promise<{ items: Course[]; total: number }> {
    return this.request('/courses');
  }

  async createCourse(payload: CreateCourseDto): Promise<Course> {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getCourse(id: string): Promise<Course> {
    return this.request(`/courses/${id}`);
  }

  async updateCourse(id: string, payload: UpdateCourseDto): Promise<Course> {
    return this.request(`/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteCourse(id: string): Promise<void> {
    return this.request(`/courses/${id}`, { method: 'DELETE' });
  }

  // Topics
  async listTopics(courseId: string): Promise<Topic[]> {
    return this.request(`/courses/${courseId}/topics`);
  }

  async createTopic(courseId: string, payload: CreateTopicDto): Promise<Topic> {
    return this.request(`/courses/${courseId}/topics`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTopic(id: string, payload: UpdateTopicDto): Promise<Topic> {
    return this.request(`/topics/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteTopic(id: string): Promise<void> {
    return this.request(`/topics/${id}`, { method: 'DELETE' });
  }

  async reorderTopics(courseId: string, payload: ReorderTopicsDto): Promise<void> {
    return this.request(`/courses/${courseId}/topics/reorder`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // Study Sessions
  async listStudySessions(params?: {
    courseId?: string;
    topicId?: string;
    from?: string;
    to?: string;
    mode?: string;
    page?: number;
  }): Promise<{ items: StudySession[]; total: number; page: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.courseId) searchParams.set('courseId', params.courseId);
    if (params?.topicId) searchParams.set('topicId', params.topicId);
    if (params?.from) searchParams.set('from', params.from);
    if (params?.to) searchParams.set('to', params.to);
    if (params?.mode) searchParams.set('mode', params.mode);
    if (params?.page) searchParams.set('page', params.page.toString());
    const query = searchParams.toString();
    return this.request(`/study-sessions${query ? `?${query}` : ''}`);
  }

  async createStudySession(payload: CreateStudySessionDto): Promise<StudySession> {
    return this.request('/study-sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getStudySessionStats(): Promise<StudySessionStats> {
    return this.request('/study-sessions/stats');
  }

  // Pomodoro
  async startPomodoro(payload: StartPomodoroDto): Promise<PomodoroState> {
    return this.request('/pomodoro/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getPomodoroState(): Promise<PomodoroState & { expired?: boolean }> {
    return this.request('/pomodoro/state')
  }

  async pausePomodoro(): Promise<PomodoroState> {
    return this.request('/pomodoro/pause', { method: 'POST' })
  }

  async resumePomodoro(): Promise<PomodoroState> {
    return this.request('/pomodoro/resume', { method: 'POST' })
  }

  async completePomodoro(payload: CompletePomodoroDto): Promise<{ studySession: StudySession; state: PomodoroState }> {
    return this.request('/pomodoro/complete', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async cancelPomodoro(): Promise<void> {
    return this.request('/pomodoro/cancel', { method: 'POST' });
  }
}

export const api = new ApiClient();
