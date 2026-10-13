import { push, ref, set } from "firebase/database";
import { database } from "./firebase";

interface Member {
  name: string;
  category: string;
}

export function initMemberForm(
  form: HTMLFormElement,
  projectId: string,
  onAdded: () => void,
): void {
  const cancelButton = form.querySelector<HTMLButtonElement>(
    "#cancel-member-button",
  );

  cancelButton?.addEventListener("click", () => {
    const container = form.closest<HTMLElement>("#member-form-container");

    if (container) {
      container.hidden = true;
      form.reset();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nameInput = form.elements.namedItem(
      "project-member-name",
    ) as HTMLInputElement | null;
    const categoryInput = form.elements.namedItem(
      "project-member-category",
    ) as HTMLSelectElement | null;

    if (!nameInput || !categoryInput) {
      console.error("Member form fields could not be initialized.");
      return;
    }

    const member: Member = {
      name: nameInput.value.trim(),
      category: categoryInput.value,
    };

    if (!member.name) {
      nameInput.setCustomValidity("Enter a member name.");
      nameInput.reportValidity();
      return;
    }

    nameInput.setCustomValidity("");

    try {
      const memberReference = push(ref(database, `projects/${projectId}/members`));
      await set(memberReference, member);
      form.reset();
      onAdded();
    } catch (error: unknown) {
      console.error("Could not add member to project:", error);
      const message = document.createElement("p");
      message.className = "member-form-error";
      message.textContent = "Could not add member. Please try again.";
      form.appendChild(message);
    }
  });
}