// ============================================
// PREMIUM EXPENSE TRACKER - MAIN APPLICATION
// ============================================
// This is the brain of our application - handles all the logic,
// API calls, and real-time updates with a cinematic feel
// ============================================

// API Configuration - Pointing to our Python Flask backend
const API_BASE_URL = 'http://localhost:5000/api';

// ============================================
// GLOBAL STATE MANAGEMENT
// ============================================
let expenses = [];              // All expenses will be stored here
let currentFilter = 'all';       // Track which category filter is active
let expenseChart = null;         // Will hold our Chart.js instance

// DOM Elements - Get references to all the important HTML elements
const elements = {
    // Form elements
    form: document.getElementById('expenseForm'),
    titleInput: document.getElementById('title'),
    amountInput: document.getElementById('amount'),
    dateInput: document.getElementById('date'),
    categorySelect: document.getElementById('category'),
    submitBtn: document.getElementById('submitBtn'),
    
    // Summary cards
    totalBalance: document.getElementById('totalBalance'),
    totalExpenses: document.getElementById('totalExpenses'),
    totalIncome: document.getElementById('totalIncome'),
    
    // Lists and containers
    expensesList: document.getElementById('expensesList'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    
    // Filter buttons
    filterButtons: document.querySelectorAll('.filter-btn'),
    
    // Stats container
    quickStats: document.getElementById('quickStats'),
    
    // Toast container
    toastContainer: document.getElementById('toastContainer')
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Format date to readable format
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span class="toast-message">${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// Animate number changes
function animateNumber(element, value, prefix = '') {
    const currentValue = parseFloat(element.textContent.replace(prefix, '') || 0);
    const steps = 20;
    const increment = (value - currentValue) / steps;
    let step = 0;
    
    const animation = setInterval(() => {
        step++;
        const newValue = currentValue + (increment * step);
        element.textContent = prefix + newValue.toFixed(2);
        
        if (step >= steps) {
            element.textContent = prefix + value.toFixed(2);
            clearInterval(animation);
        }
    }, 15);
}

// ============================================
// SETUP FUNCTIONS
// ============================================

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    if (elements.dateInput) {
        elements.dateInput.value = today;
    }
}

function setupAutoCategorization() {
    if (!elements.titleInput || !elements.categorySelect) return;
    
    const keywords = {
        'netflix': 'Subscriptions',
        'spotify': 'Subscriptions',
        'hulu': 'Subscriptions',
        'disney': 'Subscriptions',
        'prime': 'Subscriptions',
        'uber': 'Transport',
        'lyft': 'Transport',
        'taxi': 'Transport',
        'bus': 'Transport',
        'train': 'Transport',
        'lunch': 'Food',
        'dinner': 'Food',
        'breakfast': 'Food',
        'coffee': 'Food',
        'starbucks': 'Food',
        'restaurant': 'Food',
        'pizza': 'Food',
        'burger': 'Food',
        'macbook': 'Tech',
        'laptop': 'Tech',
        'phone': 'Tech',
        'headphones': 'Tech',
        'charger': 'Tech',
        'amazon': 'Shopping',
        'mall': 'Shopping',
        'clothes': 'Shopping'
    };
    
    elements.titleInput.addEventListener('input', (e) => {
        const typedText = e.target.value.toLowerCase().trim();
        
        for (let [keyword, category] of Object.entries(keywords)) {
            if (typedText.includes(keyword)) {
                elements.categorySelect.value = category;
                elements.categorySelect.style.borderColor = 'var(--neon-green)';
                setTimeout(() => {
                    if (elements.categorySelect) {
                        elements.categorySelect.style.borderColor = '';
                    }
                }, 500);
                break;
            }
        }
    });
}

// ============================================
// API CALLS - TALKING TO PYTHON BACKEND
// ============================================

async function fetchExpenses() {
    console.log('📡 Fetching expenses from backend...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/expenses`);
        const result = await response.json();
        
        if (result.success) {
            expenses = result.data;
            
            if (elements.loadingIndicator) {
                elements.loadingIndicator.style.display = 'none';
            }
            
            console.log(`✅ Successfully loaded ${expenses.length} expenses`);
            
            // Update everything on the UI
            updateDashboard();
            renderExpenses();
            updateChart();
            updateQuickStats();
            
            showToast(`Loaded ${expenses.length} transactions`, 'success');
        } else {
            throw new Error(result.error || 'Failed to fetch expenses');
        }
    } catch (error) {
        console.error('❌ Error fetching expenses:', error);
        if (elements.loadingIndicator) {
            elements.loadingIndicator.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle" style="color: #ff2b8f; font-size: 2rem;"></i>
                    <p>Failed to load expenses. Make sure your Python backend is running!</p>
                    <button onclick="fetchExpenses()" class="btn-primary" style="margin-top: 1rem; padding: 0.8rem 1.5rem;">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        }
        showToast('Failed to connect to server', 'error');
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const newExpense = {
        title: elements.titleInput ? elements.titleInput.value.trim() : '',
        amount: elements.amountInput ? parseFloat(elements.amountInput.value) : 0,
        date: elements.dateInput ? elements.dateInput.value : '',
        category: elements.categorySelect ? elements.categorySelect.value : 'Other'
    };
    
    if (!newExpense.title || !newExpense.amount || !newExpense.date) {
        showToast('Please fill in all fields!', 'error');
        return;
    }
    
    if (newExpense.amount <= 0) {
        showToast('Amount must be greater than 0', 'error');
        return;
    }
    
    // Show loading state
    if (elements.submitBtn) {
        const originalBtnText = elements.submitBtn.innerHTML;
        elements.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        elements.submitBtn.disabled = true;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/expenses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newExpense)
        });
        
        const result = await response.json();
        
        if (result.success) {
            expenses.push(result.data);
            
            updateDashboard();
            renderExpenses();
            updateChart();
            updateQuickStats();
            
            // Reset form
            if (elements.form) elements.form.reset();
            setDefaultDate();
            
            if (elements.titleInput) elements.titleInput.focus();
            
            showToast('✨ Expense added successfully!', 'success');
        } else {
            throw new Error(result.error || 'Failed to add expense');
        }
    } catch (error) {
        console.error('❌ Error adding expense:', error);
        showToast('Failed to add expense', 'error');
    } finally {
        // Restore button state
        if (elements.submitBtn) {
            elements.submitBtn.innerHTML = '<i class="fas fa-magic"></i> Add Expense';
            elements.submitBtn.disabled = false;
        }
    }
}

