import { Agent, Mission } from '@/lib/types';

export const agents: Array<Agent> = [
    {
        id: '1',
        name: 'agent 1',
        role: 'test agent',
        goal: 'do nothing',
        backstory: 'just testing',
        tools: [],
        verbose: true,
        delegation: true,
        memory: true,
    },
    {
        id: '2',
        name: 'agent 2',
        role: 'test agent',
        goal: 'do nothing',
        backstory: 'just testing',
        tools: [],
        verbose: true,
        delegation: true,
        memory: true,
    }
];

export const missions: Array<Mission> = [
    {
        id: '1',
        name: 'mission 1',
        crew: ['1','2'],
        process: 'Sequential',
        verbose: true,
        memory: true,
        tasks: [
            { 
                id: '1', 
                description: 'task 1', 
                expectedOutput: 'nothing', 
                assignedAgents: ['1'] 
            },
            { 
                id: '2', 
                description: 'task 2', 
                expectedOutput: 'nothing', 
                assignedAgents: ['2'] 
            }
        ]
    }
]