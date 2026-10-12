import { initProjectForm } from "./project-form";
import { initProjects } from "./projects";


//*****************************************/
//main id=app, section container(card, form)
async function loadHTML (
    containerId: string,
    file: string
): Promise<void>{

    const response = await fetch(file);
    if (!response.ok) {
        throw new Error(`Failed to load ${file}: ${response.statusText}`);
    }

    const html = await response.text();

    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = html;
    } else {
        console.error(`Container with ID "${containerId}" not found.`);
    }   
}


//main id=app section container(card, form)
async function startApp(): Promise<void> {

    await loadHTML("project-form-container", "./project-form.html");

    await loadHTML("card-container", "./projects.html");

    const addProjectButton =
        document.querySelector<HTMLButtonElement>("#add-project-button");
    const projectFormContainer =
        document.querySelector<HTMLDivElement>("#project-form-container");

    if (!addProjectButton || !projectFormContainer) {
        throw new Error("Add project controls could not be initialized.");
    }

    addProjectButton.addEventListener("click", () => {
        projectFormContainer.hidden = !projectFormContainer.hidden;
        addProjectButton.setAttribute(
            "aria-expanded",
            String(!projectFormContainer.hidden)
        );
    });

    initProjectForm();
    initProjects();
} 

startApp().catch(console.error);
//*****************************************/
