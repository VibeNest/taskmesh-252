import prisma from './prisma';
import { createChildLogger } from './logger';

const log = createChildLogger('search');

export interface SearchResult {
  id: string;
  type: 'task' | 'board' | 'workspace' | 'comment' | 'user';
  title: string;
  description: string | null;
  url: string;
  metadata: Record<string, unknown>;
  rank: number;
}

export interface SearchOptions {
  query: string;
  types?: Array<SearchResult['type']>;
  workspaceId?: string;
  boardId?: string;
  limit?: number;
  offset?: number;
}

export class SearchService {
  private static instance: SearchService;

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  private sanitizeQuery(query: string): string {
    return query
      .replace(/[^\w\s\-@#.]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .join(' & ');
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const { query, types, workspaceId, boardId, limit = 20, offset = 0 } = options;
    const results: SearchResult[] = [];
    const sanitized = this.sanitizeQuery(query);

    if (!sanitized) return [];

    const typesToSearch = types || ['task', 'board', 'workspace', 'comment', 'user'];

    const searchQuery = sanitized.split(' & ').join(' | ');

    await Promise.all(
      typesToSearch.map(async (type) => {
        try {
          switch (type) {
            case 'task':
              results.push(...(await this.searchTasks(searchQuery, workspaceId, boardId)));
              break;
            case 'board':
              results.push(...(await this.searchBoards(searchQuery, workspaceId)));
              break;
            case 'workspace':
              results.push(...(await this.searchWorkspaces(searchQuery)));
              break;
            case 'comment':
              results.push(...(await this.searchComments(searchQuery, boardId)));
              break;
            case 'user':
              results.push(...(await this.searchUsers(searchQuery)));
              break;
          }
        } catch (err) {
          log.error({ err, type, searchQuery }, 'Search error for type');
        }
      })
    );

    results.sort((a, b) => b.rank - a.rank);
    return results.slice(offset, offset + limit);
  }

  private async searchTasks(query: string, workspaceId?: string, boardId?: string): Promise<SearchResult[]> {
    const where: Record<string, unknown> = {
      OR: [
        { title: { search: query } },
        { description: { search: query } },
        { tags: { hasSome: query.split(' | ') } },
      ],
    };

    if (workspaceId) {
      where.column = { board: { workspaceId } };
    }
    if (boardId) {
      where.column = { boardId };
    }

    const tasks = await prisma.task.findMany({
      where: where as any,
      select: {
        id: true,
        title: true,
        description: true,
        column: {
          select: {
            board: {
              select: { id: true, workspaceId: true },
            },
          },
        },
      },
      take: 20,
    });

    return tasks.map((task) => ({
      id: task.id,
      type: 'task' as const,
      title: task.title,
      description: task.description,
      url: `/workspaces/${task.column.board.workspaceId}/boards/${task.column.board.id}?task=${task.id}`,
      metadata: { boardId: task.column.board.id },
      rank: 1,
    }));
  }

  private async searchBoards(query: string, workspaceId?: string): Promise<SearchResult[]> {
    const where: Record<string, unknown> = {
      OR: [
        { name: { search: query } },
        { description: { search: query } },
      ],
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const boards = await prisma.board.findMany({
      where: where as any,
      select: { id: true, name: true, description: true, workspaceId: true },
      take: 20,
    });

    return boards.map((board) => ({
      id: board.id,
      type: 'board' as const,
      title: board.name,
      description: board.description,
      url: `/workspaces/${board.workspaceId}/boards/${board.id}`,
      metadata: { workspaceId: board.workspaceId },
      rank: 2,
    }));
  }

  private async searchWorkspaces(query: string): Promise<SearchResult[]> {
    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { name: { search: query } },
          { description: { search: query } },
        ],
      } as any,
      select: { id: true, name: true, description: true },
      take: 20,
    });

    return workspaces.map((workspace) => ({
      id: workspace.id,
      type: 'workspace' as const,
      title: workspace.name,
      description: workspace.description,
      url: `/workspaces/${workspace.id}/boards`,
      metadata: {},
      rank: 3,
    }));
  }

  private async searchComments(query: string, boardId?: string): Promise<SearchResult[]> {
    const where: Record<string, unknown> = {
      content: { search: query },
    };

    if (boardId) {
      where.task = { column: { boardId } };
    }

    const comments = await prisma.comment.findMany({
      where: where as any,
      select: {
        id: true,
        content: true,
        taskId: true,
        task: {
          select: {
            title: true,
            column: {
              select: {
                board: {
                  select: { id: true, workspaceId: true },
                },
              },
            },
          },
        },
      },
      take: 20,
    });

    return comments.map((comment) => ({
      id: comment.id,
      type: 'comment' as const,
      title: `Comment on "${comment.task.title}"`,
      description: comment.content.substring(0, 200),
      url: `/workspaces/${comment.task.column.board.workspaceId}/boards/${comment.task.column.board.id}?task=${comment.taskId}`,
      metadata: { taskId: comment.taskId },
      rank: 2,
    }));
  }

  private async searchUsers(query: string): Promise<SearchResult[]> {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { search: query } },
          { email: { search: query } },
        ],
      } as any,
      select: { id: true, name: true, email: true, image: true },
      take: 20,
    });

    return users.map((user) => ({
      id: user.id,
      type: 'user' as const,
      title: user.name || user.email,
      description: user.email,
      url: `#`,
      metadata: { image: user.image },
      rank: 1,
    }));
  }
}

export const searchService = SearchService.getInstance();
