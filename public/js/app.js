const API = '/api/expenses';
const STATS_API = '/api/expenses/stats';

const form        = document.getElementById('expense-form');
const formTitle   = document.getElementById('form-title');
const expenseId   = document.getElementById('expense-id');
const descriptionInput  = document.getElementById('description');
const amountInput = document.getElementById('amount');
const dateInput   = document.getElementById('date');
const catInput    = document.getElementById('category');
const submitBtn   = document.getElementById('submit-btn');
const cancelBtn   = document.getElementById('cancel-btn');
const formError   = document.getElementById('form-error');

const loadingEl   = document.getElementById('loading');
const emptyEl     = document.getElementById('empty');
const tableEl     = document.getElementById('expenses-table');
const tbody       = document.getElementById('expenses-body');
const totalBadge  = document.getElementById('total-badge');
const chartWrap   = document.getElementById('chart-wrap');
const totalsEmpty = document.getElementById('totals-empty');
const chartLegend = document.getElementById('chart-legend');
const chartCanvas = document.getElementById('stats-chart');
let   pieChart    = null;

// Modal elements
const modalOverlay = document.getElementById('modal-overlay');
const modalBody    = document.getElementById('modal-body');
const modalConfirm = document.getElementById('modal-confirm');
const modalCancel  = document.getElementById('modal-cancel');
const modalClose   = document.getElementById('modal-close');

let pendingDeleteId = null;

// ── State ──────────────────────────────────────────────────────────────────
let allExpenses  = [];
let activeFilter = '';

// ── Helpers ────────────────────────────────────────────────────────────────
const CATEGORY_LABELS = {
  alimentaire: '🍎 Alimentaire',
  transport:   '🚗 Transport',
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
      // fetch server-side stats
      const statsRes = await fetch(STATS_API).catch(() => null);
      const stats = statsRes && statsRes.ok ? await statsRes.json() : null;
      loadingEl.classList.add('hidden');
      if (stats) renderTotalsFromStats(stats); else renderTotals(allExpenses);
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

// ── Palette couleurs camembert ─────────────────────────────────────────────
const CHART_COLORS = {
  alimentaire: '#4CAF50',
  transport:   '#2196F3',
  loisirs:     '#FF9800',
  autre:       '#9C27B0',
};

// ── Rendu camembert ────────────────────────────────────────────────────────
function renderPieChart(rows) {
  // rows : [{category, total}] ou [{category, amount}]
  if (!Array.isArray(rows) || !rows.length) {
    chartWrap.classList.add('hidden');
    totalsEmpty.classList.remove('hidden');
    return;
  }
  chartWrap.classList.remove('hidden');
  totalsEmpty.classList.add('hidden');

  const labels  = rows.map(r => CATEGORY_LABELS[r.category] || r.category);
  const values  = rows.map(r => parseFloat(r.total ?? r.amount ?? 0));
  const colors  = rows.map(r => CHART_COLORS[r.category] || '#607D8B');
  const total   = values.reduce((a, v) => a + v, 0);

  if (pieChart) pieChart.destroy();
  pieChart = new Chart(chartCanvas, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
    options: {
      cutout: '55%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.formattedValue} € (${((ctx.parsed / total) * 100).toFixed(1)} %)`,
          },
        },
      },
    },
  });

  // Légende manuelle
  chartLegend.innerHTML = rows.map((r, i) => `
    <li>
      <span class="legend-dot" style="background:${colors[i]}"></span>
      <span class="legend-cat">${labels[i]}</span>
      <span class="legend-val">${values[i].toFixed(2)} €</span>
    </li>`).join('');
}

function renderTotals(expenses) {
  const map = {};
  expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + parseFloat(e.amount); });
  const rows = Object.entries(map).map(([category, total]) => ({ category, total }));
  renderPieChart(rows.sort((a, b) => b.total - a.total));
}

function renderTotalsFromStats(stats) {
  renderPieChart([...stats].sort((a, b) => parseFloat(b.total) - parseFloat(a.total)));
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
      <td>${e.description}</td>
      <td><span class="badge">${CATEGORY_LABELS[e.category] || e.category}</span></td>
      <td class="amount-cell">${parseFloat(e.amount).toFixed(2)} €</td>
      <td>
        <button class="btn-edit" id="edit-${e.id}">✏️ Modifier</button>
        <button class="btn-delete" id="del-${e.id}">🗑️ Supprimer</button>
      </td>`;
    tbody.appendChild(tr);
    // attach edit listener
    const editBtn = document.getElementById(`edit-${e.id}`);
    if (editBtn) editBtn.addEventListener('click', () => startEdit(e));
    // attach delete listener to open modal
    const delBtn = document.getElementById(`del-${e.id}`);
    if (delBtn) delBtn.addEventListener('click', () => promptDelete(e.id, e.description, parseFloat(e.amount).toFixed(2)));
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
    description: descriptionInput.value.trim(),
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
      const msg = Array.isArray(data.errors) ? data.errors.join(' • ') : (data.error || 'Erreur serveur');
      showError(msg);
      console.error('Validation error:', data);
      return;
    }

    resetForm();
    loadExpenses();
  } catch (err) {
    console.error('Submit error:', err);
    showError('Erreur réseau : ' + err.message);
  }
});

// ── Edit ─────────────────────────────────────────────────────────────────────
function startEdit(expense) {
  formTitle.textContent   = 'Modifier la dépense';
  submitBtn.textContent   = 'Enregistrer';
  expenseId.value         = expense.id;
  descriptionInput.value  = expense.description;
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

// ── Delete (API call) ───────────────────────────────────────────────────────
async function deleteExpense(id) {
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Suppression échouée');
    await loadExpenses();
  } catch (err) {
    alert('Erreur lors de la suppression.');
    console.error(err);
  }
}

// ── Modal handling ─────────────────────────────────────────────────────────
function promptDelete(id, label, amount) {
  pendingDeleteId = id;
  modalBody.innerHTML = `Supprimer <strong>${escapeHtml(label)}</strong> — <strong>${parseFloat(amount).toFixed(2)} €</strong> ?`;
  modalOverlay.classList.remove('hidden');
  // focus confirm button for accessibility
  setTimeout(() => modalConfirm.focus(), 50);
}

function hideModal() {
  pendingDeleteId = null;
  modalOverlay.classList.add('hidden');
}

modalCancel.addEventListener('click', hideModal);
modalClose.addEventListener('click', hideModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) hideModal(); });
modalConfirm.addEventListener('click', async () => {
  if (!pendingDeleteId) return hideModal();
  modalConfirm.disabled = true;
  await deleteExpense(pendingDeleteId);
  modalConfirm.disabled = false;
  hideModal();
});

function escapeHtml(s) {
  return (s + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// expose for debugging if needed
window.promptDelete = promptDelete;

// ── Init ─────────────────────────────────────────────────────────────────────
dateInput.value = new Date().toISOString().split('T')[0];
loadExpenses();
