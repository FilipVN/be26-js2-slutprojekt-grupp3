import { initProjectForm } from "./project-form";
import { initMemberForm } from "./member-form";
import { initTaskForm } from "./task-form";

// Import the function from form.ts
// import { initProjectForm } from "./card";



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
    await loadHTML("card-container", "card.html");
    await loadHTML("form-container", "project-form.html");
    await loadHTML("form-container", "member-form.html");
    await loadHTML("form-container", "task-form.html");
    initProjectForm();
    initMemberForm();
    initTaskForm();
} 

startApp();
//*****************************************/

