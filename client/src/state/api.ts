"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { tokenStore } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  // Helps you fail fast in dev if env isn't being read
  // (Remember: restart `npm run dev` after changing .env)
  console.warn("NEXT_PUBLIC_API_BASE_URL is not set");
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export enum Priority {
  Urgent = "Urgent",
  High = "High",
  Medium = "Medium",
  Low = "Low",
  Backlog = "Backlog",
}

export enum Status {
  ToDo = "To Do",
  WorkInProgress = "Work In Progress",
  UnderReview = "Under Review",
  Completed = "Completed",
}

export interface User {
  userId?: number;
  username: string;
  email?: string;
  profilePictureUrl?: string;
  cognitoId?: string;
  teamId?: number;
}

export interface Attachment {
  id: number;
  fileURL: string;
  fileName: string;
  taskId: number;
  uploadedById: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  tags?: string;
  startDate?: string;
  dueDate?: string;
  points?: number;
  projectId: number;
  authorUserId?: number;
  assignedUserId?: number;

  author?: User;
  assignee?: User;
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface SearchResults {
  tasks?: Task[];
  projects?: Project[];
  users?: User[];
}

export interface Team {
  teamId: number;
  teamName: string;
  productOwnerUserId?: number;
  projectManagerUserId?: number;
}

export const api = createApi({
  reducerPath: "api",
  tagTypes: ["Projects", "Tasks", "Users", "Teams"],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      // IMPORTANT: for API calls use access token
      const token = tokenStore.getAccessToken();

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (build) => ({
    getAuthUser: build.query<
      { userSub: string | null; user: any | null; userDetails: User | null },
      void
    >({
      // If you later create a real backend route, switch to:
      // query: () => "auth/me",
      queryFn: async () => {
        const idToken = tokenStore.getIdToken();
        if (!idToken) {
          return { error: { status: 401, data: "No id_token found" } as any };
        }

        try {
          const parts = idToken.split(".");
          const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
          const payload = JSON.parse(atob(padded));

          const userSub = payload.sub ?? null;
          const email = payload.email ?? null;
          const username = payload["cognito:username"] ?? payload.username ?? null;

          return {
            data: { userSub, user: { username, email }, userDetails: null },
          };
        } catch {
          return { error: { status: 400, data: "Could not decode id_token" } as any };
        }
      },
    }),

    getProjects: build.query<Project[], void>({
      query: () => "projects",
      providesTags: ["Projects"],
    }),

    createProject: build.mutation<Project, Partial<Project>>({
      query: (project) => ({
        url: "projects",
        method: "POST",
        body: project,
      }),
      invalidatesTags: ["Projects"],
    }),

    getTasks: build.query<Task[], { projectId: number }>({
      query: ({ projectId }) => `tasks?projectId=${projectId}`,
      providesTags: (result) =>
        result
          ? result.map(({ id }) => ({ type: "Tasks" as const, id }))
          : [{ type: "Tasks" as const }],
    }),

    createTask: build.mutation<Task, Partial<Task>>({
      query: (task) => ({
        url: "tasks",
        method: "POST",
        body: task,
      }),
      invalidatesTags: ["Tasks"],
    }),

    updateTaskStatus: build.mutation<Task, { taskId: number; status: string }>({
      query: ({ taskId, status }) => ({
        url: `tasks/${taskId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_r, _e, { taskId }) => [{ type: "Tasks", id: taskId }],
    }),

    getUsers: build.query<User[], void>({
      query: () => "users",
      providesTags: ["Users"],
    }),

    getTeams: build.query<Team[], void>({
      query: () => "teams",
      providesTags: ["Teams"],
    }),

    search: build.query<SearchResults, string>({
      query: (query) => `search?query=${encodeURIComponent(query)}`,
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskStatusMutation,
  useSearchQuery,
  useGetUsersQuery,
  useGetTeamsQuery,
  useGetAuthUserQuery, // ✅ THIS is the one you’re missing at runtime
} = api;