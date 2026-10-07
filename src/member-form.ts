import { ref, push, onValue } from "firebase/database";
import { database } from "./firebase";

class Member{
    name: string;
    category: string;

    constructor(name: string, category: string) {
        this.name = name;
        this.category = category;
    }
}

export function initMemberForm(): void {
    const memberForm = document.querySelector<HTMLFormElement>("#member-form");
    const memberNameInput = document.querySelector<HTMLInputElement>("#member-name");
    const memberCategoryInput = document.querySelector<HTMLInputElement>("#member-category");
    const memberList = document.querySelector<HTMLDivElement>("#member-list");

    if (!memberForm || !memberNameInput || !memberCategoryInput || !memberList) {
        throw new Error("Member form elements could not be found.");
    }

    const membersRef = ref(database, "members");

    memberForm.addEventListener("submit", async (event: SubmitEvent) => {
        event.preventDefault();

        const memberName: string = memberNameInput.value.trim();
        const memberCategory: string = memberCategoryInput.value.trim();

        if (memberName === "" || memberCategory === "") {
            return;
        }

        const member: Member = new Member(memberName, memberCategory);

        try {
            await push(membersRef, member);
            console.log("Member added:", member);
            memberForm.reset();
        } catch (error: unknown) {
            console.error("Could not add member:", error);
        }
    });

    onValue(membersRef, (snapshot) => {
        memberList.innerHTML = "";

        if (!snapshot.exists()) {
            memberList.innerHTML = "<p>No members found.</p>";
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const member = childSnapshot.val() as Member;
            const memberId = childSnapshot.key;

            if (!memberId) {
                console.error("Member ID is null or undefined.");
                return;
            }

            const memberCard = document.createElement("div");
            memberCard.className = "member-card";
            memberCard.innerHTML = `
                <h3>${member.name}</h3>
                <p><strong>Category:</strong> ${member.category}</p>
            `;

            memberList.appendChild(memberCard);
        });
    });


};