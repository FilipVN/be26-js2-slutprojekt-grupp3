import {ref, onValue, push, set, update, remove } from "firebase/database";

import { database } from "./firebase";

import type {
    Project,
    Member,
    Task,
    TaskStatus
} from "./types";


// ============================================================
// APPLICATION STATE
// ============================================================

let projects: Project[] = [];
let members: Member[] = [];
let tasks: Task[] = [];

let editingProjectId: string | null = null;
let editingMemberId: string | null = null;
let editingTaskId: string | null = null;


// ============================================================
// DOM - SEARCH / FILTER
// ============================================================

const projectGrid =
    document.querySelector<HTMLElement>("#projectGrid");

const statusText =
    document.querySelector<HTMLParagraphElement>("#statusText");

const searchForm =
    document.querySelector<HTMLFormElement>("#searchForm");

const searchInput =
    document.querySelector<HTMLInputElement>("#searchInput");

const projectFilter =
    document.querySelector<HTMLSelectElement>("#projectFilter");

const memberFilter =
    document.querySelector<HTMLSelectElement>("#memberFilter");

const taskFilter =
    document.querySelector<HTMLSelectElement>("#taskFilter");


// ============================================================
// DOM - PROJECT FORM
// ============================================================

const projectForm =
    document.querySelector<HTMLFormElement>("#projectForm");

const projectName =
    document.querySelector<HTMLInputElement>("#projectName");

const projectDescription =
    document.querySelector<HTMLTextAreaElement>(
        "#projectDescription"
    );

const projectDeadline =
    document.querySelector<HTMLInputElement>(
        "#projectDeadline"
    );

const projectImage =
    document.querySelector<HTMLInputElement>(
        "#projectImage"
    );

const projectSubmitButton =
    document.querySelector<HTMLButtonElement>(
        "#projectSubmitButton"
    );

const cancelProjectEdit =
    document.querySelector<HTMLButtonElement>(
        "#cancelProjectEdit"
    );


// ============================================================
// DOM - MEMBER FORM
// ============================================================

const memberForm =
    document.querySelector<HTMLFormElement>("#memberForm");

const memberName =
    document.querySelector<HTMLInputElement>("#memberName");

const memberEmail =
    document.querySelector<HTMLInputElement>("#memberEmail");

const memberImage =
    document.querySelector<HTMLInputElement>("#memberImage");

const memberSubmitButton =
    document.querySelector<HTMLButtonElement>(
        "#memberSubmitButton"
    );

const cancelMemberEdit =
    document.querySelector<HTMLButtonElement>(
        "#cancelMemberEdit"
    );


// ============================================================
// DOM - TASK FORM
// ============================================================

const taskForm =
    document.querySelector<HTMLFormElement>("#taskForm");

const taskTitle =
    document.querySelector<HTMLInputElement>("#taskTitle");

const taskDescription =
    document.querySelector<HTMLTextAreaElement>(
        "#taskDescription"
    );

const taskProject =
    document.querySelector<HTMLSelectElement>(
        "#taskProject"
    );

const taskMember =
    document.querySelector<HTMLSelectElement>(
        "#taskMember"
    );

const taskStatus =
    document.querySelector<HTMLSelectElement>(
        "#taskStatus"
    );

const taskSubmitButton =
    document.querySelector<HTMLButtonElement>(
        "#taskSubmitButton"
    );

const cancelTaskEdit =
    document.querySelector<HTMLButtonElement>(
        "#cancelTaskEdit"
    );


// ============================================================
// DOM - MANAGEMENT LISTS
// ============================================================

const memberList =
    document.querySelector<HTMLElement>("#memberList");

const taskList =
    document.querySelector<HTMLElement>("#taskList");


// ============================================================
// FIREBASE - LOAD PROJECTS
// ============================================================

function loadProjects(): void {

    const projectsRef =
        ref(database, "projects");


    onValue(

        projectsRef,

        (snapshot) => {

            const data =
                snapshot.val();


            if (data) {

                projects =
                    Object.entries(data).map(

                        ([id, value]) => {

                            return {

                                id,

                                ...(value as Omit<
                                    Project,
                                    "id"
                                >)
                            };
                        }
                    );

            }

            else {

                projects = [];
            }


            updateProjectFilter();

            updateTaskProjectSelect();

            renderProjects();

            renderTasks();
        },

        (error) => {

            console.error(
                "Could not load projects:",
                error
            );

            showError(
                "Could not load projects."
            );
        }
    );
}


