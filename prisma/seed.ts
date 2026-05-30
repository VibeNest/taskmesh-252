import { PrismaClient, Role, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TaskMesh...');

  const hashedPassword = await bcrypt.hash('password123', 12);
  const demoPassword = await bcrypt.hash('demo1234', 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        email: 'john@example.com',
        name: 'John Doe',
        password: hashedPassword,
        jobTitle: 'Engineering Lead',
        department: 'Engineering',
        bio: 'Full-stack developer passionate about building great products.',
      },
    }),
    prisma.user.upsert({
      where: { email: 'jane@example.com' },
      update: {},
      create: {
        email: 'jane@example.com',
        name: 'Jane Smith',
        password: hashedPassword,
        jobTitle: 'Product Manager',
        department: 'Product',
        bio: 'Turning ideas into reality, one sprint at a time.',
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: {
        email: 'bob@example.com',
        name: 'Bob Wilson',
        password: hashedPassword,
        jobTitle: 'Designer',
        department: 'Design',
        bio: 'Pixel-perfect interfaces that users love.',
      },
    }),
    prisma.user.upsert({
      where: { email: 'demo@taskmesh.io' },
      update: {},
      create: {
        email: 'demo@taskmesh.io',
        name: 'Demo User',
        password: demoPassword,
        jobTitle: 'Demo Account',
        bio: 'Guest account for exploring TaskMesh.',
      },
    }),
  ]);

  const [john, jane, bob] = users;
  console.log(`✅ Created ${users.length} users`);

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'taskmesh-demo' },
    update: {},
    create: {
      name: 'TaskMesh Demo',
      slug: 'taskmesh-demo',
      description: 'Demo workspace showcasing TaskMesh features — boards, sprints, labels, and real-time collaboration.',
      ownerId: john.id,
      members: {
        create: [
          { userId: john.id, role: Role.OWNER },
          { userId: jane.id, role: Role.ADMIN },
          { userId: bob.id, role: Role.MEMBER },
        ],
      },
    },
  });

  console.log('✅ Created workspace');

  const labels = await Promise.all([
    prisma.label.create({ data: { name: 'Frontend', color: '#3b82f6', workspaceId: workspace.id } }),
    prisma.label.create({ data: { name: 'Backend', color: '#10b981', workspaceId: workspace.id } }),
    prisma.label.create({ data: { name: 'Design', color: '#f59e0b', workspaceId: workspace.id } }),
    prisma.label.create({ data: { name: 'Bug', color: '#ef4444', workspaceId: workspace.id } }),
    prisma.label.create({ data: { name: 'Feature', color: '#8b5cf6', workspaceId: workspace.id } }),
    prisma.label.create({ data: { name: 'Documentation', color: '#06b6d4', workspaceId: workspace.id } }),
    prisma.label.create({ data: { name: 'Urgent', color: '#dc2626', workspaceId: workspace.id } }),
  ]);

  console.log('✅ Created 7 labels');

  const sprint = await prisma.sprint.create({
    data: {
      name: 'Sprint 4: Q3 Release',
      description: 'Focus on the Q3 feature release — new dashboard, API improvements, and performance optimizations.',
      startDate: new Date('2026-05-25'),
      endDate: new Date('2026-06-07'),
      status: 'ACTIVE',
      goal: 'Ship the new analytics dashboard, complete API v2 migration, and hit <200ms p95 latency.',
      workspaceId: workspace.id,
    },
  });

  console.log('✅ Created active sprint');

  const boardsData = [
    {
      name: 'Product Development',
      description: 'Core product development tasks and feature work.',
      color: '#6366f1',
      icon: 'Code2',
      columns: ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'],
    },
    {
      name: 'Marketing & Content',
      description: 'Marketing campaigns, content creation, and social media.',
      color: '#10b981',
      icon: 'Megaphone',
      columns: ['Ideas', 'Planned', 'Writing', 'Design Review', 'Published'],
    },
    {
      name: 'Bug Tracker',
      description: 'Bug reports and hotfix tracking.',
      color: '#ef4444',
      icon: 'Bug',
      columns: ['Reported', 'Triaged', 'In Progress', 'Fixed', 'Verified'],
    },
  ];

  const taskTemplates = [
    {
      title: 'Design new analytics dashboard',
      description: 'Create wireframes, high-fidelity mockups, and interactive prototype for the new analytics dashboard featuring real-time metrics, custom date ranges, and exportable reports.',
      priority: 'high',
      column: 1,
      creator: john,
      assignee: bob,
      labels: ['Design', 'Feature'],
      tags: ['dashboard', 'analytics'],
      subtasks: ['Research competitor dashboards', 'Create wireframes', 'Design high-fidelity mockups', 'User testing'],
    },
    {
      title: 'Implement user authentication flow',
      description: 'Set up OAuth providers (Google, GitHub), email/password auth, session management with JWT, and rate limiting for login attempts.',
      priority: 'high',
      column: 2,
      creator: john,
      assignee: john,
      labels: ['Backend', 'Feature'],
      tags: ['auth', 'security'],
      subtasks: ['Configure OAuth providers', 'Implement JWT session handling', 'Add rate limiting', 'Write auth tests'],
    },
    {
      title: 'Build real-time collaboration engine',
      description: 'Implement WebSocket-based real-time presence, typing indicators, and live task updates using Socket.IO with Redis pub/sub.',
      priority: 'high',
      column: 2,
      creator: jane,
      assignee: john,
      labels: ['Backend', 'Feature'],
      tags: ['websockets', 'realtime'],
      subtasks: ['Set up Socket.IO server', 'Implement presence tracking', 'Add typing indicators', 'Handle reconnection'],
    },
    {
      title: 'Write API documentation',
      description: 'Document all REST and WebSocket API endpoints using OpenAPI 3.1 spec with interactive examples and Postman collection.',
      priority: 'medium',
      column: 0,
      creator: jane,
      assignee: null,
      labels: ['Documentation'],
      tags: ['docs', 'api'],
      subtasks: ['Document REST endpoints', 'Document WebSocket events', 'Create Postman collection', 'Review with team'],
    },
    {
      title: 'Database query optimization',
      description: 'Profile slow queries, add composite indexes, implement connection pooling, and reduce N+1 queries across the board and task endpoints.',
      priority: 'medium',
      column: 0,
      creator: john,
      assignee: bob,
      labels: ['Backend'],
      tags: ['performance', 'database'],
      subtasks: ['Profile slow queries', 'Add indexes', 'Fix N+1 queries', 'Benchmark results'],
    },
    {
      title: 'Set up CI/CD with GitHub Actions',
      description: 'Configure automated testing, linting, security scanning, Docker build, and deployment pipeline for staging and production environments.',
      priority: 'medium',
      column: 0,
      creator: john,
      assignee: bob,
      labels: ['Backend', 'Documentation'],
      tags: ['devops', 'ci-cd'],
      subtasks: ['Configure test workflow', 'Add Docker build step', 'Set up deployment', 'Document pipeline'],
    },
    {
      title: 'Fix drag-and-drop reordering bug',
      description: 'Tasks sometimes jump to wrong positions when dragged rapidly between columns. Investigate dnd-kit configuration and position calculation logic.',
      priority: 'high',
      column: 3,
      creator: bob,
      assignee: john,
      labels: ['Bug', 'Frontend'],
      tags: ['bug', 'dnd'],
      subtasks: ['Reproduce the bug', 'Investigate position logic', 'Fix race condition', 'Add E2E test'],
    },
    {
      title: 'Add dark mode support',
      description: 'Implement theme switching with next-themes, dark mode color palette for all components, and persistent user preference.',
      priority: 'low',
      column: 0,
      creator: bob,
      assignee: bob,
      labels: ['Frontend', 'Feature'],
      tags: ['ui', 'theme'],
      subtasks: ['Define dark mode palette', 'Update components', 'Add theme toggle', 'Test all pages'],
    },
    {
      title: 'Create onboarding flow',
      description: 'Design and implement a first-run experience with workspace creation wizard, sample project import, and interactive tooltips.',
      priority: 'medium',
      column: 0,
      creator: jane,
      assignee: null,
      labels: ['Frontend', 'Design'],
      tags: ['onboarding', 'ux'],
      subtasks: ['Design onboarding flow', 'Build wizard component', 'Add sample data import', 'Create tooltips'],
    },
    {
      title: 'Implement file attachments',
      description: 'Add drag-and-drop file upload support with S3 presigned URLs, image previews, and file type validation.',
      priority: 'medium',
      column: 0,
      creator: john,
      assignee: bob,
      labels: ['Frontend', 'Backend'],
      tags: ['files', 'storage'],
      subtasks: ['Set up S3 presigned URLs', 'Build upload component', 'Add image previews', 'Validate file types'],
    },
    {
      title: 'Q3 Blog Post: TaskMesh Launch',
      description: 'Write and publish the official TaskMesh launch blog post covering features, architecture, and the team story.',
      priority: 'medium',
      column: 0,
      creator: jane,
      assignee: null,
      labels: ['Documentation'],
      tags: ['content', 'blog'],
      subtasks: ['Outline post', 'Write draft', 'Get team review', 'Publish'],
    },
    {
      title: 'Holiday campaign landing page',
      description: 'Design and build a landing page for the Q3 holiday marketing campaign with A/B testing variants.',
      priority: 'low',
      column: 1,
      creator: jane,
      assignee: bob,
      labels: ['Design', 'Feature'],
      tags: ['marketing', 'campaign'],
      subtasks: ['Design mockups', 'Build landing page', 'Set up A/B testing', 'Launch'],
    },
    {
      title: 'Critical: Database connection leak',
      description: 'Production database connections are not being released properly under load, causing connection pool exhaustion after ~1000 concurrent requests.',
      priority: 'urgent',
      column: 2,
      creator: john,
      assignee: john,
      labels: ['Bug', 'Backend', 'Urgent'],
      tags: ['critical', 'database', 'production'],
      subtasks: ['Diagnose connection handling', 'Fix pool management', 'Add monitoring', 'Load test fix'],
    },
    {
      title: 'Login page not rendering on Safari',
      description: 'The gradient background and blur effects break on Safari 15 and below. Need a fallback layout.',
      priority: 'high',
      column: 3,
      creator: bob,
      assignee: bob,
      labels: ['Bug', 'Frontend'],
      tags: ['browser', 'safari', 'css'],
      subtasks: ['Test on Safari', 'Create fallback styles', 'Test fix', 'Verify cross-browser'],
    },
    {
      title: 'Migrate to App Router',
      description: 'Complete migration of remaining Pages Router routes to Next.js 14 App Router with proper server components and streaming SSR.',
      priority: 'medium',
      column: 0,
      creator: john,
      assignee: null,
      labels: ['Backend', 'Feature'],
      tags: ['nextjs', 'migration'],
      subtasks: ['Audit remaining pages', 'Migrate routes', 'Update tests', 'Benchmark performance'],
    },
    {
      title: 'Add keyboard shortcuts',
      description: 'Implement keyboard shortcuts for common actions: navigate boards, create tasks, search, and quick assign.',
      priority: 'low',
      column: 0,
      creator: bob,
      assignee: bob,
      labels: ['Frontend', 'Feature'],
      tags: ['ux', 'keyboard'],
      subtasks: ['Define shortcut map', 'Implement handler', 'Add cheat sheet modal', 'Document shortcuts'],
    },
    {
      title: 'Performance: Bundle size optimization',
      description: 'Analyze and reduce JavaScript bundle size. Code-split heavy components, lazy-load routes, and tree-shake unused dependencies.',
      priority: 'medium',
      column: 0,
      creator: john,
      assignee: null,
      labels: ['Backend', 'Frontend'],
      tags: ['performance', 'build'],
      subtasks: ['Run bundle analysis', 'Code-split routes', 'Tree-shake deps', 'Set budget thresholds'],
    },
    {
      title: 'User notification preferences',
      description: 'Allow users to configure which notification types they receive: email, in-app, or both. Add quiet hours settings.',
      priority: 'medium',
      column: 1,
      creator: jane,
      assignee: bob,
      labels: ['Feature', 'Frontend'],
      tags: ['notifications', 'settings'],
      subtasks: ['Design preferences UI', 'Build settings page', 'Implement filtering', 'Test notification delivery'],
    },
    {
      title: 'Sprint burndown chart',
      description: 'Add a real-time burndown chart to the sprint view showing completed vs remaining story points over time.',
      priority: 'low',
      column: 0,
      creator: jane,
      assignee: null,
      labels: ['Feature', 'Design'],
      tags: ['sprint', 'charts', 'analytics'],
      subtasks: ['Design chart layout', 'Implement Recharts component', 'Connect to live data', 'Add tooltips'],
    },
    {
      title: 'OAuth token refresh handling',
      description: 'Google and GitHub OAuth tokens expire after 1 hour. Implement automatic token refresh with secure storage.',
      priority: 'high',
      column: 1,
      creator: john,
      assignee: john,
      labels: ['Bug', 'Backend', 'Feature'],
      tags: ['auth', 'oauth', 'security'],
      subtasks: ['Research token refresh flow', 'Implement refresh handler', 'Add secure storage', 'Test expiration'],
    },
    {
      title: 'Social media campaign calendar',
      description: 'Plan and schedule social media posts for the Q3 product launch across Twitter, LinkedIn, and Dev.to.',
      priority: 'medium',
      column: 2,
      creator: jane,
      assignee: null,
      labels: ['Documentation'],
      tags: ['social', 'marketing'],
      subtasks: ['Research posting schedule', 'Draft posts per platform', 'Schedule in buffer', 'Track engagement'],
    },
    {
      title: 'SaaS landing page refresh',
      description: 'Redesign the marketing website with new messaging around team collaboration, updated testimonials, and interactive product demo.',
      priority: 'medium',
      column: 1,
      creator: jane,
      assignee: bob,
      labels: ['Design', 'Feature'],
      tags: ['marketing', 'website'],
      subtasks: ['Audit current page', 'Design new layout', 'Build components', 'Launch'],
    },
  ];

  for (const boardData of boardsData) {
    const board = await prisma.board.upsert({
      where: { id: `board-${boardData.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `board-${boardData.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: boardData.name,
        description: boardData.description,
        color: boardData.color,
        icon: boardData.icon,
        workspaceId: workspace.id,
      },
    });

    const columns = await Promise.all(
      boardData.columns.map((colName, idx) =>
        prisma.column.create({
          data: { name: colName, position: idx, color: boardData.color, boardId: board.id },
        })
      )
    );

    if (boardData.name === 'Product Development') {
      for (const template of taskTemplates) {
        const task = await prisma.task.create({
          data: {
            title: template.title,
            description: template.description,
            priority: template.priority,
            status: ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'][template.column] as TaskStatus,
            columnId: columns[template.column].id,
            creatorId: template.creator.id,
            assigneeId: template.assignee?.id || null,
            tags: template.tags,
            position: 0,
            sprintId: sprint.id,
            labels: {
              create: template.labels.map((labelName) => {
                const label = labels.find((l) => l.name === labelName)!;
                return { labelId: label.id };
              }),
            },
            subtasks: {
              create: template.subtasks.map((st, i) => ({
                title: st,
                completed: template.column === 4 ? true : i === 0 && template.column >= 2,
                position: i,
                assigneeId: template.assignee?.id || null,
              })),
            },
          },
        });

        if (template.subtasks.length > 0) {
          await prisma.comment.create({
            data: {
              content: `Started working on "${template.title}". Breaking it down into ${template.subtasks.length} subtasks as discussed in the planning meeting.`,
              taskId: task.id,
              authorId: template.creator.id,
            },
          });
        }
      }
    }

    await prisma.activityLog.create({
      data: {
        action: 'BOARD_CREATED',
        entityType: 'board',
        entityId: board.id,
        userId: john.id,
        workspaceId: workspace.id,
        boardId: board.id,
        metadata: { boardName: board.name },
      },
    });
  }

  console.log('✅ Created 3 boards, 22 tasks with subtasks, labels, and comments');

  await prisma.notification.createMany({
    data: [
      {
        type: 'TASK_ASSIGNED',
        title: 'Critical bug assigned to you',
        message: 'You have been assigned "Critical: Database connection leak" — high priority.',
        userId: john.id,
      },
      {
        type: 'TASK_ASSIGNED',
        title: 'New task: Fix Safari rendering',
        message: 'Bob assigned you to "Login page not rendering on Safari".',
        userId: bob.id,
      },
      {
        type: 'TASK_MENTION',
        title: 'You were mentioned in a task',
        message: 'Jane mentioned you in "Build real-time collaboration engine".',
        userId: john.id,
      },
      {
        type: 'WORKSPACE_INVITATION',
        title: 'Welcome to TaskMesh!',
        message: 'You have been added to the TaskMesh Demo workspace. Start collaborating!',
        userId: john.id,
      },
      {
        type: 'WORKSPACE_MEMBER_JOINED',
        title: 'Bob Wilson joined',
        message: 'Bob Wilson joined TaskMesh Demo',
        userId: john.id,
      },
      {
        type: 'BOARD_CREATED',
        title: 'New board: Bug Tracker',
        message: 'A new board "Bug Tracker" was created in TaskMesh Demo.',
        userId: jane.id,
      },
    ],
  });

  await prisma.activityLog.createMany({
    data: [
      {
        action: 'WORKSPACE_CREATED',
        entityType: 'workspace',
        entityId: workspace.id,
        userId: john.id,
        workspaceId: workspace.id,
        metadata: { workspaceName: 'TaskMesh Demo' },
      },
      {
        action: 'SPRINT_STARTED',
        entityType: 'sprint',
        entityId: sprint.id,
        userId: john.id,
        workspaceId: workspace.id,
        metadata: { sprintName: sprint.name },
      },
      {
        action: 'MEMBER_JOINED',
        entityType: 'workspace_member',
        entityId: jane.id,
        userId: jane.id,
        workspaceId: workspace.id,
      },
      {
        action: 'MEMBER_JOINED',
        entityType: 'workspace_member',
        entityId: bob.id,
        userId: bob.id,
        workspaceId: workspace.id,
      },
    ],
  });

  console.log('✅ Created notifications and activity logs');
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('  🌟 TaskMesh Demo Seeded Successfully!');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('  Test Accounts:');
  console.log('  ┌──────────────────────────┬───────────────┐');
  console.log('  │ Email                    │ Password      │');
  console.log('  ├──────────────────────────┼───────────────┤');
  console.log('  │ john@example.com         │ password123   │');
  console.log('  │ jane@example.com         │ password123   │');
  console.log('  │ bob@example.com          │ password123   │');
  console.log('  │ demo@taskmesh.io         │ demo1234      │ ← Guest');
  console.log('  └──────────────────────────┴───────────────┘');
  console.log('');
  console.log('  Demo Workspace: TaskMesh Demo');
  console.log('  Boards: Product Development, Marketing & Content, Bug Tracker');
  console.log('  Sprint: Sprint 4: Q3 Release (ACTIVE)');
  console.log('  Tasks: 22 (with labels, subtasks, comments)');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
