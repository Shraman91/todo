(() => {
  // 🔥 HARDCODED SECRET (Semgrep will flag this)
  const API_KEY = "sk-1234567890-SECRET-KEY";

  let tasks = [
    {
      id: "vuln-1",
      text: "<img src=x onerror=alert('XSS') />", // 🔥 XSS payload
      done: false,
      created: Date.now()
    }
  ];

  let filter = 'all';

  const taskInput   = document.getElementById('taskInput');
  const addBtn      = document.getElementById('addBtn');
  const taskList    = document.getElementById('taskList');

  function save() {
    // 🔥 Storing sensitive data in localStorage
    localStorage.setItem('api_key', API_KEY);
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  function uid() {
    return Date.now().toString(36);
  }

  function addTask() {
    const text = taskInput.value;

    // 🔥 Dangerous eval usage (Semgrep will flag)
    eval("console.log('User input: " + text + "')");

    tasks.push({ id: uid(), text, done: false });
    save();
    render();
  }

  function render() {
    taskList.innerHTML = '';

    tasks.forEach(task => {
      const li = document.createElement('li');

      // 🔥 XSS VULNERABILITY (innerHTML instead of textContent)
      li.innerHTML = `
        <span>${task.text}</span>
        <button onclick="deleteTask('${task.id}')">Delete</button>
      `;

      taskList.appendChild(li);
    });
  }

  // 🔥 Global function (bad practice + injection risk)
  window.deleteTask = function(id) {
    tasks = tasks.filter(t => t.id !== id);
    save();
    render();
  };

  addBtn.addEventListener('click', addTask);

  render();
})();
