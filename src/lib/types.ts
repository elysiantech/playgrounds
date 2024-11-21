
export type Tool = 'WebSearch' | 'WebCrawl' | 'GMail' | 'Calendar' | 'Notion' | 'Slack';

export type Agent = {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  tools: Tool[];
  verbose: boolean;
  delegation: boolean;
  memory: boolean;
};

export type Task = {
  id: string;
  description: string;
  expectedOutput: string;
  assignedAgents: string[];
};

export type Mission = {
  id: string;
  name: string;
  crew: string[];
  process: 'Sequential' | 'Hierarchical';
  verbose: boolean;
  memory: boolean;
  tasks: Task[];
};
