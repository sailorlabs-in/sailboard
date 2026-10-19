import { createApi } from '@reduxjs/toolkit/query/react';
import {
  WhiteboardDocument,
  CreateDocumentDto,
  UpdateDocumentDto,
  CanvasElement,
  DocumentExportData,
  Project,
  ProjectMember,
  ProjectRole,
  AuthResponse,
  User,
} from '@rea/shared-types';
import { axiosBaseQuery } from './axiosBaseQuery';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Projects', 'Project', 'Document', 'User'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        data: credentials,
      }),
      invalidatesTags: ['User', 'Projects'],
    }),

    register: builder.mutation<
      AuthResponse,
      { email: string; name: string; password: string }
    >({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        data: userData,
      }),
      invalidatesTags: ['User', 'Projects'],
    }),

    getMe: builder.query<User, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
      providesTags: ['User'],
    }),

    // Project endpoints
    getProjects: builder.query<Project[], void>({
      query: () => ({
        url: '/projects',
        method: 'GET',
      }),
      providesTags: ['Projects'],
    }),

    getProject: builder.query<Project, string>({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Project', id }],
    }),

    createProject: builder.mutation<
      Project,
      { name: string; description?: string; createInitialFile?: boolean }
    >({
      query: (data) => ({
        url: '/projects',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Projects'],
    }),

    deleteProject: builder.mutation<boolean, string>({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Projects'],
    }),

    // Project Member endpoints
    addProjectMember: builder.mutation<
      ProjectMember,
      { projectId: string; email: string; role: ProjectRole }
    >({
      query: ({ projectId, email, role }) => ({
        url: `/projects/${projectId}/members`,
        method: 'POST',
        data: { email, role },
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Project', id: projectId },
        'Projects',
      ],
    }),

    removeProjectMember: builder.mutation<
      boolean,
      { projectId: string; memberId: string }
    >({
      query: ({ projectId, memberId }) => ({
        url: `/projects/${projectId}/members/${memberId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Project', id: projectId },
        'Projects',
      ],
    }),

    // Project File endpoints
    createProjectFile: builder.mutation<
      WhiteboardDocument,
      { projectId: string; title: string }
    >({
      query: ({ projectId, title }) => ({
        url: `/projects/${projectId}/files`,
        method: 'POST',
        data: { title },
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Project', id: projectId },
        'Projects',
      ],
    }),

    deleteProjectFile: builder.mutation<
      boolean,
      { projectId: string; fileId: string }
    >({
      query: ({ projectId, fileId }) => ({
        url: `/projects/${projectId}/files/${fileId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Project', id: projectId },
        'Projects',
      ],
    }),

    // Document endpoints
    getDocuments: builder.query<WhiteboardDocument[], void>({
      query: () => ({
        url: '/documents',
        method: 'GET',
      }),
      providesTags: ['Document'],
    }),

    getDocument: builder.query<WhiteboardDocument, string>({
      query: (id) => ({
        url: `/documents/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Document', id }],
    }),

    updateDocument: builder.mutation<
      WhiteboardDocument,
      { id: string; dto: UpdateDocumentDto }
    >({
      query: ({ id, dto }) => ({
        url: `/documents/${id}`,
        method: 'PUT',
        data: dto,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Document', id },
        'Projects',
      ],
    }),

    deleteDocument: builder.mutation<boolean, string>({
      query: (id) => ({
        url: `/documents/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Document', 'Projects'],
    }),

    syncElements: builder.mutation<
      CanvasElement[],
      { id: string; elements: CanvasElement[] }
    >({
      query: ({ id, elements }) => ({
        url: `/documents/${id}/elements`,
        method: 'POST',
        data: { elements },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Document', id }],
    }),

    exportDocument: builder.query<DocumentExportData, string>({
      query: (id) => ({
        url: `/documents/${id}/export`,
        method: 'GET',
      }),
    }),

    importDocument: builder.mutation<WhiteboardDocument, any>({
      query: (data) => ({
        url: '/documents/import',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Projects', 'Document'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useAddProjectMemberMutation,
  useRemoveProjectMemberMutation,
  useCreateProjectFileMutation,
  useDeleteProjectFileMutation,
  useGetDocumentsQuery,
  useGetDocumentQuery,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
  useSyncElementsMutation,
  useExportDocumentQuery,
  useImportDocumentMutation,
} = apiSlice;
