const form = document.getElementById('transaction-form');
const typeSelect = document.getElementById('type');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const categoryGroup = document.getElementById('category-group');

const balanceEl = document.getElementById('total-balance');
const incomeEl = document.getElementById('total-income');
const expenseEl = document.getElementById('total-expense');
const listEl = document.getElementById('transaction-list');
const clearAllBtn = document.getElementById('clear-all');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let expenseChart = null;

// Hide expense category dropdown when "Income" is selected
typeSelect.addEventListener('change', () => {
    if (typeSelect.value === 'income') {
        categoryGroup.style.display = 'none';
    } else {
        categoryGroup.style.display = 'block';
    }
});

// Save transactions to LocalStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Add new transaction
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const type = typeSelect.value;
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = type === 'expense' ? categorySelect.value : 'Income';

    if (!description || isNaN(amount) || amount <= 0) return;

    const newTransaction = {
        id: Date.now(),
        type,
        description,
        amount,
        category,
        date: new Date().toLocaleDateString('en-GB')
    };

    transactions.unshift(newTransaction);
    saveTransactions();
    updateUI();

    form.reset();
    categoryGroup.style.display = 'block';
});

// Delete a single transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateUI();
}

// Clear all transactions
clearAllBtn.addEventListener('click', () => {
    if (transactions.length === 0) return;
    if (confirm('Are you sure you want to delete all transactions?')) {
        transactions = [];
        saveTransactions();
        updateUI();
    }
});

// Update Balance, Total Income & Total Expenses
function updateSummary() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    const balance = income - expense;

    balanceEl.textContent = `€${balance.toFixed(2)}`;
    incomeEl.textContent = `+€${income.toFixed(2)}`;
    expenseEl.textContent = `-€${expense.toFixed(2)}`;
}

// Render Transaction History List
function renderList() {
    listEl.innerHTML = '';

    if (transactions.length === 0) {
        listEl.innerHTML = '<li style="color: #64748b; text-align: center; padding: 1rem;">No transactions recorded yet.</li>';
        return;
    }

    transactions.forEach(t => {
        const li = document.createElement('li');
        li.className = 'transaction-item';

        const sign = t.type === 'income' ? '+' : '-';

        li.innerHTML = `
            <div class="item-info">
                <span class="item-desc">${t.description}</span>
                <span class="item-meta">${t.category} • ${t.date}</span>
            </div>
            <div class="item-right">
                <span class="item-amount ${t.type}">${sign}€${t.amount.toFixed(2)}</span>
                <button class="btn-delete" onclick="deleteTransaction(${t.id})" title="Delete">×</button>
            </div>
        `;
        listEl.appendChild(li);
    });
}

// Update Doughnut Chart (Chart.js)
function updateChart() {
    const chartCanvas = document.getElementById('expense-chart');
    if (!chartCanvas || typeof Chart === 'undefined') return;

    const ctx = chartCanvas.getContext('2d');
    const expenses = transactions.filter(t => t.type === 'expense');

    const categoryTotals = {};
    expenses.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);

    if (expenseChart) {
        expenseChart.destroy();
    }

    if (labels.length === 0) {
        expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No Expenses'],
                datasets: [{
                    data: Array(1).fill(1),
                    backgroundColor: ['#e2e8f0']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: { enabled: false },
                    legend: { display: false }
                }
            }
        });
        return;
    }

    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateUI() {
    updateSummary();
    renderList();
    updateChart();
}

// Initialize app
updateUI();