// ============================================================
// FIREBASE - LOAD MEMBERS
// ============================================================

function loadMembers(): void {

    const membersRef =
        ref(database, "members");


    onValue(

        membersRef,

        (snapshot) => {

            const data =
                snapshot.val();


            if (data) {

                members =
                    Object.entries(data).map(

                        ([id, value]) => {

                            return {

                                id,

                                ...(value as Omit<
                                    Member,
                                    "id"
                                >)
                            };
                        }
                    );

            }

            else {

                members = [];
            }


            updateMemberFilter();

            updateTaskMemberSelect();

            renderMembers();

            renderProjects();

            renderTasks();
        },

        (error) => {

            console.error(
                "Could not load members:",
                error
            );
        }
    );
}


// ============================================================
// FIREBASE - LOAD TASKS
// ============================================================

function loadTasks(): void {

    const tasksRef =
        ref(database, "tasks");


    onValue(

        tasksRef,

        (snapshot) => {

            const data =
                snapshot.val();


            if (data) {

                tasks =
                    Object.entries(data).map(

                        ([id, value]) => {

                            return {

                                id,

                                ...(value as Omit<
                                    Task,
                                    "id"
                                >)
                            };
                        }
                    );

            }

            else {

                tasks = [];
            }


            renderTasks();

            renderProjects();
        },

        (error) => {

            console.error(
                "Could not load tasks:",
                error
            );
        }
    );
}


// ============================================================
// PROJECT HELPERS
// ============================================================

function getProjectTasks(
    project: Project
): Task[] {

    return tasks.filter(

        task =>
            task.projectId === project.id
    );
}


function getProjectMembers(
    project: Project
): Member[] {

    const projectTasks =
        getProjectTasks(project);


    const memberIds =
        new Set<string>();


    projectTasks.forEach(task => {

        if (task.memberId) {

            memberIds.add(
                task.memberId
            );
        }
    });


    return members.filter(

        member =>
            memberIds.has(
                member.id
            )
    );
}


// ============================================================
// SAFE HTML
// ============================================================

function escapeHTML(
    value: string
): string {

    return value

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");
}


// ============================================================
// FORMAT TASK STATUS
// ============================================================

function formatStatus(
    status: TaskStatus
): string {

    switch (status) {

        case "todo":

            return "To do";


        case "inProgress":

            return "In progress";


        case "done":

            return "Done";


        default:

            return status;
    }
}


// ============================================================
// RENDER PROJECTS
// ============================================================

function renderProjects(): void {

    if (!projectGrid) {
        return;
    }


    const searchTerm =
        searchInput?.value
            .trim()
            .toLowerCase()
        ?? "";


    const selectedProject =
        projectFilter?.value
        ?? "all";


    const selectedMember =
        memberFilter?.value
        ?? "all";


    const selectedTaskStatus =
        taskFilter?.value
        ?? "all";


    const filteredProjects =
        projects.filter(project => {


            const projectTasks =
                getProjectTasks(project);


            const projectMembers =
                getProjectMembers(project);


            // -------------------------
            // SEARCH
            // -------------------------

            const matchesSearch =

                searchTerm === ""

                ||

                project.name
                    .toLowerCase()
                    .includes(searchTerm)

                ||

                (project.description ?? "")
                    .toLowerCase()
                    .includes(searchTerm)

                ||

                projectMembers.some(

                    member =>

                        member.name
                            .toLowerCase()
                            .includes(searchTerm)
                )

                ||

                projectTasks.some(

                    task =>

                        task.title
                            .toLowerCase()
                            .includes(searchTerm)
                );


            // -------------------------
            // PROJECT FILTER
            // -------------------------

            const matchesProject =

                selectedProject === "all"

                ||

                project.id ===
                selectedProject;


            // -------------------------
            // MEMBER FILTER
            // -------------------------

            const matchesMember =

                selectedMember === "all"

                ||

                projectTasks.some(

                    task =>
                        task.memberId ===
                        selectedMember
                );


            // -------------------------
            // TASK STATUS FILTER
            // -------------------------

            const matchesTaskStatus =

                selectedTaskStatus === "all"

                ||

                projectTasks.some(

                    task =>
                        task.status ===
                        selectedTaskStatus
                );


            return (
                matchesSearch
                &&
                matchesProject
                &&
                matchesMember
                &&
                matchesTaskStatus
            );
        });


    projectGrid.innerHTML = "";


    if (
        filteredProjects.length === 0
    ) {

        projectGrid.innerHTML = `

            <p class="message">
                No projects found.
            </p>
        `;


        updateStatus(0);

        return;
    }


    filteredProjects.forEach(

        project => {

            const card =
                createProjectCard(project);

            projectGrid.append(card);
        }
    );


    updateStatus(
        filteredProjects.length
    );
}


