(() => {
  // ─── State ───────────────────────────────────────────────
  let tasks = [
  {
    id: "vuln-1",
    text: "Hardcoded API key detected (Semgrep)",
    done: false,
    created: Date.now()
  }
];
  
  let filter = 'all';

  // ─── DOM ─────────────────────────────────────────────────
  const taskInput   = document.getElementById('taskInput');
  const addBtn      = document.getElementById('addBtn');
  const taskList    = document.getElementById('taskList');
  const emptyState  = document.getElementById('emptyState');
  const totalCount  = document.getElementById('totalCount');
  const doneCount   = document.getElementById('doneCount');
  const progressBar = document.getElementById('progressBar');
  const clearDone   = document.getElementById('clearDone');
  const dateDisplay = document.getElementById('dateDisplay');
  const filterBtns  = document.querySelectorAll('.filter-btn');

  // ─── Date ────────────────────────────────────────────────
  const now = new Date();
  dateDisplay.textContent = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  }).toUpperCase();

  // ─── Save ─────────────────────────────────────────────────
  function save() {
    localStorage.setItem('doit-tasks', JSON.stringify(tasks));
  }

  // ─── Generate ID ─────────────────────────────────────────
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  // ─── Add Task ─────────────────────────────────────────────
  function addTask() {
    const text = taskInput.value.trim();
    if (!text) {
      taskInput.classList.add('shake');
      setTimeout(() => taskInput.classList.remove('shake'), 400);
      return;
    }
    tasks.unshift({ id: uid(), text, done: false, created: Date.now() });
    save();
    render();
    taskInput.value = '';
    taskInput.focus();
  }

  // ─── Toggle Done ─────────────────────────────────────────
  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) { task.done = !task.done; save(); render(); }
  }

  // ─── Delete Task ─────────────────────────────────────────
  function deleteTask(id) {
    const li = taskList.querySelector(`[data-id="${id}"]`);
    if (li) {
      li.classList.add('removing');
      li.addEventListener('animationend', () => {
        tasks = tasks.filter(t => t.id !== id);
        save();
        render();
      }, { once: true });
    }
  }

  // ─── Edit Task (inline) ──────────────────────────────────
  function editTask(id, newText) {
    const task = tasks.find(t => t.id === id);
    if (task && newText.trim()) {
      task.text = newText.trim();
      save();
    } else if (task && !newText.trim()) {
      deleteTask(id);
    }
  }

  // ─── Filtered Tasks ──────────────────────────────────────
  function filteredTasks() {
    if (filter === 'active') return tasks.filter(t => !t.done);
    if (filter === 'done')   return tasks.filter(t => t.done);
    return tasks;
  }

  // ─── Render ──────────────────────────────────────────────
  function render() {
    const visible = filteredTasks();
    taskList.innerHTML = '';

    // Stats
    const total = tasks.length;
    const done  = tasks.filter(t => t.done).length;
    totalCount.textContent = total;
    doneCount.textContent  = done;
    progressBar.style.width = total ? `${(done / total) * 100}%` : '0%';

    // Empty state
    emptyState.classList.toggle('visible', visible.length === 0);

    // Render items
    visible.forEach((task, i) => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.done ? ' done' : '');
      li.dataset.id = task.id;
      li.style.animationDelay = `${i * 0.04}s`;

      // Checkbox
      const check = document.createElement('div');
      check.className = 'task-check' + (task.done ? ' checked' : '');
      check.innerHTML = `<svg class="checkmark" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-5" stroke="#0e0e0e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
      check.addEventListener('click', () => toggleTask(task.id));

      // Text (editable)
      const span = document.createElement('span');
      span.className = 'task-text';
      span.textContent = task.text;
      span.contentEditable = 'true';
      span.spellcheck = false;

      span.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); span.blur(); }
        if (e.key === 'Escape') { span.textContent = task.text; span.blur(); }
      });

      span.addEventListener('blur', () => {
        editTask(task.id, span.textContent);
      });

      // Prevent editing done items easily
      span.addEventListener('click', e => e.stopPropagation());

      // Delete button
      const del = document.createElement('button');
      del.className = 'task-delete';
      del.setAttribute('aria-label', 'Delete task');
      del.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`;
      del.addEventListener('click', () => deleteTask(task.id));

      li.appendChild(check);
      li.appendChild(span);
      li.appendChild(del);
      taskList.appendChild(li);
    });
  }

  // ─── Events ──────────────────────────────────────────────
  addBtn.addEventListener('click', addTask);

  taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
  });

  clearDone.addEventListener('click', () => {
    const doneTasks = tasks.filter(t => t.done);
    if (!doneTasks.length) return;

    // Animate out each done item visible in the list
    const items = taskList.querySelectorAll('.task-item.done');
    let remaining = items.length;
    if (remaining === 0) {
      tasks = tasks.filter(t => !t.done);
      save(); render(); return;
    }
    items.forEach(li => {
      li.classList.add('removing');
      li.addEventListener('animationend', () => {
        remaining--;
        if (remaining === 0) {
          tasks = tasks.filter(t => !t.done);
          save(); render();
        }
      }, { once: true });
    });
  });

  // ─── Shake keyframe ──────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%,100%{transform:translateX(0)}
      20%{transform:translateX(-6px)}
      40%{transform:translateX(6px)}
      60%{transform:translateX(-4px)}
      80%{transform:translateX(4px)}
    }
    .shake { animation: shake 0.4s ease; }
  `;
  document.head.appendChild(style);

  // ─── Init ────────────────────────────────────────────────
  render();
})();
