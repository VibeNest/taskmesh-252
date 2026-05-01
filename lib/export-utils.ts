export function exportToCSV(data: any[], filename: string) {
  if (!data.length) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const escapedValue = value === null || value === undefined ? '' : String(value);
          if (
            escapedValue.includes(',') ||
            escapedValue.includes('"') ||
            escapedValue.includes('\n')
          ) {
            return `"${escapedValue.replace(/"/g, '""')}"`;
          }
          return escapedValue;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTasksToCSV(tasks: any[], filename = 'tasks-export') {
  const formattedData = tasks.map((task) => ({
    ID: task.id,
    Title: task.title,
    Description: task.description || '',
    Status: task.status,
    Priority: task.priority || 'None',
    Estimate: task.estimate || 'Not set',
    StoryPoints: task.storyPoints || '',
    Assignee: task.assignee?.name || 'Unassigned',
    Creator: task.creator?.name || 'Unknown',
    DueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set',
    StartDate: task.startDate ? new Date(task.startDate).toLocaleDateString() : 'Not set',
    CompletedAt: task.completedAt
      ? new Date(task.completedAt).toLocaleDateString()
      : 'Not completed',
    Tags: Array.isArray(task.tags) ? task.tags.join('; ') : '',
    Labels: task.labels?.map((l: any) => l.label?.name).join('; ') || '',
    CreatedAt: new Date(task.createdAt).toLocaleString(),
    UpdatedAt: new Date(task.updatedAt).toLocaleString(),
  }));

  exportToCSV(formattedData, filename);
}

export function exportActivityLogsToCSV(logs: any[], filename = 'activity-logs-export') {
  const formattedData = logs.map((log) => ({
    ID: log.id,
    Action: log.action,
    EntityType: log.entityType,
    User: log.user?.name || log.user?.email || 'Unknown',
    TaskTitle: log.metadata?.taskTitle || '',
    BoardName: log.metadata?.boardName || '',
    CreatedAt: new Date(log.createdAt).toLocaleString(),
  }));

  exportToCSV(formattedData, filename);
}
