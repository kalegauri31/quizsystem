const questions = [
  {
    question: 'Which keyword is used to declare a block-scoped variable?',
    options: ['var', 'let', 'function', 'const'],
    answer: 'let',
  },
  {
    question: 'Which HTML tag is used to create a link?',
    options: ['<link>', '<a>', '<href>', '<url>'],
    answer: '<a>',
  },
  {
    question: 'Which CSS property changes text color?',
    options: ['color', 'background', 'font-size', 'margin'],
    answer: 'color',
  },
  {
    question: 'What does DOM stand for?',
    options: ['Document Object Model', 'Data Object Method', 'Design Object Manager', 'Document Oriented Module'],
    answer: 'Document Object Model',
  },
];

const questionContainer = document.getElementById('questionContainer');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const timeLeftEl = document.getElementById('timeLeft');

let currentQuestion = 0;
let selectedAnswers = new Array(questions.length).fill(null);
let timeLeft = 60;

function renderQuestion() {
  if (!questionContainer) return;

  const question = questions[currentQuestion];
  questionContainer.innerHTML = `
    <div class="question-box-card">
      <h3>Question ${currentQuestion + 1}</h3>
      <p>${question.question}</p>
      <div class="question-options">
        ${question.options
          .map(
            (option, index) => `
              <label class="option-item ${selectedAnswers[currentQuestion] === option ? 'selected' : ''}">
                <input type="radio" name="answer" value="${option}" ${selectedAnswers[currentQuestion] === option ? 'checked' : ''} />
                <span>${option}</span>
              </label>
            `
          )
          .join('')}
      </div>
    </div>
  `;

  const optionInputs = questionContainer.querySelectorAll('input[name="answer"]');
  optionInputs.forEach((input) => {
    input.addEventListener('change', (event) => {
      selectedAnswers[currentQuestion] = event.target.value;
      renderQuestion();
    });
  });

  if (prevBtn) {
    prevBtn.disabled = currentQuestion === 0;
    prevBtn.style.opacity = currentQuestion === 0 ? '0.5' : '1';
  }

  if (nextBtn) {
    nextBtn.textContent = currentQuestion === questions.length - 1 ? 'Submit' : 'Next';
  }
}

function changeQuestion(step) {
  const nextIndex = currentQuestion + step;
  if (nextIndex >= 0 && nextIndex < questions.length) {
    currentQuestion = nextIndex;
    renderQuestion();
  }

  if (nextBtn && currentQuestion === questions.length - 1 && nextBtn.textContent === 'Submit') {
    nextBtn.addEventListener('click', () => {
      window.location.href = 'result.html';
    }, { once: true });
  }
}

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (currentQuestion < questions.length - 1) {
      changeQuestion(1);
    } else {
      window.location.href = 'result.html';
    }
  });
}

if (prevBtn) {
  prevBtn.addEventListener('click', () => changeQuestion(-1));
}

if (timeLeftEl) {
  setInterval(() => {
    if (timeLeft > 0) {
      timeLeft -= 1;
      timeLeftEl.textContent = `${timeLeft}s`;
    }
  }, 1000);
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    window.location.href = 'dashboard.html';
  });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    window.location.href = 'dashboard.html';
  });
}

document.querySelectorAll('[data-admin-table]').forEach((table) => {
  const searchInput = document.querySelector('[data-table-search]');
  const filterInput = document.querySelector('[data-table-filter]');
  const emptyState = document.querySelector('[data-empty-state]');

  const filterRows = () => {
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selectedFilter = filterInput ? filterInput.value.toLowerCase() : 'all';
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    let visibleRows = 0;

    rows.forEach((row) => {
      const matchesSearch = row.textContent.toLowerCase().includes(searchTerm);
      const rowFilter = (row.dataset.status || row.dataset.filter || '').toLowerCase();
      const matchesFilter = selectedFilter === 'all' || rowFilter === selectedFilter;
      row.hidden = !matchesSearch || !matchesFilter;
      if (!row.hidden) visibleRows += 1;
    });

    if (emptyState) emptyState.classList.toggle('visible', visibleRows === 0);
  };

  if (searchInput) searchInput.addEventListener('input', filterRows);
  if (filterInput) filterInput.addEventListener('change', filterRows);

  table.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('[data-delete-row]');
    if (!deleteButton) return;
    const row = deleteButton.closest('tr');
    if (row && window.confirm('Delete this quiz from the list?')) {
      row.remove();
      filterRows();
    }
  });
});

const quizDialog = document.getElementById('quizDialog');
const openQuizDialog = document.getElementById('openQuizDialog');
const closeQuizDialog = document.getElementById('closeQuizDialog');
const createQuizForm = document.getElementById('createQuizForm');
const quizTable = document.querySelector('[data-admin-table]');

if (quizDialog && openQuizDialog && closeQuizDialog && createQuizForm && quizTable) {
  openQuizDialog.addEventListener('click', () => quizDialog.showModal());
  closeQuizDialog.addEventListener('click', () => quizDialog.close());

  createQuizForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!createQuizForm.reportValidity()) return;

    const formData = new FormData(createQuizForm);
    const status = formData.get('status');
    const row = document.createElement('tr');
    row.dataset.status = status;

    const titleCell = document.createElement('td');
    const title = document.createElement('strong');
    title.textContent = formData.get('title').trim();
    const updated = document.createElement('span');
    updated.className = 'table-muted';
    updated.textContent = 'Created just now';
    titleCell.append(title, updated);

    const categoryCell = document.createElement('td');
    categoryCell.textContent = formData.get('category').trim();
    const questionCell = document.createElement('td');
    questionCell.textContent = formData.get('questions');
    const attemptsCell = document.createElement('td');
    attemptsCell.textContent = '0';

    const statusCell = document.createElement('td');
    const statusPill = document.createElement('span');
    statusPill.className = status === 'published' ? 'pill success' : 'pill warning';
    statusPill.textContent = status === 'published' ? 'Published' : 'Draft';
    statusCell.append(statusPill);

    const actionsCell = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.className = 'text-button danger';
    deleteButton.type = 'button';
    deleteButton.dataset.deleteRow = '';
    deleteButton.textContent = 'Delete';
    actionsCell.append(deleteButton);

    row.append(titleCell, categoryCell, questionCell, attemptsCell, statusCell, actionsCell);
    quizTable.querySelector('tbody').prepend(row);
    createQuizForm.reset();
    quizDialog.close();
  });
}

renderQuestion();
