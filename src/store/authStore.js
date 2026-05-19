import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    user: null,
    session: null,
    tenantId: null,
    role: null,
    loading: true,

    setAuth: ({ user, session, tenantId, role }) =>
        set({ user, session, tenantId, role, loading: false }),

    clearAuth: () =>
        set({ user: null, session: null, tenantId: null, role: null, loading: false }),
}));
