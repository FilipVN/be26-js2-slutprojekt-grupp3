import { ref, push, onValue } from "firebase/database";
import { database } from "./firebase";


// HTML elements
const projectForm = document.querySelector(
    "#project-form") as HTMLFormElement;

const projectNameInput = document.querySelector("#project-name"
) as HTMLInputElement;

const projectList = document.querySelector(
    "#project-list"
) as HTMLDivElement;


// Firebase reference
const projectsRef = ref(database, "projects");


// add to Firebase
projectForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const projectName = projectNameInput.value.trim();
    if (projectName === "") {
        return;
    }

    const project = {name: projectName};
    try {
        await push(projectsRef, project);
        console.log("Project added:", project);
        projectForm.reset();
    } catch (error) {
        console.error("Could not add project:", error);
    }
});


// fetch data from Firebase
onValue(projectsRef, (snapshot) => {
    projectList.innerHTML = "";
    if (!snapshot.exists()) {
        projectList.innerHTML = "<p>No projects found.</p>";
        return;
    }

    snapshot.forEach((childSnapshot) => {
        const project = childSnapshot.val();
        const projectId = childSnapshot.key;
        const projectCard = document.createElement("div");

        projectCard.classList.add("project-card");
        projectCard.innerHTML = `
            <h3>${project.name}</h3>
            <p>ID: ${projectId}</p>
        `;

        projectList.appendChild(projectCard);
    });

});

