const API = '/expenses';

const form        = document.getElementById('expense-form');
const formTitle   = document.getElementById('form-title');
const expenseId   = document.getElementById('expense-id');
const labelInput  = document.getElementById('label');
const amountInput = document.getElementById('amount');
const dateInput   = document.getElementById('date');
const catInput    = document.getElementById('category');
const submitBtn   = document.getElementById('submit-btn');
const cancelBtn   = document.getElementById('cancel-btn');
const formError   = document.getElementById('form-error');

const loadingEl  = document.getElementById('loading');
const emptyEl    = document.getElementById('empty');
const tableEl    = document.getElementById('expenses-table');
const tbody      = document.getElementById('expenses-body');
const totalBadge = document.getElementById('total-badge');
const totalsGrid = document.getElementById('totals-grid');

// ── State ──────────────────────────────────────────────────────────────────
let allExpenses  = [];
let activeFilter = '';

// ── Helpers ────────────────────────────────────────────────────────────────
const CATEGORY_LABELS = {
  alimentaire: '🍎 Alimentaire',
  transport:   '🚗 Transport',
  logement:    '🏠 Logement',
  sante:       '💊 Santé',
  loisirs:     '🎮 Loisirs',
  autre:       '📦 Autre',
};

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

function showError(msg) {
  formError.textContent = msg;
  formError.classList.remove('hidden');
}
function clearError() {
  formError.textContent = '';
  formError.classList.add('hidden');
}

// ── Fetch all expenses ──────────────────────────────────────────────────────
async function loadExpenses() {
  loadingEl.classList.remove('hidden');
  tableEl.classList.add('hidden');
  emptyEl.classList.add('hidden');

  try {
    const res  = await fetch(API);
    allExpenses = await res.json();
    loadingEl.classList.add('hidden');
    renderTotals(allExpenses);
    applyFilter();
  } catch {
    loadingEl.textContent = 'Erreur de connexion à l\'API.';
  }
}

// ── Filtre ─────────────────────────────────────────────────────────────────
document.getElementById('filter-bar').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeFilter = btn.dataset.cat;
  applyFilter();
});

function applyFilter() {
  const filtered = activeFilter
    ? allExpenses.filter(e => e.category === activeFilter)
    : allExpenses;
  renderTable(filtered);
}

// ── Totaux par catégorie ───────────────────────────────────────────────────
function renderTotals(expenses) {
  const totals = {};
  expenses.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + parseFloat(e.amount);
  });

  if (!Object.keys(totals).length) {
    totalsGrid.innerHTML = '<p class="info">Aucune dépense enregistrée.</p>';
    return;
  }

  totalsGrid.innerHTML = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, sum]) => `
      <div class="total-item">
        <span class="total-label">${CATEGORY_LABELS[cat] || cat}</span>
        <span class="total-amount">${sum.toFixed(2)} €</span>
        <div class="total-bar-wrap">
          <div class="total-bar" style="width:${Math.min(100, (sum / expenses.reduce((a,e) => a + parseFloat(e.amount), 0)) * 100).toFixed(1)}%"></div>
        </div>
      </div>`)
    .join('');
}

function renderTable(expenses) {
  tbody.innerHTML = '';

  if (!expenses.length) {
    emptyEl.classList.remove('hidden');
    tableEl.classList.add('hidden');
    totalBadge.textContent = activeFilter ? 'Sous-total : 0.00 €' : 'Total : 0.00 €';
    return;
  }

  emptyEl.classList.add('hidden');
  let total = 0;

  expenses.forEach(e => {
    total += parseFloat(e.amount);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fmtDate(e.date)}</td>
      <td>${e.label}</td>
      <td><span class="badge">${CATEGORY_LABELS[e.category] || e.category}</span></td>
      <td class="amount-cell">${parseFloat(e.amount).toFixed(2)} €</td>
      <td>
        <button class="btn-edit"   onclick="startEdit(${JSON.stringify(e).replace(/"/g, '&quot;')})">✏️ Modifier</button>
        <button class="btn-delete" onclick="deleteExpense(${e.id})">🗑️ Supprimer</button>
      </td>`;
    tbody.appendChild(tr);
  });

  const label = activeFilter ? 'Sous-total' : 'Total';
  totalBadge.textContent = `${label} : ${total.toFixed(2)} €`;
  tableEl.classList.remove('hidden');
}

// ── Create / Update ─────────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const payload = {
    label:    labelInput.value.trim(),
    amount:   parseFloat(amountInput.value),
    category: catInput.value,
    date:     dateInput.value,
  };

  const id     = expenseId.value;
  const url    = id ? `${API}/${id}` : API;
  const method = id ? 'PUT' : 'POST';

  try {
    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      showError((data.errors || [data.error]).join(' • '));
      return;
    }

    resetForm();
    loadExpenses();
  } catch {
    showError('Erreur réseau.');
  }
});

// ── Edit ─────────────────────────────────────────────────────────────────────
function startEdit(expense) {
  formTitle.textContent   = 'Modifier la dépense';
  submitBtn.textContent   = 'Enregistrer';
  expenseId.value         = expense.id;
  labelInput.value        = expense.label;
  amountInput.value       = parseFloat(expense.amount).toFixed(2);
  dateInput.value         = expense.date.split('T')[0];
  catInput.value          = expense.category;
  cancelBtn.classList.remove('hidden');
  clearError();
  document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
}

cancelBtn.addEventListener('click', resetForm);

function resetForm() {
  form.reset();
  expenseId.value       = '';
  formTitle.textContent = 'Ajouter une dépense';
  submitBtn.textContent = 'Ajouter';
  cancelBtn.classList.add('hidden');
  clearError();
}

// ── Delete ───────────────────────────────────────────────────────────────────
async function deleteExpense(id) {
  if (!confirm('Supprimer cette dépense ?')) return;
  try {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    loadExpenses();
  } catch {
    alert('Erreur lors de la suppression.');
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
dateInput.value = new Date().toISOString().split('T')[0];
loadExpenses();
