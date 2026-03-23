export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
    accessToken = token;
}

export function getAccessToken(): string | null {
    return accessToken;
}

export function clearAuth() {
    accessToken = null;
    if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_user');
    }
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE}/${endpoint.replace(/^\//, '')}`;
    const token = getAccessToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, {
        ...options,
        headers,
    });
    if (res.status === 401) {
        clearAuth();
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
        throw new Error('Unauthorized');
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || `API Error ${res.status}`);
    }
    return res.json();
}

async function fetchApiFormData(endpoint: string, formData: FormData, method = 'POST') {
    const url = `${API_BASE}/${endpoint.replace(/^\//, '')}`;
    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, {
        method,
        body: formData,
        headers,
    });
    if (res.status === 401) {
        clearAuth();
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
        throw new Error('Unauthorized');
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || `API Error ${res.status}`);
    }
    return res.json();
}

// Auth
export const authApi = {
    login: (email: string, password: string) =>
        fetchApi('auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    logout: () => fetchApi('auth/logout', { method: 'POST' }),
};

// Users (Admin)
export const usersApi = {
    getAll: () => fetchApi('users/admin/all'),
    getById: (id: string) => fetchApi(`users/${id}`),
};

// Analytics
export const analyticsApi = {
    getDashboardStats: () => fetchApi('analytics/admin/dashboard'),
    getSummary: () => fetchApi('analytics/summary'),
    getVisitors: () => fetchApi('analytics/visitors'),
    getSessions: (limit = 50) => fetchApi(`analytics/sessions?limit=${limit}`),
    getRecentSessions: (limit = 20) => fetchApi(`analytics/admin/recent-sessions?limit=${limit}`),
    getPageViews: (limit = 50) => fetchApi(`analytics/pageviews?limit=${limit}`),
    getPopularPages: (limit = 10) => fetchApi(`analytics/admin/popular-pages?limit=${limit}`),
    getAIUsageStats: () => fetchApi('analytics/admin/ai-usage'),
};

// Subscriptions
export const subscriptionsApi = {
    getAll: (country?: string) => fetchApi(`subscriptions${country ? `?country=${country}` : ''}`),
    getById: (id: string) => fetchApi(`subscriptions/${id}`),
    create: (data: any) => fetchApi('subscriptions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi(`subscriptions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    activate: (id: string) => fetchApi(`subscriptions/${id}/activate`, { method: 'PATCH' }),
    deactivate: (id: string) => fetchApi(`subscriptions/${id}/deactivate`, { method: 'PATCH' }),
    delete: (id: string) => fetchApi(`subscriptions/${id}`, { method: 'DELETE' }),
};

// Payments (Admin)
export const paymentsApi = {
    getAnalytics: () => fetchApi('payments/admin/analytics'),
    getAll: (limit = 20, offset = 0) => fetchApi(`payments/admin/all?limit=${limit}&offset=${offset}`),
};

// Subjects
export const subjectsApi = {
    getAll: () => fetchApi('subjects'),
    getById: (id: string) => fetchApi(`subjects/${id}`),
    create: (formData: FormData) => fetchApiFormData('subjects', formData),
    update: (id: string, formData: FormData) => fetchApiFormData(`subjects/${id}`, formData, 'PATCH'),
    delete: (id: string) => fetchApi(`subjects/${id}`, { method: 'DELETE' }),
};

// Resources
export const resourcesApi = {
    getAll: () => fetchApi('resources/admin/all'),
    getById: (id: string) => fetchApi(`resources/${id}`),
    create: (formData: FormData) => fetchApiFormData('resources', formData),
    update: (id: string, formData: FormData) => fetchApiFormData(`resources/${id}`, formData, 'PATCH'),
    delete: (id: string) => fetchApi(`resources/${id}`, { method: 'DELETE' }),
};

// Lessons
export const lessonsApi = {
    getBySubject: (subjectId: string) => fetchApi(`lessons/subject/${subjectId}`),
    getById: (id: string) => fetchApi(`lessons/${id}`),
    create: (data: any) => fetchApi('lessons', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi(`lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`lessons/${id}`, { method: 'DELETE' }),
};

// Quizzes
export const quizzesApi = {
    getByLesson: (lessonId: string) => fetchApi(`quizzes/lesson/${lessonId}`),
    getById: (id: string) => fetchApi(`quizzes/${id}`),
    create: (data: any) => fetchApi('quizzes', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`quizzes/${id}`, { method: 'DELETE' }),
};

// Discounts & Coupons (Admin)
export const discountsApi = {
    getAll: (type?: string, isActive?: boolean) => {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (isActive !== undefined) params.append('isActive', String(isActive));
        const q = params.toString();
        return fetchApi(`discounts/admin/coupons${q ? `?${q}` : ''}`);
    },
    getAnalytics: () => fetchApi('discounts/admin/analytics'),
    getStats: (id: string) => fetchApi(`discounts/admin/coupons/${id}/stats`),
    create: (data: any) => fetchApi('discounts/admin/coupons', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi(`discounts/admin/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    toggle: (id: string) => fetchApi(`discounts/admin/coupons/${id}/toggle`, { method: 'PATCH' }),
    delete: (id: string) => fetchApi(`discounts/admin/coupons/${id}`, { method: 'DELETE' }),
    generateReferral: (data: any) => fetchApi('discounts/admin/coupons/generate-referral', { method: 'POST', body: JSON.stringify(data) }),
};
