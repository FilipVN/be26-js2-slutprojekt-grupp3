// update 2026-09-09

//ref: create a reference ("projects") to a location in Firebase Realtime Database
//push: add data under a new unique ID
//onValue: listen for changes in Firebase Realtime Database and retrieve data
//database: initialize Firebase Realtime Database instance

//interface: structure of an object
//class: blueprint for creating objects with properties and methods
//constructor: 

import { ref, push, onValue } from "firebase/database";
import { database } from "./firebase";

interface Member {
    name: string;
    category: string;
}

/*** Project class ***/
class Project {
    name: string;
    description: string;
    category: string;
    deadline: string;
    created: string;
    member: Member;
    tasks: string[];
    status: string;
    priority: string;

    constructor(
        name: string,
        description: string,
        category: string,
        deadline: string,
        created: string,
        member: Member,
        tasks: string[],
        status: string,
        priority: string
    ) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.deadline = deadline;
        this.created = created;
        this.member = member;
        this.tasks = tasks;
        this.status = status;
        this.priority = priority;
    }

    /* number of tasks */
    getTaskCount(): number {
        return this.tasks.length;
    }


    /* Method inside the class */
    getProjectInfo(): string {
        return `${this.name} - ${this.status}`;
    }
}


/**************** export project-form.ts to main.ts ************************/
export function initProjectForm(): void {

/* html elements */
    const projectForm =
        document.querySelector<HTMLFormElement>("#project-form");

    const projectNameInput =
        document.querySelector<HTMLTextAreaElement>("#project-name");

    const projectDescriptionInput =
        document.querySelector<HTMLTextAreaElement>("#project-description");

    const projectCategoryInput =
        document.querySelector<HTMLSelectElement>("#project-category");

    const projectDeadlineInput =
        document.querySelector<HTMLInputElement>("#project-deadline");

    const projectCreatedInput =
        document.querySelector<HTMLInputElement>("#project-created");

    const projectMemberNameInput =
        document.querySelector<HTMLInputElement>("#project-member-name");

    const projectMemberCategoryInput =
        document.querySelector<HTMLSelectElement>("#project-member-category");

    const projectTasksInput =
        document.querySelector<HTMLTextAreaElement>("#project-tasks");

    const projectStatusInput =
        document.querySelector<HTMLSelectElement>("#project-status");

    const projectPriorityInput =
        document.querySelector<HTMLSelectElement>("#project-priority");

    const projectList =
        document.querySelector<HTMLDivElement>("#project-list");

    if (
        !projectForm ||
        !projectNameInput ||
        !projectDescriptionInput ||
        !projectCategoryInput ||
        !projectDeadlineInput ||
        !projectCreatedInput ||
        !projectMemberNameInput ||
        !projectMemberCategoryInput ||
        !projectTasksInput ||
        !projectStatusInput ||
        !projectPriorityInput ||
        !projectList
    ) {
        throw new Error("Projects not found.");
    }


/*** Firebase reference projects node ***/
    const projectsRef = ref(database, "projects");


/*** Add each project to Firebase ***/
    function createProject(): Project {
        const projectName = projectNameInput.value.trim();
        const projectDescription = projectDescriptionInput.value.trim();
        const projectCategory = projectCategoryInput.value;
        const projectDeadline = projectDeadlineInput.value;
        const projectCreated = projectCreatedInput.value;
        const projectMemberName = projectMemberNameInput.value.trim();
        const projectMemberCategory = projectMemberCategoryInput.value;
        const projectStatus = projectStatusInput.value;
        const projectPriority = projectPriorityInput.value;


        // Split tasks by comma, trim whitespace, and filter out empty strings
        const projectTasks: string[] =projectTasksInput.value
                .split(",")
                .map((task) => task.trim())
                .filter((task) => task !== "");

        // Create a Member object
        const member: Member = {
            name: projectMemberName,
            category: projectMemberCategory
        };


        // Create object from Project class 
        const project =
            new Project(
                projectName,
                projectDescription,
                projectCategory,
                projectDeadline,
                projectCreated,
                member,
                projectTasks,
                projectStatus,
                projectPriority
            );
        return project;
    }


    /*** save a Project to Firebase ***/
    async function saveProject(project: Project): Promise<void> {
        try {
            await push(projectsRef, project);
            console.log("Project added:", project);
        } catch (error: unknown) {
            console.error("Project not added:", error);
        }
    }


    /*** Reset the form after submission ***/
    function resetProjectForm(): void {
        projectForm.reset();

        //set TODAY as project-created
        const today = new Date().toISOString().split("T")[0];
        projectCreatedInput.value = today;
    }


    /*** eventListener for ADD button ***/
    projectForm.addEventListener("submit",
        async (event: SubmitEvent) => {
            event.preventDefault();
            const project = createProject();

            // if input value is empty 
            if (
                project.name === "" ||
                project.description === "" ||
                project.deadline === "" ||
                project.member.name === ""
            ) {
                console.log("Please complete the form.");
                return;
            }

            // if all input values are filled, save a project 
            // save a project and reset the form
            await saveProject(project);
            console.log(project.getProjectInfo());
            console.log("Number of tasks:", project.getTaskCount());

            resetProjectForm();
        }
    );


    /*** Project card: without styling ***/
    function displayProject(project: Project, projectId: string ): void {
        const projectCard = document.createElement("div");
        projectCard.classList.add("project-card");
        

        /* projectCard: Joanna + Filip ??? 8 october  **********************************/
        projectCard.innerHTML = `
            <br><h3>${project.name}</h3>
            <p><strong>ID:</strong>${projectId}</p>
            <p><strong>Description:</strong>${project.description} </p>
            <p><strong>Category:</strong>${project.category}</p>
            <p><strong>Created:</strong>${project.created}</p>
            <p><strong>Deadline:</strong>${project.deadline}</p>
            <p><strong>Member:</strong>${project.member.name}</p>
            <p><strong>Member Category:</strong>${project.member.category} </p>
            <p><strong>Tasks:</strong>${project.tasks.join(", ")} </p>
            <p><strong>Task count:</strong>${project.getTaskCount()}</p>
            <p><strong>Status:</strong>${project.status}</p>
            <p><strong>Priority:</strong>${project.priority}</p>
        `;

        // Append the project card to the project list
        projectList.appendChild(projectCard);
    }


    /*** fetch projects from Firebase Realtime Database and display them ***/
    onValue(projectsRef,(snapshot) => {
            projectList.innerHTML = "";

            // if no projects found 
            if (!snapshot.exists()) {
                projectList.innerHTML = "<p>No projects found.</p>";
                return;
            }
            //fetch each project if projects found */
            snapshot.forEach((childSnapshot) => {
                    const data = childSnapshot.val();
                    const projectId = childSnapshot.key;

                    //if no project ID is available, Firebase returns empty string */
                    if (!projectId) {
                        return;
                    }

                    //Create a Project object from the fetched data */
                    const project =
                        new Project(
                            data.name,
                            data.description,
                            data.category,
                            data.deadline,
                            data.created,
                            data.member,
                            data.tasks ?? [],
                            data.status,
                            data.priority
                        );


                    displayProject(project, projectId);
                }
            );
        }
    );
}