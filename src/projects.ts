import { get, onValue, ref, type DataSnapshot } from "firebase/database";
import { database } from "./firebase";

// These interfaces describe the data we get from Firebase.
interface Member {
    name: string;
    category?: string;
}

interface Task {
    title?: string;
    category?: string;
    assignedTo?: string;
    memberId?: string;
}

interface ProjectData {
    name: string;
    description?: string;
    deadline?: string;
    status?: string;
    member?: Member;
    members?: Member[] | Record<string, Member>;
    tasks?: (Task | string)[] | Record<string, Task | string>;
}

type ProjectStatus = "todo" | "inprogress" | "done";

// This class represents one project.
class Project {
    private id: string;
    private data: ProjectData;

    public constructor(id: string, data: ProjectData) {
        this.id = id;
        this.data = data;
    }

    public getId(): string {
        return this.id;
    }

    public getName(): string {
        return this.data.name || "Untitled project";
    }

    public getDescription(): string {
        return this.data.description || "—";
    }

    public getDeadline(): string {
        return this.data.deadline || "—";
    }

    public getMembers(): Member[] {
        const members: Member[] = [];

        if (this.data.member?.name) {
            members.push(this.data.member);
        }

        if (this.data.members) {
            const otherMembers = Object.values(this.data.members);
            members.push(...otherMembers);
        }

        return members.filter(member => Boolean(member.name));
    }

    public getTasks(): Task[] {
        if (!this.data.tasks) {
            return [];
        }

        const tasks = Object.values(this.data.tasks);
        return tasks.map(task => {
            if (typeof task === "string") {
                return { title: task };
            }

            return task;
        });
    }

    public getStatus(): ProjectStatus {
        const status = (this.data.status || "todo")
            .toLowerCase()
            .replace(/[\s_-]/g, "");

        if (status === "inprogress" || status === "ongoing") {
            return "inprogress";
        }

        if (status === "done" || status === "completed") {
            return "done";
        }

        return "todo";
    }
}

// This class reads projects from Firebase.
class ProjectRepository {
    private projectsReference = ref(database, "projects");

    public async getProjects(): Promise<Project[]> {
        const snapshot = await get(this.projectsReference);
        return this.makeProjects(snapshot);
    }

    public listenForChanges(
        onProjectsChanged: (projects: Project[]) => void,
        onError: (error: Error) => void
    ): void {
        onValue(
            this.projectsReference,
            snapshot => {
                const projects = this.makeProjects(snapshot);
                onProjectsChanged(projects);
            },
            onError
        );
    }

    private makeProjects(snapshot: DataSnapshot): Project[] {
        const projects: Project[] = [];

        snapshot.forEach(child => {
            if (child.key) {
                const data = child.val() as ProjectData;
                projects.push(new Project(child.key, data));
            }
        });

        return projects;
    }
}

// Small functions used by the ProjectBoard class.
function makeTextElement(
    tagName: string,
    text: string,
    className?: string
): HTMLElement {
    const element = document.createElement(tagName);
    element.textContent = text;

    if (className) {
        element.className = className;
    }

    return element;
}

function getSelectValue(id: string): string {
    const select = document.querySelector<HTMLSelectElement>(`#${id}`);
    return select?.value || "all";
}

// This class controls the board, filters and project cards.
class ProjectBoard {
    private projects: Project[] = [];
    private repository: ProjectRepository;

    public constructor(repository: ProjectRepository) {
        this.repository = repository;
    }

    public start(): void {
        this.addFilterListeners();
        void this.loadProjects();
    }

    private async loadProjects(): Promise<void> {
        try {
            this.projects = await this.repository.getProjects();
            this.showProjects();

            this.repository.listenForChanges(
                projects => {
                    this.projects = projects;
                    this.showProjects();
                },
                error => {
                    console.error("Firebase listener error:", error);
                    this.showMessage("Unable to read projects from Firebase.");
                }
            );
        } catch (error) {
            console.error("Could not load projects:", error);
            this.showMessage(
                "Could not load projects. Check Firebase rules and connection."
            );
        }
    }

    private addFilterListeners(): void {
        const filterIds = [
            "filter-projects",
            "filter-members",
            "filter-task-value",
            "sort-projects"
        ];

        for (const id of filterIds) {
            const select = document.querySelector<HTMLSelectElement>(`#${id}`);
            select?.addEventListener("change", () => {
                this.showProjects();
            });
        }

        const taskFilter =
            document.querySelector<HTMLSelectElement>("#filter-tasks");
        taskFilter?.addEventListener("change", () => {
            this.updateTaskFilter();
            this.showProjects();
        });
    }

    private updateTaskFilter(): void {
        const taskFilter = getSelectValue("filter-tasks");
        const taskSelect =
            document.querySelector<HTMLSelectElement>("#filter-task-value");

        if (!taskSelect) {
            return;
        }

        const oldValue = taskSelect.value;
        taskSelect.replaceChildren();
        taskSelect.hidden = taskFilter === "all";

        if (taskFilter === "all") {
            return;
        }

        const values = new Set<string>();

        for (const project of this.projects) {
            for (const task of project.getTasks()) {
                let value = task.category;

                if (taskFilter === "member") {
                    value = task.assignedTo || task.memberId;
                }

                if (value) {
                    values.add(value);
                }
            }
        }

        const firstOption = document.createElement("option");
        firstOption.value = "all";
        firstOption.textContent =
            taskFilter === "category"
                ? "All categories"
                : "All task members";
        taskSelect.appendChild(firstOption);

        const sortedValues = Array.from(values).sort();
        for (const value of sortedValues) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            taskSelect.appendChild(option);
        }

