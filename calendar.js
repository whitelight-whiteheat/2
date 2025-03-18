class Calendar {
    constructor() {
        // Get date from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get('date');
        
        // Set initial date based on URL parameter or current date
        this.currentDate = dateParam ? new Date(dateParam) : new Date();
        this.selectedDate = this.currentDate;
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        
        // DOM Elements
        this.calendarDays = document.getElementById('calendarDays');
        this.currentMonthElement = document.getElementById('currentMonth');
        this.selectedDateElement = document.getElementById('selectedDate');
        this.selectedDateTasks = document.querySelector('.selected-date-tasks');
        
        // Event Listeners
        document.getElementById('prevMonth').addEventListener('click', () => this.previousMonth());
        document.getElementById('nextMonth').addEventListener('click', () => this.nextMonth());
        
        // Initialize calendar
        this.renderCalendar();
        
        // If we have a date parameter, select that date
        if (dateParam) {
            this.selectDate(this.currentDate);
        }
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month display
        this.currentMonthElement.textContent = `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`;
        
        // Get first day of month and total days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();
        
        // Clear previous calendar
        this.calendarDays.innerHTML = '';
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay.getDay(); i++) {
            this.calendarDays.appendChild(this.createDayElement(''));
        }
        
        // Add days of the month
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const dayElement = this.createDayElement(day, date);
            this.calendarDays.appendChild(dayElement);
        }
    }

    createDayElement(day, date = null) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (!day) {
            dayElement.classList.add('empty');
            return dayElement;
        }
        
        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Add tasks for this day
        const dayTasks = document.createElement('div');
        dayTasks.className = 'day-tasks';
        
        if (date) {
            const tasksForDay = this.getTasksForDate(date);
            tasksForDay.slice(0, 3).forEach(task => {
                const taskPreview = document.createElement('div');
                taskPreview.className = 'task-preview';
                taskPreview.innerHTML = `
                    <span class="task-dot"></span>
                    <span class="task-title">${task.title}</span>
                `;
                dayTasks.appendChild(taskPreview);
            });
            
            if (tasksForDay.length > 3) {
                const moreTasks = document.createElement('div');
                moreTasks.className = 'more-tasks';
                moreTasks.textContent = `+${tasksForDay.length - 3} more`;
                dayTasks.appendChild(moreTasks);
            }
            
            // Add click handler for the day
            dayElement.addEventListener('click', () => this.selectDate(date));
        }
        
        dayElement.appendChild(dayTasks);
        return dayElement;
    }

    getTasksForDate(date) {
        return this.tasks.filter(task => {
            const taskDate = new Date(task.dueDate);
            return taskDate.toDateString() === date.toDateString();
        });
    }

    selectDate(date) {
        // First, remove selected class from all days
        const allDays = this.calendarDays.querySelectorAll('.calendar-day');
        allDays.forEach(day => {
            day.classList.remove('selected');
        });

        // Then update the selected date
        this.selectedDate = date;
        this.selectedDateElement.textContent = date.toLocaleDateString('default', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Update tasks list
        const tasksForDate = this.getTasksForDate(date);
        this.selectedDateTasks.innerHTML = '';
        
        if (tasksForDate.length === 0) {
            this.selectedDateTasks.innerHTML = '<div class="empty-state">No tasks for this date</div>';
            return;
        }
        
        tasksForDate.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item';
            taskElement.innerHTML = `
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    <div class="task-tags">
                        ${task.tags.map(tag => `<span class="tag" data-color="${tag.color}">${tag.name}</span>`).join('')}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="edit-task-btn" title="Edit Task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-task-btn" title="Delete Task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            // Add event listeners for edit and delete buttons
            const editBtn = taskElement.querySelector('.edit-task-btn');
            const deleteBtn = taskElement.querySelector('.delete-task-btn');

            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                localStorage.setItem('editingTask', JSON.stringify(task));
                window.location.href = 'index.html';
            });

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this task?')) {
                    this.tasks = this.tasks.filter(t => t.id !== task.id);
                    localStorage.setItem('tasks', JSON.stringify(this.tasks));
                    this.renderCalendar();
                    this.selectDate(this.selectedDate);
                }
            });

            this.selectedDateTasks.appendChild(taskElement);
        });

        // Finally, add selected class to the clicked day
        const dayElements = this.calendarDays.querySelectorAll('.calendar-day');
        dayElements.forEach(day => {
            const dayNumber = day.querySelector('.day-number');
            if (dayNumber && parseInt(dayNumber.textContent) === date.getDate()) {
                day.classList.add('selected');
            }
        });
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }
}

// Initialize calendar when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Calendar();
}); 