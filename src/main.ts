import { initProjectForm } from "./project-form";


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

    await loadHTML("form-container", "./project-form.html");

    initProjectForm();

} 

startApp().catch(console.error);
//*****************************************/