        const oldValueStillExists = sortedValues.includes(oldValue);
        taskSelect.value = oldValueStillExists ? oldValue : "all";
    }

    private projectMatchesFilters(project: Project): boolean {
        const projectFilter = getSelectValue("filter-projects");
        if (
            projectFilter !== "all" &&
            project.getStatus() !== projectFilter
        ) {
            return false;
        }

        const memberFilter = getSelectValue("filter-members");
        if (memberFilter !== "all") {
            const hasMemberWithRole = project.getMembers().some(member => {
                return (member.category || "").toLowerCase() === memberFilter;
            });

            if (!hasMemberWithRole) {
                return false;
            }
        }

        const taskFilter = getSelectValue("filter-tasks");
        const taskValue = getSelectValue("filter-task-value");

        if (taskFilter !== "all" && taskValue !== "all") {
            const hasMatchingTask = project.getTasks().some(task => {
                if (taskFilter === "category") {
                    return task.category === taskValue;
                }

                return (
                    task.assignedTo === taskValue ||
                    task.memberId === taskValue
                );
            });

            if (!hasMatchingTask) {
                return false;
            }
        }

        return true;
    }

    private sortProjects(projects: Project[]): void {
        const sortValue = getSelectValue("sort-projects");

        if (sortValue === "title-asc") {
            projects.sort((a, b) =>
                a.getName().localeCompare(b.getName(), "sv")
            );
        }

        if (sortValue === "title-desc") {
            projects.sort((a, b) =>
                b.getName().localeCompare(a.getName(), "sv")
            );
        }

        if (sortValue === "deadline-oldest") {
            projects.sort((a, b) =>
                a.getDeadline().localeCompare(b.getDeadline())
            );
        }

        if (sortValue === "deadline-newest") {
            projects.sort((a, b) =>
                b.getDeadline().localeCompare(a.getDeadline())
            );
        }
    }

    private createProjectCard(project: Project): HTMLElement {
        const card = document.createElement("article");
        card.className = "project-board-card";

        card.appendChild(makeTextElement("h4", project.getName()));
        card.appendChild(makeTextElement("p", `ID: ${project.getId()}`));
        card.appendChild(makeTextElement("p", `Name: ${project.getName()}`));
        card.appendChild(
            makeTextElement("p", `Description: ${project.getDescription()}`)
        );
        card.appendChild(
            makeTextElement("p", `Deadline: ${project.getDeadline()}`)
        );
        card.appendChild(
            makeTextElement(
                "p",
                `Tasks: ${project.getTasks().length} total`,
                "card-task-count"
            )
        );
        card.appendChild(
            makeTextElement(
                "p",
                "Members | Projects | Tasks | Role",
                "card-member-heading"
            )
        );

        const members = project.getMembers();
        if (members.length === 0) {
            card.appendChild(
                makeTextElement("p", "No members assigned", "card-empty")
            );
        }

        for (const member of members) {
            const projectsForMember = this.countMemberProjects(member.name);
            const tasksForMember = this.countMemberTasks(project, member.name);
            const role = member.category || "member";
            const text = `${member.name} | ${projectsForMember} | ${tasksForMember} | ${role}`;

            card.appendChild(makeTextElement("p", text, "card-member"));
        }

        return card;
    }

    private countMemberProjects(memberName: string): number {
        let count = 0;

        for (const project of this.projects) {
            const memberExists = project
                .getMembers()
                .some(member => member.name === memberName);

            if (memberExists) {
                count++;
            }
        }

        return count;
    }

    private countMemberTasks(project: Project, memberName: string): number {
        let count = 0;

        for (const task of project.getTasks()) {
            if (
                task.assignedTo === memberName ||
                task.memberId === memberName
            ) {
                count++;
            }
        }

        return count;
    }

    private showProjects(): void {
        this.updateTaskFilter();

        const columns: Record<ProjectStatus, HTMLElement | null> = {
            todo: document.querySelector<HTMLElement>("#column-todo"),
            inprogress: document.querySelector<HTMLElement>("#column-inprogress"),
            done: document.querySelector<HTMLElement>("#column-done")
        };

        for (const column of Object.values(columns)) {
            column?.replaceChildren();
        }

        const visibleProjects = this.projects.filter(project => {
            return this.projectMatchesFilters(project);
        });
        this.sortProjects(visibleProjects);

        const counts: Record<ProjectStatus, number> = {
            todo: 0,
            inprogress: 0,
            done: 0
        };

        for (const project of visibleProjects) {
            const status = project.getStatus();
            columns[status]?.appendChild(this.createProjectCard(project));
            counts[status]++;
        }

        this.updateCount("todo-count", counts.todo, columns.todo);
        this.updateCount("progress-count", counts.inprogress, columns.inprogress);
        this.updateCount("done-count", counts.done, columns.done);
        this.showMessage(
            `${visibleProjects.length} of ${this.projects.length} projects shown`
        );
    }

    private updateCount(
        elementId: string,
        count: number,
        column: HTMLElement | null
    ): void {
        const countElement = document.querySelector<HTMLElement>(`#${elementId}`);
        if (countElement) {
            countElement.textContent = String(count);
        }

        if (count === 0) {
            column?.appendChild(
                makeTextElement("p", "No matching projects", "board-empty")
            );
        }
    }

    private showMessage(message: string): void {
        const messageElement =
            document.querySelector<HTMLElement>("#board-message");
        if (messageElement) {
            messageElement.textContent = message;
        }
    }
}

export function initProjects(): void {
    const repository = new ProjectRepository();
    const board = new ProjectBoard(repository);
    board.start();
}
