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

let transactions = JSON.parse(localStorage.getItem('transactions')) || new Array();

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
        transactions = new Array();
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

// Draw Native HTML5 Canvas Doughnut Chart (No external library needed)
function updateChart() {
    const canvas = document.getElementById('expense-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 360;
    canvas.height = 260;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals = {};
    let totalExpense = 0;

    expenses.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        totalExpense += t.amount;
    });

    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);
    const centerX = 110;
    const centerY = 130;
    const radius = 85;
    const holeRadius = 48;

    // Empty state grey ring
    if (labels.length === 0 || totalExpense === 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#e2e8f0';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, centerY, holeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.fillStyle = '#64748b';
        ctx.font = '13px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No Expenses Yet', centerX, centerY + 5);
        return;
    }

    const colors = Array.of('#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6');
    let startAngle = -Math.PI / 2;

    // Draw slices
    values.forEach((val, index) => {
        const sliceAngle = (val / totalExpense) * Math.PI * 2;
        const color = colors.at(index % colors.length);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        startAngle += sliceAngle;
    });

    // Cut inner hole for doughnut effect
    ctx.beginPath();
    ctx.arc(centerX, centerY, holeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Center total text
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`€${totalExpense.toFixed(0)}`, centerX, centerY + 5);

    // Draw legend on the right
    labels.forEach((label, index) => {
        const color = colors.at(index % colors.length);
        const percentage = ((values.at(index) / totalExpense) * 100).toFixed(0);
        const yPos = 45 + index * 32;

        ctx.fillStyle = color;
        ctx.fillRect(225, yPos - 10, 12, 12);

        ctx.fillStyle = '#1e293b';
        ctx.font = '13px Segoe UI, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${label} (${percentage}%)`, 245, yPos);
    });
}

function updateUI() {
    updateSummary();
    renderList();
    updateChart();
}

// Initialize app
updateUI();
