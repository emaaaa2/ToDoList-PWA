const taskInput = document.getElementById("taskInput");
const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const daysInput = document.getElementById("days");
const monthsInput = document.getElementById("months");
const yearsInput = document.getElementById("years");
const addBtn = document.getElementById("addBtn");
const todoList = document.getElementById("todoList");

Notification.requestPermission();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(reg => {
        console.log("Service Worker Registered");
    });
}

const dbPromise = idb.open("TodoDB", 2, (upgradeDB) => {
    if (!upgradeDB.objectStoreNames.contains("tasks")) {
        upgradeDB.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
    }
});

window.addEventListener("DOMContentLoaded", loadTasks);

addBtn.onclick = async function () {
    const text = taskInput.value.trim();
    if (!text) return alert("Enter Task");

    const taskDate = new Date(yearsInput.value, monthsInput.value - 1, daysInput.value, hoursInput.value, minutesInput.value);
    const task = { text: text, time: taskDate.getTime() };

    const db = await dbPromise;
    const tx = db.transaction("tasks", "readwrite");
    task.id = await tx.objectStore("tasks").add(task);
    await tx.complete;

    addTaskToUI(task);
    scheduleNotification(task);
};

async function loadTasks() {
    const db = await dbPromise;
    const tasks = await db.transaction("tasks").objectStore("tasks").getAll();
    tasks.forEach(task => {
        addTaskToUI(task);
        scheduleNotification(task);
    });
}

navigator.serviceWorker.addEventListener('message', event => {
    if (event.data.type === 'MARK_DONE') {
        const li = document.querySelector(`li[data-id="${event.data.id}"]`);
        if (li) {
            li.style.textDecoration = "line-through";
            li.style.opacity = "0.5";
        }
    }
});

function addTaskToUI(task) {
    const li = document.createElement("li");
    li.setAttribute('data-id', task.id); 
    li.innerHTML = `
        <span>${task.text} — ${new Date(task.time).toLocaleString()}</span>
        <button class="deleteBtn">Delete</button>
    `;

    li.querySelector(".deleteBtn").onclick = async () => {
        const db = await dbPromise;
        const tx = db.transaction("tasks", "readwrite");
        await tx.objectStore("tasks").delete(task.id);
        await tx.complete;
        li.remove();
    };

    todoList.appendChild(li);
}

function scheduleNotification(task) {
    const delay = task.time - Date.now();
    if (delay > 0) {
        setTimeout(() => {
            navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification("To do list", {
                    body: `HEY! Your task "${task.text}" is now overdue.`,
                    icon: "image.png",
                    data: { id: task.id },
                    actions: [
                        { action: "open", title: "Open" },
                        { action: "close", title: "Close" }
                    ]
                });
            });
        }, delay);
    }
}
