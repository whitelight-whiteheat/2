// Simple Task Manager with localStorage
class TaskManager {
    constructor() {
        this.tasks = [];
        this.loadTasks();
        
        // Bind methods to this instance
        this.handleTagClick = this.handleTagClick.bind(this);
        
        this.initializeEventListeners();
        
        // Determine which page we're on
        const isCompletedPage = window.location.pathname.includes('completed.html');
        const isTagFilterPage = window.location.pathname.includes('tagfilter.html');
        const isUpcomingPage = window.location.pathname.includes('upcoming.html');
        
        if (isCompletedPage) {
            this.displayCompletedTasks();
        } else if (isTagFilterPage) {
            this.displayTagFilterPage();
        } else if (isUpcomingPage) {
            this.displayUpcomingTasks();
        } else {
            this.displayTasks();
        }
        
        this.updateDateDisplay();
    }

    // Load tasks from localStorage
    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            try {
                this.tasks = JSON.parse(savedTasks);
                console.log('Loaded tasks:', this.tasks);
            } catch (e) {
                console.error('Error loading tasks:', e);
                this.tasks = [];
            }
        }
    }

    // Save tasks to localStorage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        console.log('Saved tasks:', this.tasks);
    }

    // Display tasks on the main page (non-completed tasks)
    displayTasks() {
        const tasksList = document.getElementById('today-tasks');
        if (!tasksList) return;

        // Filter for non-completed tasks
        const activeTasks = this.tasks.filter(task => !task.completed);

        if (activeTasks.length === 0) {
            tasksList.innerHTML = `
                <li class="empty-state">
                    <i class="fas fa-check"></i>
                    No tasks scheduled for today
                </li>
            `;
            return;
        }

        // Clear the list
        tasksList.innerHTML = '';

        // Add each task to the list
        activeTasks.forEach(task => {
            const taskElement = document.createElement('li');
            taskElement.className = 'task-item';
            taskElement.dataset.taskId = task.id;
            taskElement.draggable = true;
            
            taskElement.innerHTML = `
                <label class="checkbox-container">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    ${task.dueDate ? `
                        <div class="task-metadata">
                            <span class="task-date clickable" data-date="${task.dueDate}">
                                <i class="fas fa-calendar"></i> ${new Date(task.dueDate).toLocaleDateString()}
                            </span>
                        </div>
                    ` : ''}
                    ${task.tags && task.tags.length > 0 ? `
                        <div class="task-tags">
                            ${task.tags.map(tag => {
                                const colorNum = tag.charCodeAt(0) % 10;
                                return `<span class="tag" data-color="${colorNum}">${tag}</span>`;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
                <button class="edit-task" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-task" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            tasksList.appendChild(taskElement);
        });
        
        // Update task counts
        this.updateTaskCounts();
        
        // After adding tasks to the DOM
        this.makeTagsClickable();
        this.makeDatesClickable();
    }
    
    // Display completed tasks on the completed page
    displayCompletedTasks() {
        const completedTasksContainer = document.getElementById('completed-tasks');
        if (!completedTasksContainer) return;
        
        // Filter for completed tasks
        const completedTasks = this.tasks.filter(task => task.completed);
        
        if (completedTasks.length === 0) {
            completedTasksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No completed tasks yet</p>
                </div>
            `;
            return;
        }
        
        // Clear the container
        completedTasksContainer.innerHTML = '';
        
        // Add each completed task
        completedTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item completed';
            taskElement.dataset.taskId = task.id;
            
            taskElement.innerHTML = `
                <label class="checkbox-container">
                    <input type="checkbox" checked>
                    <span class="checkmark"></span>
                </label>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    ${task.dueDate ? `
                        <div class="task-metadata">
                            <span class="task-date">
                                <i class="fas fa-calendar"></i> ${new Date(task.dueDate).toLocaleDateString()}
                            </span>
                        </div>
                    ` : ''}
                    ${task.tags && task.tags.length > 0 ? `
                        <div class="task-tags">
                            ${task.tags.map(tag => {
                                // Get a color number based on the first character of the tag
                                const colorNum = tag.charCodeAt(0) % 10;
                                return `<span class="tag" data-color="${colorNum}">${tag}</span>`;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
                <button class="edit-task" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-task" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            completedTasksContainer.appendChild(taskElement);
        });
        
        // Make tags clickable
        this.makeTagsClickable();
    }

    // Display tasks filtered by tag
    displayTagFilterPage() {
        const taggedTasksContainer = document.getElementById('tagged-tasks');
        if (!taggedTasksContainer) return;
        
        // Get the selected tag from localStorage
        const selectedTag = localStorage.getItem('selectedTag');
        if (!selectedTag) {
            taggedTasksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tags"></i>
                    <p>No tag selected</p>
                </div>
            `;
            return;
        }
        
        // Filter tasks by the selected tag
        const tasksWithTag = this.tasks.filter(task => 
            task.tags && task.tags.includes(selectedTag) && !task.completed
        );
        
        // Display tasks with the selected tag
        taggedTasksContainer.innerHTML = `
            <h3><i class="fas fa-tag"></i> Tasks with tag: ${selectedTag}</h3>
            ${tasksWithTag.length === 0 ? `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <p>No active tasks with this tag</p>
                </div>
            ` : `
                <ul class="tasks-list">
                    ${tasksWithTag.map(task => `
                        <li class="task-item" data-task-id="${task.id}">
                            <label class="checkbox-container">
                                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                                <span class="checkmark"></span>
                            </label>
                            <div class="task-content">
                                <div class="task-title">${task.title}</div>
                                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                                <div class="task-metadata">
                                    ${task.dueDate ? `
                                        <span class="task-date">
                                            <i class="fas fa-calendar"></i> ${new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    ` : ''}
                                </div>
                                <div class="task-tags">
                                    ${task.tags.map(tag => {
                                        // Get a color number based on the first character of the tag
                                        const colorNum = tag.charCodeAt(0) % 10;
                                        return `<span class="tag" data-color="${colorNum}">${tag}</span>`;
                                    }).join('')}
                                </div>
                            </div>
                            <button class="edit-task" title="Edit task">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-task" title="Delete task">
                                <i class="fas fa-trash"></i>
                            </button>
                        </li>
                    `).join('')}
                </ul>
            `}
        `;
        
        // Make tags clickable
        this.makeTagsClickable();
    }

    // Display upcoming tasks
    displayUpcomingTasks() {
        const upcomingTasksContainer = document.getElementById('upcoming-tasks');
        if (!upcomingTasksContainer) return;

        // Get future tasks (not completed and due date is in the future)
        const futureTasks = this.getFutureTasks();
        
        if (futureTasks.length === 0) {
            upcomingTasksContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar"></i>
                    <p>No upcoming tasks</p>
                    </div>
                `;
                return;
            }

            // Group tasks by date
        const tasksByDate = {};
        futureTasks.forEach(task => {
            const date = new Date(task.dueDate);
            const dateStr = date.toISOString().split('T')[0];
            
            if (!tasksByDate[dateStr]) {
                tasksByDate[dateStr] = [];
            }
            
            tasksByDate[dateStr].push(task);
        });

        // Sort dates
        const sortedDates = Object.keys(tasksByDate).sort();

        // Create HTML
        upcomingTasksContainer.innerHTML = '';
        
        sortedDates.forEach(dateStr => {
            const date = new Date(dateStr);
            const formattedDate = date.toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            const dateSection = document.createElement('div');
            dateSection.className = 'date-section';
            dateSection.innerHTML = `
                <h3 class="date-heading">
                        <i class="fas fa-calendar-day"></i>
                    ${formattedDate}
                    </h3>
                    <ul class="tasks-list">
                    ${tasksByDate[dateStr].map(task => `
                            <li class="task-item" data-task-id="${task.id}">
                            <label class="checkbox-container">
                                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                                <span class="checkmark"></span>
                            </label>
                                <div class="task-content">
                                    <div class="task-title">${task.title}</div>
                                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                                ${task.tags && task.tags.length > 0 ? `
                                    <div class="task-tags">
                                        ${task.tags.map(tag => {
                                            // Get a color number based on the first character of the tag
                                            const colorNum = tag.charCodeAt(0) % 10;
                                            return `<span class="tag" data-color="${colorNum}">${tag}</span>`;
                                        }).join('')}
                                </div>
                                    ` : ''}
                                </div>
                            <button class="edit-task" title="Edit task">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-task" title="Delete task">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </li>
                        `).join('')}
                    </ul>
            `;
            
            upcomingTasksContainer.appendChild(dateSection);
        });
        
        // Make tags clickable
        this.makeTagsClickable();
    }

    // Helper method to get future tasks
    getFutureTasks() {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of day
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Set to tomorrow
        
        return this.tasks.filter(task => {
            if (!task.dueDate || task.completed) return false;
            
            const taskDate = new Date(task.dueDate);
            taskDate.setHours(0, 0, 0, 0);
            
            // Only include tasks with dates strictly after today
            return taskDate >= tomorrow;
        });
    }

    // Update task counts
    updateTaskCounts() {
        const completedCount = document.getElementById('completed-count');
        const remainingCount = document.getElementById('remaining-count');
        const progressFill = document.getElementById('tasks-progress-fill');
        
        if (!completedCount || !remainingCount) return;
        
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const activeTasks = this.tasks.filter(task => !task.completed).length;
        
        completedCount.textContent = completedTasks;
        remainingCount.textContent = activeTasks;
        
        if (progressFill) {
            const total = completedTasks + activeTasks;
            const progress = total > 0 ? (completedTasks / total) * 100 : 0;
            progressFill.style.width = `${progress}%`;
        }
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Quick add button
        const quickAddBtn = document.getElementById('quick-add-btn');
        const taskModal = document.getElementById('task-modal');

        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => {
                // Reset the form
                document.getElementById('task-form').reset();
                document.getElementById('task-id').value = '';
                document.getElementById('modal-title').innerHTML = '<i class="fas fa-plus"></i> Create New Task';
                document.getElementById('form-submit-btn').textContent = 'Create Task';
                
                // Show the modal
                document.getElementById('task-modal').style.display = 'block';
            });
        }

        // Close modal buttons
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                taskModal.style.display = 'none';
                const form = document.getElementById('task-form');
                if (form) form.reset();
            });
        });

        // Form submission
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const taskId = document.getElementById('task-id').value;
                const title = document.getElementById('task-title').value;
                const description = document.getElementById('task-description').value;
                const dueDate = document.getElementById('task-date').value;
                const tagsInput = document.getElementById('task-tags').value;
                const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
                
                if (taskId) {
                    // Update existing task
                    const index = this.tasks.findIndex(t => t.id === parseInt(taskId));
                    if (index !== -1) {
                        this.tasks[index].title = title;
                        this.tasks[index].description = description;
                        this.tasks[index].dueDate = dueDate;
                        this.tasks[index].tags = tags;
                        
                        this.saveTasks();
                        this.showNotification('Task updated successfully');
                    }
                } else {
                    // Create new task
                    const newTask = {
                        id: Date.now(),
                        title,
                        description,
                        dueDate,
                        tags,
                        completed: false
                    };
                    
                    this.tasks.push(newTask);
                    this.saveTasks();
                    this.showNotification('Task created successfully');
                }
                
                // Reset form and close modal
                taskForm.reset();
                document.getElementById('task-id').value = '';
                document.getElementById('modal-title').innerHTML = '<i class="fas fa-plus"></i> Create New Task';
                document.getElementById('form-submit-btn').textContent = 'Create Task';
                document.getElementById('task-modal').style.display = 'none';
                
                // Update the appropriate display
                if (window.location.pathname.includes('completed.html')) {
                    this.displayCompletedTasks();
                } else if (window.location.pathname.includes('tagfilter.html')) {
                    this.displayTagFilterPage();
                } else if (window.location.pathname.includes('upcoming.html')) {
                    this.displayUpcomingTasks();
                } else {
                    this.displayTasks();
                }
            });
        }

        // Delete task
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-task')) {
                const taskItem = e.target.closest('.task-item');
                const taskId = parseInt(taskItem.dataset.taskId);
                
                // Remove from array
                this.tasks = this.tasks.filter(task => task.id !== taskId);
                
                // Save to localStorage
                this.saveTasks();
                
                // Update display based on current page
                if (window.location.pathname.includes('completed.html')) {
                    this.displayCompletedTasks();
                } else if (window.location.pathname.includes('tagfilter.html')) {
                    this.displayTagFilterPage();
                } else if (window.location.pathname.includes('upcoming.html')) {
                    this.displayUpcomingTasks();
                } else {
                    this.displayTasks();
                }
            }
        });

        // Toggle task completion
        document.addEventListener('change', (e) => {
            if (e.target.closest('input[type="checkbox"]')) {
                const taskItem = e.target.closest('.task-item');
                const taskId = parseInt(taskItem.dataset.taskId);
                const task = this.tasks.find(t => t.id === taskId);
                
                if (task) {
                    const isCompleting = e.target.checked;
                    
                    if (isCompleting) {
                        // Mark as completed and record completion date
                        task.completed = true;
                        task.completedAt = new Date().toISOString();
                        
                        // Add completion animation
                        taskItem.classList.add('completing');
                        
                        // Play animation then update the display
                        setTimeout(() => {
                            this.saveTasks();
                            
                            // Update the appropriate display
                            if (window.location.pathname.includes('tagfilter.html')) {
                                this.displayTagFilterPage();
                            } else if (window.location.pathname.includes('upcoming.html')) {
                                this.displayUpcomingTasks();
                            } else {
                                this.displayTasks();
                            }
                            
                            // Show a notification that the task was completed
                            this.showNotification('Task completed and moved to Completed tab');
                        }, 800); // Animation duration
                    } else {
                        // If unchecking, remove completion status and date
                        task.completed = false;
                        delete task.completedAt;
                        
                        this.saveTasks();
                        
                        // Update the appropriate display
                        if (window.location.pathname.includes('completed.html')) {
                            this.displayCompletedTasks();
                        } else if (window.location.pathname.includes('tagfilter.html')) {
                            this.displayTagFilterPage();
                        } else if (window.location.pathname.includes('upcoming.html')) {
                            this.displayUpcomingTasks();
                        } else {
                            this.displayTasks();
                        }
                    }
                }
            }
        });

        // Sidebar toggle
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const appContainer = document.querySelector('.app-container');
        
        if (sidebarToggle && appContainer) {
            // Check localStorage for saved sidebar state
            const isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            if (isSidebarCollapsed) {
                appContainer.classList.add('sidebar-collapsed');
            }

            sidebarToggle.addEventListener('click', () => {
                appContainer.classList.toggle('sidebar-collapsed');
                // Save the new state to localStorage
                localStorage.setItem('sidebarCollapsed', appContainer.classList.contains('sidebar-collapsed'));
            });
        }

        // Calendar link
        const calendarLink = document.getElementById('calendar-link');
        const calendarModal = document.getElementById('calendar-modal');
        
        if (calendarLink && calendarModal) {
            calendarLink.addEventListener('click', (e) => {
                e.preventDefault();
                calendarModal.style.display = 'block';
                this.initializeCalendar();
            });
            
            // Close calendar modal
            const calendarCloseButtons = calendarModal.querySelectorAll('.close-modal');
            calendarCloseButtons.forEach(button => {
                button.addEventListener('click', () => {
                    calendarModal.style.display = 'none';
                });
            });
            
            // Close on outside click
            window.addEventListener('click', (e) => {
                if (e.target === calendarModal) {
                    calendarModal.style.display = 'none';
                }
            });
        }

        // Edit task
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-task')) {
                const taskItem = e.target.closest('.task-item');
                const taskId = parseInt(taskItem.dataset.taskId);
                const task = this.tasks.find(t => t.id === taskId);
                
                if (task) {
                    // Get the task modal
                    const taskModal = document.getElementById('task-modal');
                    
                    // Fill the form with task data
                    document.getElementById('task-id').value = task.id;
                    document.getElementById('task-title').value = task.title;
                    document.getElementById('task-description').value = task.description || '';
                    document.getElementById('task-date').value = task.dueDate || '';
                    document.getElementById('task-tags').value = task.tags ? task.tags.join(', ') : '';
                    
                    // Update modal title and button text to indicate editing
                    document.getElementById('modal-title').innerHTML = '<i class="fas fa-edit"></i> Edit Task';
                    document.getElementById('form-submit-btn').textContent = 'Update Task';
                    
                    // Show the modal
                    taskModal.style.display = 'block';
                }
            }
        });

        // Add drag and drop handlers
        document.addEventListener('dragstart', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                taskItem.classList.add('dragging');
                e.dataTransfer.setData('text/plain', taskItem.dataset.taskId);
            }
        });

        document.addEventListener('dragend', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                taskItem.classList.remove('dragging');
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault(); // This is crucial to allow dropping
            const tasksList = e.target.closest('.tasks-list');
            if (!tasksList) return;

            const draggingItem = document.querySelector('.task-item.dragging');
            if (!draggingItem) return;

            // Find the task item we're dragging over
            const closestTask = this.getDragAfterElement(tasksList, e.clientY);
            if (closestTask) {
                tasksList.insertBefore(draggingItem, closestTask);
            } else {
                tasksList.appendChild(draggingItem);
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const tasksList = e.target.closest('.tasks-list');
            if (!tasksList) return;

            // Update the tasks array to match the new order
            const newOrder = [...tasksList.querySelectorAll('.task-item')].map(item => 
                this.tasks.find(task => task.id === parseInt(item.dataset.taskId))
            ).filter(Boolean);

            this.tasks = newOrder;
            this.saveTasks();
        });
    }

    // Make tags clickable
    makeTagsClickable() {
        // Find all tag elements
        const tagElements = document.querySelectorAll('.tag');
        
        tagElements.forEach(tagElement => {
            // Add pointer cursor
            tagElement.style.cursor = 'pointer';
            
            // Remove any existing click listeners to prevent duplicates
            tagElement.removeEventListener('click', this.handleTagClick);
            
            // Add click event listener
            tagElement.addEventListener('click', this.handleTagClick);
        });
    }

    // Separate handler function for tag clicks
    handleTagClick(e) {
        e.stopPropagation(); // Prevent event bubbling
        
        const tagName = e.target.textContent.trim();
        
        // Save the selected tag to localStorage
        localStorage.setItem('selectedTag', tagName);
        
        // Redirect to tags page
        window.location.href = 'tagfilter.html';
    }

    // Show notification
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        // Add to body
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
            }, 300);
        }, 3000);
    }

    // Make dates clickable
    makeDatesClickable() {
        const dateElements = document.querySelectorAll('.task-date.clickable');
        dateElements.forEach(dateElement => {
            dateElement.style.cursor = 'pointer';
            dateElement.addEventListener('click', (e) => {
                e.stopPropagation();
                const date = dateElement.dataset.date;
                window.location.href = `calendarview.html?date=${date}`;
            });
        });
    }

    // Show calendar for specific date
    showCalendarForDate(date) {
        const calendarModal = document.getElementById('calendar-modal');
        if (!calendarModal) return;

        // Show the modal
        calendarModal.style.display = 'block';
        
        // Initialize calendar with the specific date
        this.initializeCalendar(new Date(date));
    }

    // Initialize calendar with optional specific date
    initializeCalendar(specificDate = null) {
        const calendarMonthYear = document.getElementById('calendar-month-year');
        const calendarDays = document.getElementById('calendar-days');
        const selectedDate = document.getElementById('selected-date');
        
        if (!calendarMonthYear || !calendarDays) return;
        
        // Get current date or use specific date
        const now = specificDate || new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Set month and year
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
        calendarMonthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        // Generate calendar days
        calendarDays.innerHTML = '';
        
        // Get first day of month and number of days
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarDays.appendChild(emptyDay);
        }
        
        // Add days of month
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            // Create date string for this day
            const currentDate = new Date(currentYear, currentMonth, i);
            const dateString = currentDate.toISOString().split('T')[0];
            
            // Add the day number
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = i;
            dayElement.appendChild(dayNumber);
            
            // Check if there are tasks for this day
            const tasksForDay = this.tasks.filter(task => 
                task.dueDate && task.dueDate.split('T')[0] === dateString
            );
            
            // Add task previews if there are tasks
            if (tasksForDay.length > 0) {
                const tasksContainer = document.createElement('div');
                tasksContainer.className = 'day-tasks';
                
                // Show up to 3 tasks
                tasksForDay.slice(0, 3).forEach(task => {
                    const taskPreview = document.createElement('div');
                    taskPreview.className = 'task-preview';
                    taskPreview.innerHTML = `
                        <span class="task-dot"></span>
                        <span class="task-title">${task.title}</span>
                    `;
                    tasksContainer.appendChild(taskPreview);
                });
                
                // If there are more than 3 tasks, show a count
                if (tasksForDay.length > 3) {
                    const moreTasks = document.createElement('div');
                    moreTasks.className = 'more-tasks';
                    moreTasks.textContent = `+${tasksForDay.length - 3} more`;
                    tasksContainer.appendChild(moreTasks);
                }
                
                dayElement.appendChild(tasksContainer);
            }
            
            // Highlight current day
            if (i === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear()) {
                dayElement.classList.add('current-day');
            }
            
            // Add click handler for the day
            dayElement.addEventListener('click', () => {
                this.showTasksForDate(dateString);
            });
            
            calendarDays.appendChild(dayElement);
        }
    }

    // Show tasks for a specific date
    showTasksForDate(dateString) {
        const dateTasksList = document.getElementById('date-tasks-list');
        const selectedDate = document.getElementById('selected-date');
        
        if (!dateTasksList || !selectedDate) return;
        
        // Format the date for display
        const date = new Date(dateString);
        selectedDate.textContent = date.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Get tasks for this date
        const tasksForDay = this.tasks.filter(task => 
            task.dueDate && task.dueDate.split('T')[0] === dateString
        );
        
        if (tasksForDay.length === 0) {
            dateTasksList.innerHTML = `
                <li class="empty-state">
                    <i class="fas fa-calendar"></i>
                    No tasks scheduled for this day
                </li>
            `;
            return;
        }
        
        // Display tasks
        dateTasksList.innerHTML = tasksForDay.map(task => `
            <li class="task-item" data-task-id="${task.id}">
                <label class="checkbox-container">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    ${task.tags && task.tags.length > 0 ? `
                        <div class="task-tags">
                            ${task.tags.map(tag => {
                                const colorNum = tag.charCodeAt(0) % 10;
                                return `<span class="tag" data-color="${colorNum}">${tag}</span>`;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
                <button class="edit-task" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-task" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </li>
        `).join('');
        
        // Make tags clickable in the calendar view
        this.makeTagsClickable();
    }

    // Update date display
    updateDateDisplay() {
        const dateDisplay = document.querySelector('.date-display');
        if (dateDisplay) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateDisplay.textContent = new Date().toLocaleDateString(undefined, options);
        }
    }

    // Add this helper function to the TaskManager class
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.dataset.id = task.id;

        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => this.toggleTaskCompletion(task.id));

        const taskDetails = document.createElement('div');
        taskDetails.className = 'task-details';

        const title = document.createElement('h3');
        title.className = 'task-title';
        title.textContent = task.title;

        const metadata = document.createElement('div');
        metadata.className = 'task-metadata';

        if (task.date) {
            const date = document.createElement('span');
            date.className = 'task-date clickable';
            date.innerHTML = `<i class="fas fa-calendar"></i> ${task.date}`;
            date.dataset.date = task.date;
            date.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = `calendarview.html?date=${task.date}`;
            });
            metadata.appendChild(date);
        }

        if (task.tags && task.tags.length > 0) {
            const tags = document.createElement('div');
            tags.className = 'task-tags';
            task.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'task-tag';
                tagSpan.textContent = tag;
                tags.appendChild(tagSpan);
            });
            metadata.appendChild(tags);
        }

        if (task.description) {
            const description = document.createElement('p');
            description.className = 'task-description';
            description.textContent = task.description;
            taskDetails.appendChild(description);
        }

        taskDetails.appendChild(title);
        taskDetails.appendChild(metadata);

        taskContent.appendChild(checkbox);
        taskContent.appendChild(taskDetails);

        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'task-action-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editTask(task);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task-action-btn delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTask(task.id);
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(taskContent);
        li.appendChild(actions);

        return li;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});
