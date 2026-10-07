import { ref, push, onValue } from "firebase/database";
import { database } from "./firebase";


interface Project {name: string;}

//export function initProjectForm() to main.ts
export function initProjectForm(): void {

// HTML elements
const projectForm =
    document.querySelector<HTMLFormElement>("#project-form");

const projectNameInput =
    document.querySelector<HTMLInputElement>("#project-name");

const projectList =
    document.querySelector<HTMLDivElement>("#project-list");

if (!projectForm || !projectNameInput || !projectList) {
    throw new Error("Project form elements could not be found.");
}

// Firebase reference
const projectsRef = ref(database, "projects");

// Add project to Firebase
projectForm.addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();

    const projectName: string = projectNameInput.value.trim();

    if (projectName === "") {
        return;
    }

    const project: Project = {
        name: projectName
    };

    try {
        await push(projectsRef, project);
        console.log("Project added:", project);
        projectForm.reset();
    } catch (error: unknown) {
        console.error("Could not add project:", error);
    }
});

// Fetch projects from Firebase
onValue(projectsRef, (snapshot) => {
    projectList.innerHTML = "";

    if (!snapshot.exists()) {
        projectList.innerHTML = "<p>No projects found.</p>";
        return;
    }

    snapshot.forEach((childSnapshot) => {
        const project = childSnapshot.val() as Project;
        const projectId: string | null = childSnapshot.key;
        
        const projectCard: HTMLDivElement =
            document.createElement("div");

        projectCard.classList.add("project-card");

        projectCard.innerHTML = `
            <h3>${project.name}</h3>
            <p>ID: ${projectId}</p>
        `;

        projectList.appendChild(projectCard);
    });
})

};