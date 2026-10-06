export interface Project {
    id: string;
    name: string;
    description?: string;
    image?: string;
    deadline?: string;
    memberIds?: string[];
    taskIds?: string[];
}

export interface Member {
    id: string;
    name: string;
    email?: string;
    image?: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    projectId: string;
    memberIds?: string[];
}

export type TaskStatus =
    | "todo"
    | "inProgress"
    | "done";