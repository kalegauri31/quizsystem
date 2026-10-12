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

document.querySelectorAll('[data-password-toggle]').forEach((toggle) => {
  const passwordInput = document.getElementById(toggle.getAttribute('aria-controls'));
  if (!passwordInput) return;

  toggle.addEventListener('click', () => {
    const isVisible = passwordInput.type === 'text';
    passwordInput.type = isVisible ? 'password' : 'text';
    toggle.textContent = isVisible ? 'Show' : 'Hide';
    toggle.setAttribute('aria-label', `${isVisible ? 'Show' : 'Hide'} password`);
    toggle.setAttribute('aria-pressed', String(!isVisible));
  });
});

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

const usersStorageKey = 'tyQuizUsers';
const passwordHashIterations = 120000;

function getRegisteredUsers() {
  const storedUsers = window.localStorage.getItem(usersStorageKey);
  if (!storedUsers) return [];

  const users = JSON.parse(storedUsers);
  if (!Array.isArray(users)) {
    throw new Error('Saved account data is invalid. Clear the site data and register again.');
  }
  return users;
}

const authEntry = document.body.hasAttribute('data-auth-entry');
if (authEntry) {
  try {
    const users = getRegisteredUsers();
    window.location.replace(users.length > 0 ? 'login.html' : 'register.html');
  } catch (error) {
    console.error(error);
  }
}

function showAuthMessage(form, message, isError = true) {
  const messageElement = form.parentElement.querySelector('[data-auth-message]');
  if (!messageElement) return;

  messageElement.textContent = message;
  messageElement.dataset.error = String(isError);
}

async function hashPassword(password, salt) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Secure password checks are unavailable. Open this site through localhost or HTTPS.');
  }

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hash = await window.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: passwordHashIterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function createPasswordSalt() {
  const salt = new Uint8Array(16);
  window.crypto.getRandomValues(salt);
  return Array.from(salt, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function saltFromHex(salt) {
  return new Uint8Array(salt.match(/.{2}/g).map((byte) => Number.parseInt(byte, 16)));
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  const emailInput = loginForm.elements.namedItem('email');

  if (emailInput) emailInput.addEventListener('blur', () => { emailInput.value = emailInput.value.trim(); });

  const registeredEmail = new URLSearchParams(window.location.search).get('registered');
  if (registeredEmail) {
    emailInput.value = registeredEmail;
    showAuthMessage(loginForm, 'Account created. Log in with your email and password.', false);
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;

    const submitButton = loginForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    showAuthMessage(loginForm, '');
    try {
      const email = emailInput.value.trim().toLowerCase();
      const password = loginForm.elements.namedItem('password').value;
      const user = getRegisteredUsers().find((registeredUser) => registeredUser.email === email);

      if (!user || (await hashPassword(password, saltFromHex(user.salt))) !== user.passwordHash) {
        showAuthMessage(loginForm, 'Email or password is incorrect. Register first if you do not have an account.');
        return;
      }

      window.sessionStorage.setItem('tyQuizSession', JSON.stringify({ name: user.name, email: user.email }));
      window.location.href = 'dashboard.html';
    } catch (error) {
      showAuthMessage(loginForm, error instanceof Error ? error.message : 'Unable to log in. Please try again.');
    } finally {
      submitButton.disabled = false;
    }
  });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  const nameInput = registerForm.elements.namedItem('fullName');
  const emailInput = registerForm.elements.namedItem('email');
  const passwordInput = registerForm.elements.namedItem('password');
  const confirmPasswordInput = registerForm.elements.namedItem('confirmPassword');
  const validatePasswordMatch = () => {
    confirmPasswordInput.setCustomValidity(
      confirmPasswordInput.value === passwordInput.value ? '' : 'Passwords do not match.'
    );
  };

  nameInput.addEventListener('blur', () => { nameInput.value = nameInput.value.trim(); });
  emailInput.addEventListener('blur', () => { emailInput.value = emailInput.value.trim(); });
  passwordInput.addEventListener('input', validatePasswordMatch);
  confirmPasswordInput.addEventListener('input', validatePasswordMatch);

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    validatePasswordMatch();
    if (!registerForm.reportValidity()) return;

    const submitButton = registerForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    showAuthMessage(registerForm, '');
    try {
      const email = emailInput.value.trim().toLowerCase();
      const users = getRegisteredUsers();
      if (users.some((user) => user.email === email)) {
        showAuthMessage(registerForm, 'An account with this email already exists. Please log in.');
        return;
      }

      const salt = createPasswordSalt();
      const passwordHash = await hashPassword(passwordInput.value, saltFromHex(salt));
      users.push({ name: nameInput.value.trim(), email, salt, passwordHash });
      window.localStorage.setItem(usersStorageKey, JSON.stringify(users));
      window.location.href = `login.html?registered=${encodeURIComponent(email)}`;
    } catch (error) {
      showAuthMessage(registerForm, error instanceof Error ? error.message : 'Unable to create your account. Please try again.');
    } finally {
      submitButton.disabled = false;
    }
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
