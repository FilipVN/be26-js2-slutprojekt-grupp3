
import { ref, push, onValue } from "firebase/database";
import { database } from "./firebase";

// 1. INTERFACE
// Defines what information a project contains

interface Member {
    name: string;
    category: string;
}

interface ProjectData {
    name: string;
    description: string;
    category: string;
    deadline: string;
    created: string;
    member: Member;
    tasks: string[];
    status: string;
    priority: string;
}

// 2. CLASS AND CONSTRUCTOR
// Creates a new project

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

    constructor(data: ProjectData) {
        this.name = data.name;
        this.description = data.description;
        this.category = data.category;
        this.deadline = data.deadline;
        this.created = data.created;
        this.member = data.member;
        this.tasks = data.tasks;
        this.status = data.status;
        this.priority = data.priority;
    }
}

// 3. FIREBASE REFERENCE
const projectsRef = ref(database, "projects");

// 4. FUNCTION
// Get the value from an HTML element

function getValue(id: string): string {
    const input = document.getElementById(id) as
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

    return input.value;
}

// 5. ASYNC FUNCTION
// Save a project to Firebase

async function addProject(project: Project): Promise<void> {
    await push(projectsRef, {
        name: project.name,
        description: project.description,
        category: project.category,
        deadline: project.deadline,
        created: project.created,
        member: project.member,
        tasks: project.tasks,
        status: project.status,
        priority: project.priority
    });

    console.log("Project saved!");
}

// 6. export initProjectForm function to main.ts
export function initProjectForm(): void {

    // Find the form and project list
    const projectForm =
        document.querySelector<HTMLFormElement>("#project-form");

    const projectList =
        document.querySelector<HTMLDivElement>("#project-list");

    if (!projectForm || !projectList) {
        return;
    }

    //fetch exisitng project names and member names from firebase
    loadExistingNames();



    // Set today's date (YYYY-MM-DD) in the "created" input field
    const createdInput =
        document.querySelector<HTMLInputElement>("#project-created");

    function setToday(): void {
        if (createdInput) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, "0");
            const day = String(today.getDate()).padStart(2, "0");

            createdInput.value = `${year}-${month}-${day}`;
        }
    }

    setToday();

    // 7. ADD PROJECT
    projectForm.addEventListener("submit", async (event) => {
        // Prevent the default form submission behavior
        event.preventDefault();

        // Create a new project object
        const project = new Project({
            name: getValue("project-name"),
            description: getValue("project-description"),
            category: getValue("project-category"),
            deadline: getValue("project-deadline"),
            created: getValue("project-created"),

            member: {
                name: getValue("project-member-name"),
                category: getValue("project-member-category")
            },

            tasks: getValue("project-tasks").split(","),
            status: getValue("project-status"),
            priority: getValue("project-priority")
        });

        // Save to Firebase
        try {
            await addProject(project);

            // Clear the form
            projectForm.reset();
            setToday();

        } catch (error) {
            console.error("Error:", error);
        }
    });


function loadExistingNames(): void {

    const projectNameList =
        document.querySelector<HTMLDataListElement>("#project-name-list");

    const memberNameList =
        document.querySelector<HTMLDataListElement>("#member-name-list");

    if (!projectNameList || !memberNameList) {
        return;
    }

    const projectsRef = ref(database, "projects");

    // Listen to existing projects in Firebase
    onValue(projectsRef, (snapshot) => {

        // Clear old suggestions
        projectNameList.innerHTML = "";
        memberNameList.innerHTML = "";

        const projectNames = new Set<string>();
        const memberNames = new Set<string>();

        // Loop through projects
        snapshot.forEach((childSnapshot) => {

            const project = childSnapshot.val() as ProjectData;

            // Get existing project names
            if (project.name) {
                projectNames.add(project.name);
            }

            // Get existing member names
            if (project.member?.name) {
                memberNames.add(project.member.name);
            }
        });

        // Add project name suggestions
        projectNames.forEach((name) => {

            const option = document.createElement("option");
            option.value = name;

            projectNameList.appendChild(option);
        });

        // Add member name suggestions
        memberNames.forEach((name) => {

            const option = document.createElement("option");
            option.value = name;

            memberNameList.appendChild(option);
        });

    }, (error) => {
        console.error("No existing names:", error);
    });
}





    // 8. FETCH PROJECTS FROM FIREBASE
    onValue(projectsRef, (snapshot) => {

        projectList.innerHTML = "";

        if (!snapshot.exists()) {
            projectList.textContent = "No projects found.";
            return;
        }

        // Loop through projects
        snapshot.forEach((childSnapshot) => {

            const project = childSnapshot.val() as ProjectData;
            const projectId = childSnapshot.key;

            // Create a project card
            const card = document.createElement("div");
            card.className = "project-card";

            // Create title
            const title = document.createElement("h3");
            title.textContent = project.name;
            card.appendChild(title);

            // Function to display each field
            function addText(label: string, value: string): void {
                const p = document.createElement("p");
                const strong = document.createElement("strong");

                strong.textContent = label + ": ";
                p.appendChild(strong);
                p.appendChild(document.createTextNode(value));

                card.appendChild(p);
            }

            // Display project information
            addText("ID", projectId ?? "");
            addText("Description", project.description ?? "");
            addText("Category", project.category ?? "");
            addText("Deadline", project.deadline ?? "");
            addText("Created", project.created ?? "");
            addText("Member", project.member?.name ?? "");
            addText("Member Category", project.member?.category ?? "");
            addText("Tasks", project.tasks?.join(", ") ?? "");
            addText("Status", project.status ?? "");

            // Priority color
            let priority = "🟢 Low";

            if (project.priority === "medium") {
                priority = "🟡 Medium";
            }

            if (project.priority === "high") {
                priority = "🔴 High";
            }

            if (!project.priority) {
                priority = "Not set";
            }

            addText("Priority", priority);

            // Add card to project list
            projectList.appendChild(card);
        });

    }, (error) => {
        console.error("Error loading projects:", error);
        projectList.textContent = "Could not load projects.";
    });

}     //end of export function initProjectForm()