// ============================================================
// CREATE PROJECT CARD
// ============================================================

function createProjectCard(
    project: Project
): HTMLElement {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "project-card";


    const projectTasks =
        getProjectTasks(project);


    const projectMembers =
        getProjectMembers(project);


    const todoCount =
        projectTasks.filter(

            task =>
                task.status === "todo"

        ).length;


    const inProgressCount =
        projectTasks.filter(

            task =>
                task.status ===
                "inProgress"

        ).length;


    const doneCount =
        projectTasks.filter(

            task =>
                task.status === "done"

        ).length;


    const memberNames =
        projectMembers.length > 0

            ? projectMembers
                .map(
                    member =>
                        escapeHTML(
                            member.name
                        )
                )
                .join(", ")

            : "No members";


    const safeName =
        escapeHTML(
            project.name
        );


    const safeDescription =
        escapeHTML(
            project.description
            || "No description"
        );


    const safeDeadline =
        escapeHTML(
            project.deadline
            || "No deadline"
        );


    const imageHTML =
        project.image

            ? `
                <img
                    src="${escapeHTML(project.image)}"
                    alt="${safeName}"
                >
            `

            : `
                <div class="image-placeholder">
                    image
                </div>
            `;


    card.innerHTML = `

        <div class="project-image">

            ${imageHTML}

        </div>


        <div class="project-content">

            <h2>
                ${safeName}
            </h2>


            <p class="project-description">

                ${safeDescription}

            </p>


            <dl class="project-details">

                <div>

                    <dt>
                        Deadline
                    </dt>

                    <dd>
                        ${safeDeadline}
                    </dd>

                </div>


                <div>

                    <dt>
                        Members
                    </dt>

                    <dd>
                        ${memberNames}
                    </dd>

                </div>

            </dl>


            <div class="task-summary">

                <span>
                    To do:
                    <strong>
                        ${todoCount}
                    </strong>
                </span>


                <span>
                    In progress:
                    <strong>
                        ${inProgressCount}
                    </strong>
                </span>


                <span>
                    Done:
                    <strong>
                        ${doneCount}
                    </strong>
                </span>

            </div>


            <div class="project-actions">

                <button
                    type="button"
                    class="edit-project"
                    data-id="${project.id}"
                >
                    Edit
                </button>


                <button
                    type="button"
                    class="delete-project delete-button"
                    data-id="${project.id}"
                >
                    Delete
                </button>

            </div>

        </div>
    `;


    return card;
}


// ============================================================
// RENDER MEMBERS
// ============================================================

function renderMembers(): void {

    if (!memberList) {
        return;
    }


    memberList.innerHTML = "";


    if (
        members.length === 0
    ) {

        memberList.innerHTML = `

            <p>
                No members yet.
            </p>
        `;

        return;
    }


    members.forEach(member => {

        const item =
            document.createElement(
                "article"
            );


        item.className =
            "management-item";


        const safeName =
            escapeHTML(
                member.name
            );


        const safeEmail =
            escapeHTML(
                member.email ?? ""
            );


        item.innerHTML = `

            <div class="management-info">

                <strong>
                    ${safeName}
                </strong>

                <small>
                    ${safeEmail}
                </small>

            </div>


            <div class="management-buttons">

                <button
                    type="button"
                    class="edit-member"
                    data-id="${member.id}"
                >
                    Edit
                </button>


                <button
                    type="button"
                    class="delete-member delete-button"
                    data-id="${member.id}"
                >
                    Delete
                </button>

            </div>
        `;


        memberList.append(item);
    });
}


