import OpenAI from 'openai';
import { createChildLogger } from './logger';
import { featureFlags } from './feature-flags';

const log = createChildLogger('ai');

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export class AIService {
  private static instance: AIService;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateTasks(description: string, count = 5): Promise<{ title: string; description: string; priority?: string }[]> {
    const client = getClient();
    if (!client) {
      log.warn('OpenAI API key not configured');
      return this.fallbackGenerateTasks(description, count);
    }

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a project management assistant. Break down work into tasks. Return JSON array.',
          },
          {
            role: 'user',
            content: `Break down this into ${count} tasks as a JSON array with "title", "description", and optional "priority" (low/medium/high/critical): "${description}"`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No content in response');

      const parsed = JSON.parse(content);
      const tasks = parsed.tasks || parsed;
      return Array.isArray(tasks) ? tasks.slice(0, count) : this.fallbackGenerateTasks(description, count);
    } catch (err) {
      log.error({ err }, 'AI task generation failed');
      return this.fallbackGenerateTasks(description, count);
    }
  }

  async generateSprintPlan(
    tasks: { title: string; storyPoints?: number }[],
    developers: string[],
    sprintDuration: string
  ): Promise<{ sprint: string; assignments: Record<string, string[]>; risks: string[] }> {
    const client = getClient();
    if (!client) {
      return {
        sprint: `${sprintDuration} sprint with ${tasks.length} tasks across ${developers.length} developers`,
        assignments: Object.fromEntries(developers.map((d) => [d, []])),
        risks: ['AI sprint planner unavailable - API key not configured'],
      };
    }

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an agile sprint planning assistant. Return JSON.',
          },
          {
            role: 'user',
            content: `Plan a ${sprintDuration} sprint with these tasks: ${JSON.stringify(tasks)}. Developers: ${developers.join(', ')}. Return JSON with "sprint" (name), "assignments" (dev->task titles), "risks" (array).`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No content');

      return JSON.parse(content);
    } catch (err) {
      log.error({ err }, 'Sprint plan generation failed');
      return {
        sprint: `${sprintDuration} sprint`,
        assignments: Object.fromEntries(developers.map((d) => [d, []])),
        risks: ['AI planning failed - using manual assignment'],
      };
    }
  }

  async searchWithAI(
    query: string,
    context: { tasks?: any[]; boards?: any[]; comments?: any[] }
  ): Promise<{ answer: string; results: any[] }> {
    const client = getClient();
    if (!client) {
      return { answer: 'AI search unavailable', results: [] };
    }

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a search assistant. Answer based on provided context. Be concise.',
          },
          {
            role: 'user',
            content: `Query: "${query}"\n\nContext:\nTasks: ${JSON.stringify(context.tasks?.slice(0, 20))}\nBoards: ${JSON.stringify(context.boards?.slice(0, 10))}\nComments: ${JSON.stringify(context.comments?.slice(0, 20))}\n\nAnswer the query and return relevant result IDs. Return JSON with "answer" and "results" (array of ids).`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No content');

      return JSON.parse(content);
    } catch (err) {
      log.error({ err }, 'AI search failed');
      return { answer: 'Search failed', results: [] };
    }
  }

  async generateUserStories(feature: string): Promise<{ role: string; goal: string; benefit: string }[]> {
    const client = getClient();
    if (!client) return [];

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a product manager. Generate user stories in "As a... I want... So that..." format. Return JSON array with "role", "goal", "benefit" fields.',
          },
          {
            role: 'user',
            content: `Generate 5 user stories for: "${feature}"`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];
      const parsed = JSON.parse(content);
      return parsed.stories || parsed.userStories || parsed;
    } catch (err) {
      log.error({ err }, 'User story generation failed');
      return [];
    }
  }

  private fallbackGenerateTasks(description: string, count: number) {
    const lines = description.split(/[.!\n]+/).filter(Boolean);
    return lines.slice(0, count).map((line, i) => ({
      title: `Task ${i + 1}: ${line.trim().substring(0, 80)}`,
      description: line.trim(),
      priority: i === 0 ? 'high' : 'medium',
    }));
  }
}

export const aiService = AIService.getInstance();
