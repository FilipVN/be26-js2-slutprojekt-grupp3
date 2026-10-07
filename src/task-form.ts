import { ref, push, onValue } from "firebase/database";
import { database } from "./firebase";


interface Task {name: string;}

//export function initTaskForm() to main.ts
export function initTaskForm(): void {

// HTML elements
const taskForm =
    document.querySelector<HTMLFormElement>("#task-form");

const taskNameInput =
    document.querySelector<HTMLInputElement>("#task-name");

const taskList =
    document.querySelector<HTMLDivElement>("#task-list");

if (!taskForm || !taskNameInput || !taskList) {
    throw new Error("task form elements could not be found.");
}

// Firebase reference
const tasksRef = ref(database, "tasks");

// Add task to Firebase
taskForm.addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();

    const taskName: string = taskNameInput.value.trim();

    if (taskName === "") {
        return;
    }

    const task: Task = {
        name: taskName
    };

    try {
        await push(tasksRef, task);
        console.log("task added:", task);
        taskForm.reset();
    } catch (error: unknown) {
        console.error("Could not add task:", error);
    }
});

// Fetch tasks from Firebase
onValue(tasksRef, (snapshot) => {
    taskList.innerHTML = "";

    if (!snapshot.exists()) {
        taskList.innerHTML = "<p>No tasks found.</p>";
        return;
    }

    snapshot.forEach((childSnapshot) => {
        const task = childSnapshot.val() as task;
        const taskId: string | null = childSnapshot.key;
        
        const taskCard: HTMLDivElement =
            document.createElement("div");

        taskCard.classList.add("task-card");

        taskCard.innerHTML = `
            <h3>${task.name}</h3>
            <p>ID: ${taskId}</p>
        `;

        taskList.appendChild(taskCard);
    });
})

};