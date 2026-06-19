const api = "https://dummyjson.com/todos";
const key = "todos";

const form = document.getElementById("todoForm");
const input = document.getElementById("todoInput");
const pendList = document.getElementById("pendList");
const doneList = document.getElementById("doneList");

let todos = [];
let editId = null;

function esc(txt) {
  return String(txt)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function save() {
  localStorage.setItem(key, JSON.stringify(todos));
}

function load() {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) return false;

    const data = JSON.parse(raw);

    if (!Array.isArray(data)) return false;

    todos = data;
    return true;
  } catch {
    localStorage.removeItem(key);
    return false;
  }
}

function paint() {
  pendList.innerHTML = "";
  doneList.innerHTML = "";

  todos.forEach(t => {
    const li = document.createElement("li");
    li.className = "item";
    li.dataset.id = String(t.id);

    if (editId === String(t.id)) {
      li.innerHTML = `
        <input class="edit-box" value="${esc(t.todo)}" />
        <div class="btns">
          <button data-act="save">✓</button>
          <button data-act="del">🗑</button>
        </div>
      `;
    } else {
      li.innerHTML = `
        <span>${esc(t.todo)}</span>
        <div class="btns">
          <button data-act="move">${t.completed ? "←" : "→"}</button>
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

async function boot() {
  if (load()) {
    paint();
    return;
  }

  try {
    const res = await fetch(api);
    const data = await res.json();

    todos = (data.todos || []).slice(0, 10);
    save();
    paint();
  } catch (err) {
    console.log(err);
  }
}

async function addTodo(txt) {
  const temp = {
    id: String(Date.now()),
    todo: txt,
    completed: false,
    userId: 1
  };

  todos.unshift(temp);
  save();
  paint();

  try {
    await fetch(`${api}/add`, {
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
  } catch (err) {
    console.log(err);
  }
}

async function delTodo(id) {
  todos = todos.filter(t => String(t.id) !== String(id));
  save();
  paint();

  try {
    await fetch(`${api}/${id}`, {
      method: "DELETE"
    });
  } catch (err) {
    console.log(err);
  }
}

async function moveTodo(id) {
  const item = todos.find(t => String(t.id) === String(id));
  if (!item) return;

  item.completed = !item.completed;
  save();
  paint();

  try {
    await fetch(`${api}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        completed: item.completed
      })
    });
  } catch (err) {
    console.log(err);
  }
}

async function saveTodo(id, txt) {
  if (!txt) return;

  const item = todos.find(t => String(t.id) === String(id));
  if (!item) return;

  item.todo = txt;
  editId = null;
  save();
  paint();

  try {
    await fetch(`${api}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        todo: txt
      })
    });
  } catch (err) {
    console.log(err);
  }
}

function onClick(e) {
  const btn = e.target.closest("button");
  if (!btn) return;

  const li = btn.closest("li");
  if (!li) return;

  const id = li.dataset.id;
  const act = btn.dataset.act;

  if (act === "del") {
    delTodo(id);
  }

  if (act === "move") {
    moveTodo(id);
  }

  if (act === "edit") {
    editId = String(id);
    paint();
  }

  if (act === "save") {
    const box = li.querySelector(".edit-box");
    saveTodo(id, box.value.trim());
  }
}

pendList.addEventListener("click", onClick);
doneList.addEventListener("click", onClick);

form.addEventListener("submit", e => {
  e.preventDefault();

  const txt = input.value.trim();
  if (!txt) return;

  addTodo(txt);
  input.value = "";
});

boot();