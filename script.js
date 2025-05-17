document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let expenseChart = null;

    // DOM elements
    const expenseForm = document.getElementById('expense-form');
    const expensesList = document.getElementById('expenses-list');
    const totalAmountElement = document.getElementById('total-amount');
    const resetBtn = document.getElementById('reset-btn');
    const exportBtn = document.getElementById('export-btn');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const calendarTitle = document.getElementById('calendar-title');
    const calendarGrid = document.getElementById('calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const expenseChartCanvas = document.getElementById('expense-chart');

    // Initialize the app
    renderExpenses();
    updateTotal();
    generateCalendar(currentMonth, currentYear);
    renderChart();

    // Event listeners
    expenseForm.addEventListener('submit', addExpense);
    resetBtn.addEventListener('click', resetExpenses);
    exportBtn.addEventListener('click', exportToCSV);
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar(currentMonth, currentYear);
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar(currentMonth, currentYear);
    });

    // Functions
    function addExpense(e) {
        e.preventDefault();
        
        const date = document.getElementById('date').value;
        const category = document.getElementById('category').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const notes = document.getElementById('notes').value;
        
        if (!date || !category || isNaN(amount)) {
            alert('Please fill in all required fields with valid data');
            return;
        }
        
        const expense = {
            id: Date.now(),
            date,
            category,
            amount,
            notes
        };
        
        expenses.push(expense);
        saveExpenses();
        renderExpenses();
        updateTotal();
        generateCalendar(currentMonth, currentYear);
        renderChart();
        
        expenseForm.reset();
    }
    
    function renderExpenses() {
        if (expenses.length === 0) {
            expensesList.innerHTML = '<tr><td colspan="5" style="text-align: center;">No expenses added yet</td></tr>';
            return;
        }
        
        // Sort expenses by date (newest first)
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        expensesList.innerHTML = '';
        
        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(expense.date)}</td>
                <td>${expense.category}</td>
                <td>$${expense.amount.toFixed(2)}</td>
                <td>${expense.notes || '-'}</td>
                <td><button class="delete-btn" data-id="${expense.id}"><i class="fas fa-trash-alt"></i></button></td>
            `;
            expensesList.appendChild(row);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteExpense);
        });
    }
    
    function deleteExpense(e) {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        expenses = expenses.filter(expense => expense.id !== id);
        saveExpenses();
        renderExpenses();
        updateTotal();
        generateCalendar(currentMonth, currentYear);
        renderChart();
    }
    
    function resetExpenses() {
        if (confirm('Are you sure you want to delete all expenses?')) {
            expenses = [];
            saveExpenses();
            renderExpenses();
            updateTotal();
            generateCalendar(currentMonth, currentYear);
            renderChart();
        }
    }
    
    function updateTotal() {
        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        totalAmountElement.textContent = `$${total.toFixed(2)}`;
    }
    
    function saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }
    
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    function exportToCSV() {
        if (expenses.length === 0) {
            alert('No expenses to export');
            return;
        }
        
        let csv = 'Date,Category,Amount,Notes\n';
        
        expenses.forEach(expense => {
            csv += `"${formatDate(expense.date)}","${expense.category}","${expense.amount.toFixed(2)}","${expense.notes || ''}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `expenses_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    function switchTab(tabId) {
        tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        tabContents.forEach(content => {
            if (content.id === tabId) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
        
        // If switching to analytics tab, re-render the chart to ensure proper sizing
        if (tabId === 'analytics') {
            setTimeout(() => {
                renderChart();
            }, 100);
        }
    }
    
    function generateCalendar(month, year) {
        // Set calendar title
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        calendarTitle.textContent = `${monthNames[month]} ${year}`;
        
        // Get first day of month and total days in month
        const firstDay = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Get day of week for first day (0 = Sunday, 6 = Saturday)
        const startingDay = firstDay.getDay();
        
        // Clear previous calendar
        calendarGrid.innerHTML = '';
        
        // Add day headers
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayExpenses = expenses.filter(exp => exp.date === dateStr);
            const total = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            if (day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                dayElement.classList.add('active');
            }
            
            dayElement.innerHTML = `
                <div class="day-number">${day}</div>
                ${total > 0 ? `<div class="day-expense">$${total.toFixed(2)}</div>` : ''}
            `;
            
            // Add click event to view day's expenses
            dayElement.addEventListener('click', () => {
                viewDayExpenses(dateStr);
            });
            
            calendarGrid.appendChild(dayElement);
        }
    }
    
    function viewDayExpenses(dateStr) {
        const dayExpenses = expenses.filter(exp => exp.date === dateStr);
        
        if (dayExpenses.length === 0) {
            alert(`No expenses recorded for ${formatDate(dateStr)}`);
            return;
        }
        
        let message = `Expenses for ${formatDate(dateStr)}:\n\n`;
        dayExpenses.forEach(exp => {
            message += `${exp.category}: $${exp.amount.toFixed(2)}`;
            if (exp.notes) message += ` (${exp.notes})`;
            message += '\n';
        });
        
        const total = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        message += `\nTotal: $${total.toFixed(2)}`;
        
        alert(message);
    }
    
    function renderChart() {
        // Group expenses by category
        const categories = {};
        expenses.forEach(expense => {
            if (!categories[expense.category]) {
                categories[expense.category] = 0;
            }
            categories[expense.category] += expense.amount;
        });
        
        const categoryLabels = Object.keys(categories);
        const categoryData = Object.values(categories);
        
        // Get or create chart context
        const ctx = expenseChartCanvas.getContext('2d');
        
        // Destroy previous chart if it exists
        if (expenseChart) {
            expenseChart.destroy();
        }
        
        // Create new chart
        expenseChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categoryLabels,
                datasets: [{
                    data: categoryData,
                    backgroundColor: [
                        '#4a6fa5',
                        '#6b8cae',
                        '#ff7e5f',
                        '#59a5d8',
                        '#386fa4',
                        '#133c55'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();
});