// ============================================================
// RENDER TASKS
// ============================================================

function renderTasks(): void {

    if (!taskList) {
        return;
    }


    taskList.innerHTML = "";


    if (
        tasks.length === 0
    ) {

        taskList.innerHTML = `

            <p>
                No tasks yet.
            </p>
        `;

        return;
    }


    tasks.forEach(task => {


        const project =
            projects.find(

                project =>
                    project.id ===
                    task.projectId
            );


        const member =
            members.find(

                member =>
                    member.id ===
                    task.memberId
            );


        const item =
            document.createElement(
                "article"
            );


        item.className =
            "management-item";


        const safeTitle =
            escapeHTML(
                task.title
            );


        const safeProject =
            escapeHTML(
                project?.name
                ?? "Unknown project"
            );


        const safeMember =
            escapeHTML(
                member?.name
                ?? "Unassigned"
            );


        item.innerHTML = `

            <div class="management-info">

                <strong>
                    ${safeTitle}
                </strong>

                <small>

                    ${safeProject}

                    •

                    ${safeMember}

                    •

                    ${formatStatus(
                        task.status
                    )}

                </small>

            </div>


            <div class="management-buttons">

                <button
                    type="button"
                    class="edit-task"
                    data-id="${task.id}"
                >
                    Edit
                </button>


                <button
                    type="button"
                    class="delete-task delete-button"
                    data-id="${task.id}"
                >
                    Delete
                </button>

            </div>
        `;


        taskList.append(item);
    });
}


// ============================================================
// PROJECT FILTER
// ============================================================

function updateProjectFilter(): void {

    if (!projectFilter) {
        return;
    }


    const selectedValue =
        projectFilter.value;


    projectFilter.innerHTML = `

        <option value="all">
            All projects
        </option>
    `;


    projects.forEach(project => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            project.id;


        option.textContent =
            project.name;


        projectFilter.append(option);
    });


    if (
        projects.some(
            project =>
                project.id ===
                selectedValue
        )
    ) {

        projectFilter.value =
            selectedValue;

    }

    else {

        projectFilter.value =
            "all";
    }
}


// ============================================================
// MEMBER FILTER
// ============================================================

function updateMemberFilter(): void {

    if (!memberFilter) {
        return;
    }


    const selectedValue =
        memberFilter.value;


    memberFilter.innerHTML = `

        <option value="all">
            All members
        </option>
    `;


    members.forEach(member => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            member.id;


        option.textContent =
            member.name;


        memberFilter.append(option);
    });


    if (
        members.some(
            member =>
                member.id ===
                selectedValue
        )
    ) {

        memberFilter.value =
            selectedValue;

    }

    else {

        memberFilter.value =
            "all";
    }
}


// ============================================================
// TASK PROJECT SELECT
// ============================================================

function updateTaskProjectSelect(): void {

    if (!taskProject) {
        return;
    }


    const selectedValue =
        taskProject.value;


    taskProject.innerHTML = `

        <option value="">
            Select project
        </option>
    `;


    projects.forEach(project => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            project.id;


        option.textContent =
            project.name;


        taskProject.append(option);
    });


    if (
        projects.some(
            project =>
                project.id ===
                selectedValue
        )
    ) {

        taskProject.value =
            selectedValue;
    }
}


// ============================================================
// TASK MEMBER SELECT
// ============================================================

function updateTaskMemberSelect(): void {

    if (!taskMember) {
        return;
    }


    const selectedValue =
        taskMember.value;


    taskMember.innerHTML = `

        <option value="">
            Unassigned
        </option>
    `;


    members.forEach(member => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            member.id;


        option.textContent =
            member.name;


        taskMember.append(option);
    });


    if (
        members.some(
            member =>
                member.id ===
                selectedValue
        )
    ) {

        taskMember.value =
            selectedValue;
    }
}


// ============================================================
// STATUS MESSAGE
// ============================================================

function updateStatus(
    count: number
): void {

    if (!statusText) {
        return;
    }


    statusText.textContent =

        `${count} project${
            count === 1
                ? ""
                : "s"
        } found`;
}


// ============================================================
// ERROR MESSAGE
// ============================================================

function showError(
    message: string
): void {

    if (!projectGrid) {
        return;
    }


    projectGrid.innerHTML = `

        <p class="message error">

            ${escapeHTML(message)}

        </p>
    `;
}


