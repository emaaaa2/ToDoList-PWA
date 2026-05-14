const taskInput = document.getElementById("taskInput");
const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const daysInput = document.getElementById("days");
const monthsInput = document.getElementById("months");
const yearsInput = document.getElementById("years");
const addBtn = document.getElementById("addBtn");
const todoList = document.getElementById("todoList");

Notification.requestPermission((status) => {
  console.log("Notification permission:", status);
});

window.addEventListener("load", () => {
  navigator.serviceWorker.register("sw.js").then(() => {
    console.log("Service Worker Registered");
  });
});

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
  const store = tx.objectStore("tasks");
  const id = await store.add(task);
  task.id = id; 
  await tx.complete;

  addTaskToUI(task);
  scheduleNotification(task);
};

async function loadTasks() {
  const db = await dbPromise;
  const tx = db.transaction("tasks");
  const tasks = await tx.objectStore("tasks").getAll();
  tasks.forEach(task => {
    addTaskToUI(task);
    scheduleNotification(task);
  });
}
navigator.serviceWorker.addEventListener('message', event => {
    if (event.data.type === 'TASK_COMPLETED') {
        const taskId = event.data.id;
        markTaskAsDone(taskId);
    }
});

function markTaskAsDone(id) {
    const taskElements = document.querySelectorAll('#todoList li');
    taskElements.forEach(li => {
        if (li.getAttribute('data-id') == id) {
            li.style.textDecoration = "line-through";
            li.style.opacity = "0.5";
        }
    });
}

function addTaskToUI(task) {
    const li = document.createElement("li");
    li.setAttribute('data-id', task.id); 
    li.innerHTML = `
        <span>${task.text} — ${new Date(task.time).toLocaleString()}</span>
        <button class="deleteBtn">X</button>
    `;
    todoList.appendChild(li);
}

function scheduleNotification(task) {
    const delay = task.time - Date.now();
    if (delay > 0) {
        setTimeout(() => {
            navigator.serviceWorker.getRegistration().then((reg) => {
                const options = {
                    body: `HEY! Your task "${task.text}" is now overdue.`,
                    icon: "image.png",
                    data: { 
                        id: task.id 
                    }, 
                    actions: [
                        { action: "open", title: "Open" },
                        { action: "close", title: "Close" }
                    ]
                };
                reg.showNotification("To do list", options);
            });
        }, delay);
    }
}