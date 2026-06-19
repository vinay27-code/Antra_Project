const api = "https://dummyjson.com/todos";

const form = document.getElementById("todoForm");
const input = document.getElementById("todoInput");
const pendList = document.getElementById("pendList");
const doneList = document.getElementById("doneList");

let todos = [];
let editId = null;

async function getTodos() {
  const res = await fetch(api);
  const data = await res.json();

  todos = data.todos.slice(0, 10);

  render();
}

function render() {
  pendList.innerHTML = "";
  doneList.innerHTML = "";

  todos.forEach(t => {
    const li = document.createElement("li");
    li.className = "item";
    li.dataset.id = t.id;

    if (editId === t.id) {
      li.innerHTML = `
        <input class="edit-box" value="${t.todo}">
        <div class="btns">
          <button data-act="save">✓</button>
          <button data-act="del">🗑</button>
        </div>
      `;
    } else {
      li.innerHTML = `
        <span>${t.todo}</span>

        <div class="btns">
          <button data-act="move">
            ${t.completed ? "←" : "→"}
          </button>

          <button data-act="edit">✎</button>
          <button data-act="del">🗑</button>
        </div>
      `;
    }

    if (t.completed) {
      doneList.appendChild(li);
    } else {
      pendList.appendChild(li);
    }
  });
}

async function addTodo(txt) {
  const res = await fetch(`${api}/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      todo: txt,
      completed: false,
      userId: 1
    })
  });

  const data = await res.json();

  todos.unshift(data);

  render();
}

async function delTodo(id) {
  await fetch(`${api}/${id}`, {
    method: "DELETE"
  });

  todos = todos.filter(t => t.id !== id);

  render();
}

async function moveTodo(id) {
  const item = todos.find(t => t.id === id);

  const res = await fetch(`${api}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      completed: !item.completed
    })
  });

  const data = await res.json();

  todos = todos.map(t =>
    t.id === id
      ? { ...t, completed: data.completed }
      : t
  );

  render();
}

async function saveTodo(id, txt) {
  const res = await fetch(`${api}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      todo: txt
    })
  });

  const data = await res.json();

  todos = todos.map(t =>
    t.id === id
      ? { ...t, todo: data.todo }
      : t
  );

  editId = null;

  render();
}

function clickList(e) {
  const btn = e.target.closest("button");

  if (!btn) return;

  const li = btn.closest("li");
  const id = Number(li.dataset.id);
  const act = btn.dataset.act;

  if (act === "del") {
    delTodo(id);
  }

  if (act === "move") {
    moveTodo(id);
  }

  if (act === "edit") {
    editId = id;
    render();
  }

  if (act === "save") {
    const box = li.querySelector(".edit-box");

    saveTodo(id, box.value);
  }
}

pendList.addEventListener("click", clickList);
doneList.addEventListener("click", clickList);

form.addEventListener("submit", e => {
  e.preventDefault();

  const txt = input.value.trim();

  if (!txt) return;

  addTodo(txt);

  input.value = "";
});

getTodos();