// ============================================================
// CREATE / UPDATE PROJECT
// ============================================================

projectForm?.addEventListener(

    "submit",

    async event => {

        event.preventDefault();


        if (
            !projectName
            ||
            !projectDescription
            ||
            !projectDeadline
            ||
            !projectImage
        ) {

            return;
        }


        const name =
            projectName.value.trim();


        if (!name) {

            alert(
                "Project name is required."
            );

            return;
        }


        const projectData = {

            name,

            description:
                projectDescription
                    .value
                    .trim(),

            deadline:
                projectDeadline.value,

            image:
                projectImage
                    .value
                    .trim()
        };


        try {

            // UPDATE PROJECT

            if (editingProjectId) {

                const projectRef =
                    ref(
                        database,
                        `projects/${editingProjectId}`
                    );


                await update(
                    projectRef,
                    projectData
                );
            }


            // CREATE PROJECT

            else {

                const projectsRef =
                    ref(
                        database,
                        "projects"
                    );


                const newProjectRef =
                    push(
                        projectsRef
                    );


                await set(
                    newProjectRef,
                    projectData
                );
            }


            resetProjectForm();

        }

        catch (error) {

            console.error(
                "Project save failed:",
                error
            );


            alert(
                "Could not save project."
            );
        }
    }
);


// ============================================================
// EDIT PROJECT
// ============================================================

function editProject(
    id: string
): void {

    const project =
        projects.find(

            project =>
                project.id === id
        );


    if (!project) {
        return;
    }


    if (
        !projectName
        ||
        !projectDescription
        ||
        !projectDeadline
        ||
        !projectImage
        ||
        !projectSubmitButton
        ||
        !cancelProjectEdit
    ) {

        return;
    }


    editingProjectId =
        project.id;


    projectName.value =
        project.name;


    projectDescription.value =
        project.description
        ?? "";


    projectDeadline.value =
        project.deadline
        ?? "";


    projectImage.value =
        project.image
        ?? "";


    projectSubmitButton.textContent =
        "Update Project";


    cancelProjectEdit
        .classList
        .remove("hidden");


    projectForm?.scrollIntoView({

        behavior: "smooth",

        block: "center"
    });
}


// ============================================================
// RESET PROJECT FORM
// ============================================================

function resetProjectForm(): void {

    projectForm?.reset();


    editingProjectId = null;


    if (projectSubmitButton) {

        projectSubmitButton.textContent =
            "Add Project";
    }


    cancelProjectEdit
        ?.classList
        .add("hidden");
}


cancelProjectEdit?.addEventListener(

    "click",

    resetProjectForm
);


// ============================================================
// DELETE PROJECT
// ============================================================

