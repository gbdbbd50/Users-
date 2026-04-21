export type Task = {
  id: string;
  title: string;
  description: string;
  requirements: string;
  reward: number;
  category: 'Data Entry' | 'Writing' | 'Survey' | 'Quality Control';
  imageUrl: string;
};

export const MOCK_TASKS: Task[] = [
  {
    id: 'task_001',
    title: 'Clean E-commerce Spreadsheet',
    description: 'Format and normalize product data for a new online store. Ensure consistency in naming conventions and price formats.',
    requirements: 'Proficiency in Excel or Google Sheets. Attention to detail.',
    reward: 15.50,
    category: 'Data Entry',
    imageUrl: 'https://picsum.photos/seed/task1/600/400'
  },
  {
    id: 'task_002',
    title: 'Product Feedback Survey',
    description: 'Provide detailed feedback on a new fitness app prototype. Complete a 10-minute questionnaire.',
    requirements: 'Regular app user, smartphone access.',
    reward: 5.00,
    category: 'Survey',
    imageUrl: 'https://picsum.photos/seed/task2/600/400'
  },
  {
    id: 'task_003',
    title: 'Short Blog Post on Remote Work',
    description: 'Write a 300-word blog post about the benefits of remote work for small businesses.',
    requirements: 'Excellent grammar and writing skills.',
    reward: 25.00,
    category: 'Writing',
    imageUrl: 'https://picsum.photos/seed/task3/600/400'
  },
  {
    id: 'task_004',
    title: 'Image Category Validation',
    description: 'Verify if the labels assigned to 100 images are correct according to the provided guidelines.',
    requirements: 'Visual accuracy, quick decision making.',
    reward: 12.00,
    category: 'Quality Control',
    imageUrl: 'https://picsum.photos/seed/task4/600/400'
  }
];

export type Submission = {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
};

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 'sub_101',
    taskId: 'task_001',
    userId: 'user-123',
    userName: 'John Doe',
    description: 'I have finished the spreadsheet cleanup. All prices are now in USD format and product categories are unified.',
    status: 'PENDING',
    submittedAt: new Date().toISOString()
  }
];