// Make delete function globally available
window.deleteExpense = async function(id) {
    console.log('🗑️ Deleting expense:', id);
    
    try {
        const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            expenses = expenses.filter(exp => exp.id !== id);
            
            updateDashboard();
            renderExpenses();
            updateChart();
            updateQuickStats();
            
            showToast('Expense deleted', 'success');
        } else {
            throw new Error(result.error || 'Failed to delete expense');
        }
    } catch (error) {
        console.error('❌ Error deleting expense:', error);
        showToast('Failed to delete expense', 'error');
    }
};

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

function updateDashboard() {
    if (!expenses.length) {
        if (elements.totalExpenses) elements.totalExpenses.textContent = '$0.00';
        if (elements.totalBalance) elements.totalBalance.textContent = '$3,200.00';
        return;
    }
    
    const totalExpensesAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthlyIncome = 3200;
    const balance = monthlyIncome - totalExpensesAmount;
    
    if (elements.totalExpenses) {
        animateNumber(elements.totalExpenses, totalExpensesAmount, '$');
    }
    if (elements.totalBalance) {
        animateNumber(elements.totalBalance, balance, '$');
    }
    if (elements.totalIncome) {
        elements.totalIncome.textContent = `$${monthlyIncome.toFixed(2)}`;
    }
}