async function deleteProject(
    id: string
): Promise<void> {

    const project =
        projects.find(

            project =>
                project.id === id
        );


    if (!project) {
        return;
    }


    const confirmed =
        confirm(

            `Delete "${project.name}" and all tasks belonging to it?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const projectTasks =
            tasks.filter(

                task =>
                    task.projectId === id
            );


        // Delete every task belonging
        // to the project.

        for (
            const task of projectTasks
        ) {

            await remove(

                ref(
                    database,
                    `tasks/${task.id}`
                )
            );
        }


        // Delete project.

        await remove(

            ref(
                database,
                `projects/${id}`
            )
        );


        if (
            editingProjectId === id
        ) {

            resetProjectForm();
        }

    }

    catch (error) {

        console.error(
            "Delete project failed:",
            error
        );


        alert(
            "Could not delete project."
        );
    }
}


// ============================================================
// CREATE / UPDATE MEMBER
// ============================================================

memberForm?.addEventListener(

    "submit",

    async event => {

        event.preventDefault();


        if (
            !memberName
            ||
            !memberEmail
            ||
            !memberImage
        ) {

            return;
        }


        const name =
            memberName
                .value
                .trim();


        if (!name) {

            alert(
                "Member name is required."
            );

            return;
        }


        const memberData = {

            name,

            email:
                memberEmail
                    .value
                    .trim(),

            image:
                memberImage
                    .value
                    .trim()
        };


        try {

            // UPDATE

            if (editingMemberId) {

                await update(

                    ref(
                        database,
                        `members/${editingMemberId}`
                    ),

                    memberData
                );
            }


            // CREATE

            else {

                const newMemberRef =
                    push(

                        ref(
                            database,
                            "members"
                        )
                    );


                await set(

                    newMemberRef,

                    memberData
                );
            }


            resetMemberForm();

        }

        catch (error) {

            console.error(
                "Member save failed:",
                error
            );


            alert(
                "Could not save member."
            );
        }
    }
);


// ============================================================
// EDIT MEMBER
// ============================================================

function editMember(
    id: string
): void {

    const member =
        members.find(

            member =>
                member.id === id
        );


    if (!member) {
        return;
    }


    if (
        !memberName
        ||
        !memberEmail
        ||
        !memberImage
        ||
        !memberSubmitButton
        ||
        !cancelMemberEdit
    ) {

        return;
    }


    editingMemberId =
        member.id;


    memberName.value =
        member.name;


    memberEmail.value =
        member.email
        ?? "";


    memberImage.value =
        member.image
        ?? "";


    memberSubmitButton.textContent =
        "Update Member";


    cancelMemberEdit
        .classList
        .remove("hidden");


    memberForm?.scrollIntoView({

        behavior: "smooth",

        block: "center"
    });
}


// ============================================================
// RESET MEMBER FORM
// ============================================================

function resetMemberForm(): void {

    memberForm?.reset();


    editingMemberId = null;


    if (memberSubmitButton) {

        memberSubmitButton.textContent =
            "Add Member";
    }


    cancelMemberEdit
        ?.classList
        .add("hidden");
}


cancelMemberEdit?.addEventListener(

    "click",

    resetMemberForm
);


// ============================================================
// DELETE MEMBER
// ============================================================

async function deleteMember(
    id: string
): Promise<void> {

    const member =
        members.find(

            member =>
                member.id === id
        );


    if (!member) {
        return;
    }


    const confirmed =
        confirm(

            `Delete member "${member.name}"? Their tasks will become unassigned.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const assignedTasks =
            tasks.filter(

                task =>
                    task.memberId === id
            );


        // Unassign tasks.

        for (
            const task of assignedTasks
        ) {

            await update(

                ref(
                    database,
                    `tasks/${task.id}`
                ),

                {
                    memberId: null
                }
            );
        }


        // Delete member.

        await remove(

            ref(
                database,
                `members/${id}`
            )
        );


        if (
            editingMemberId === id
        ) {

            resetMemberForm();
        }

    }

    catch (error) {

        console.error(
            "Delete member failed:",
            error
        );


        alert(
            "Could not delete member."
        );
    }
}


// ============================================================
// CREATE / UPDATE TASK
// ============================================================

taskForm?.addEventListener(

    "submit",

    async event => {

        event.preventDefault();


        if (
            !taskTitle
            ||
            !taskDescription
            ||
            !taskProject
            ||
            !taskMember
            ||
            !taskStatus
        ) {

            return;
        }


        const title =
            taskTitle
                .value
                .trim();


        if (!title) {

            alert(
                "Task title is required."
            );

            return;
        }


        const selectedProject =
            taskProject.value;


        if (!selectedProject) {

            alert(
                "Please select a project."
            );

            return;
        }

const taskData = {
    title,
    description: taskDescription.value.trim(),
    projectId: selectedProject,
    memberId: taskMember.value || null,
    status: taskStatus.value as TaskStatus
};


        try {

            // UPDATE TASK

            if (editingTaskId) {

                await update(

                    ref(
                        database,
                        `tasks/${editingTaskId}`
                    ),

                    taskData
                );
            }


            // CREATE TASK

            else {

                const newTaskRef =
                    push(

                        ref(
                            database,
                            "tasks"
                        )
                    );


                await set(

                    newTaskRef,

                    taskData
                );
            }


            resetTaskForm();

        }

        catch (error) {

            console.error(
                "Task save failed:",
                error
            );


            alert(
                "Could not save task."
            );
        }
    }
);


// ============================================================
// EDIT TASK
// ============================================================

function editTask(
    id: string
): void {

    const task =
        tasks.find(

            task =>
                task.id === id
        );


    if (!task) {
        return;
    }


    if (
        !taskTitle
        ||
        !taskDescription
        ||
        !taskProject
        ||
        !taskMember
        ||
        !taskStatus
        ||
        !taskSubmitButton
        ||
        !cancelTaskEdit
    ) {

        return;
    }


    editingTaskId =
        task.id;


    taskTitle.value =
        task.title;


    taskDescription.value =
        task.description
        ?? "";


    taskProject.value =
        task.projectId;


    taskMember.value =
        task.memberId
        ?? "";


    taskStatus.value =
        task.status;


    taskSubmitButton.textContent =
        "Update Task";


    cancelTaskEdit
        .classList
        .remove("hidden");


    taskForm?.scrollIntoView({

        behavior: "smooth",

        block: "center"
    });
}


// ============================================================
// RESET TASK FORM
// ============================================================

function resetTaskForm(): void {

    taskForm?.reset();


    editingTaskId = null;


    if (taskSubmitButton) {

        taskSubmitButton.textContent =
            "Add Task";
    }


    cancelTaskEdit
        ?.classList
        .add("hidden");


    if (taskStatus) {

        taskStatus.value =
            "todo";
    }
}


cancelTaskEdit?.addEventListener(

    "click",

    resetTaskForm
);


// ============================================================
// DELETE TASK
// ============================================================

async function deleteTask(
    id: string
): Promise<void> {

    const task =
        tasks.find(

            task =>
                task.id === id
        );


    if (!task) {
        return;
    }


    const confirmed =
        confirm(

            `Delete task "${task.title}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await remove(

            ref(
                database,
                `tasks/${id}`
            )
        );


        if (
            editingTaskId === id
        ) {

            resetTaskForm();
        }

    }

    catch (error) {

        console.error(
            "Delete task failed:",
            error
        );


        alert(
            "Could not delete task."
        );
    }
}


// ============================================================
// PROJECT CARD EVENT DELEGATION
// ============================================================

projectGrid?.addEventListener(

    "click",

    event => {

        const target =
            event.target as HTMLElement;


        const button =
            target.closest<HTMLButtonElement>(
                "button"
            );


        if (!button) {
            return;
        }


        const id =
            button.dataset.id;


        if (!id) {
            return;
        }


        if (
            button.classList.contains(
                "edit-project"
            )
        ) {

            editProject(id);

            return;
        }


        if (
            button.classList.contains(
                "delete-project"
            )
        ) {

            void deleteProject(id);
        }
    }
);


// ============================================================
// MEMBER EVENT DELEGATION
// ============================================================

memberList?.addEventListener(

    "click",

    event => {

        const target =
            event.target as HTMLElement;


        const button =
            target.closest<HTMLButtonElement>(
                "button"
            );


        if (!button) {
            return;
        }


        const id =
            button.dataset.id;


        if (!id) {
            return;
        }


        if (
            button.classList.contains(
                "edit-member"
            )
        ) {

            editMember(id);

            return;
        }


        if (
            button.classList.contains(
                "delete-member"
            )
        ) {

            void deleteMember(id);
        }
    }
);


// ============================================================
// TASK EVENT DELEGATION
// ============================================================

taskList?.addEventListener(

    "click",

    event => {

        const target =
            event.target as HTMLElement;


        const button =
            target.closest<HTMLButtonElement>(
                "button"
            );


        if (!button) {
            return;
        }


        const id =
            button.dataset.id;


        if (!id) {
            return;
        }


        if (
            button.classList.contains(
                "edit-task"
            )
        ) {

            editTask(id);

            return;
        }


        if (
            button.classList.contains(
                "delete-task"
            )
        ) {

            void deleteTask(id);
        }
    }
);


// ============================================================
// SEARCH EVENTS
// ============================================================

searchForm?.addEventListener(

    "submit",

    event => {

        event.preventDefault();

        renderProjects();
    }
);


searchInput?.addEventListener(

    "input",

    () => {

        renderProjects();
    }
);


// ============================================================
// FILTER EVENTS
// ============================================================

projectFilter?.addEventListener(

    "change",

    () => {

        renderProjects();
    }
);


memberFilter?.addEventListener(

    "change",

    () => {

        renderProjects();
    }
);


taskFilter?.addEventListener(

    "change",

    () => {

        renderProjects();
    }
);


// ============================================================
// START APPLICATION
// ============================================================

loadProjects();

loadMembers();

loadTasks();