function renderExpenses() {
    if (!elements.expensesList) return;
    
    const filteredExpenses = currentFilter === 'all' 
        ? expenses 
        : expenses.filter(exp => exp.category === currentFilter);
    
    if (filteredExpenses.length === 0) {
        elements.expensesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt" style="font-size: 3rem; color: #718096;"></i>
                <p style="color: #718096; margin-top: 1rem;">No expenses found</p>
            </div>
        `;
        return;
    }
    
    const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    elements.expensesList.innerHTML = sortedExpenses.map(expense => `
        <div class="expense-item" data-id="${expense.id}">
            <div class="expense-info">
                <div class="expense-title">
                    ${expense.title}
                    <span class="expense-category">${expense.category}</span>
                </div>
                <div class="expense-meta">
                    <span><i class="far fa-calendar"></i> ${formatDate(expense.date)}</span>
                </div>
            </div>
            <div class="expense-amount">
                $${expense.amount.toFixed(2)}
            </div>
            <button class="delete-btn" onclick="deleteExpense(${expense.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function handleFilterClick(e) {
    const category = e.target.dataset.category;
    
    elements.filterButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    currentFilter = category;
    renderExpenses();
}

function updateChart() {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;
    
    if (expenses.length === 0) {
        if (expenseChart) {
            expenseChart.destroy();
            expenseChart = null;
        }
        return;
    }
    
    const categoryTotals = {};
    expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    
    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    
    const colors = [
        '#00f0ff', '#00ff9d', '#ff2b8f', 
        '#b300ff', '#ffaa00', '#ff6b6b'
    ];
    
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: colors.slice(0, categories.length),
                borderColor: 'transparent',
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(20, 25, 35, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#a0aec0',
                    borderColor: '#00f0ff',
                    borderWidth: 1
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 2000
            }
        }
    });
    
    // Update legend
    const legendHtml = categories.map((cat, index) => {
        const total = amounts.reduce((a, b) => a + b, 0);
        const percentage = ((amounts[index] / total) * 100).toFixed(1);
        return `
            <div class="legend-item">
                <span class="legend-color" style="background: ${colors[index % colors.length]};"></span>
                <span>${cat}: $${amounts[index].toFixed(2)} (${percentage}%)</span>
            </div>
        `;
    }).join('');
    
    const chartLegend = document.getElementById('chartLegend');
    if (chartLegend) {
        chartLegend.innerHTML = legendHtml;
    }
}

function updateQuickStats() {
    if (!elements.quickStats) return;
    
    if (expenses.length === 0) {
        elements.quickStats.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Total Transactions</span>
                <span class="stat-value">0</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Average Expense</span>
                <span class="stat-value">$0.00</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Top Category</span>
                <span class="stat-value">None</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Highest</span>
                <span class="stat-value">$0.00</span>
            </div>
        `;
        return;
    }
    
    const highestExpense = expenses.reduce((max, exp) => exp.amount > max.amount ? exp : max, expenses[0]);
    
    const categoryCount = {};
    expenses.forEach(exp => {
        categoryCount[exp.category] = (categoryCount[exp.category] || 0) + 1;
    });
    
    let mostCommonCategory = 'None';
    let maxCount = 0;
    
    for (let [cat, count] of Object.entries(categoryCount)) {
        if (count > maxCount) {
            maxCount = count;
            mostCommonCategory = cat;
        }
    }
    
    const avgExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length;
    
    elements.quickStats.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Total Transactions</span>
            <span class="stat-value">${expenses.length}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Average Expense</span>
            <span class="stat-value">$${avgExpense.toFixed(2)}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Top Category</span>
            <span class="stat-value">${mostCommonCategory}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Highest</span>
            <span class="stat-value">$${highestExpense.amount.toFixed(2)}</span>
        </div>
    `;
}

// ============================================
// INITIALIZATION - APP STARTS HERE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Premium Expense Tracker initializing...');
    
    // Set up all event listeners
    if (elements.form) {
        elements.form.addEventListener('submit', handleFormSubmit);
    }
    
    elements.filterButtons.forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
    
    // Auto-focus on title input
    setTimeout(() => {
        if (elements.titleInput) {
            elements.titleInput.focus();
        }
    }, 500);
    
    // Set default date
    setDefaultDate();
    
    // Setup auto-categorization
    setupAutoCategorization();
    
    // Load initial data
    fetchExpenses();
});