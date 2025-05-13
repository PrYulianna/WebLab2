class PomodoroView {
    constructor() {
        this.timerElement = document.getElementById('timer');
        this.timerCircle = document.querySelector('.progress-ring__circle');
        this.timerContainer = document.getElementById('timerCircle');
        
        this.toggleButton = document.getElementById('toggleButton');
        this.toggleButtonIcon = this.toggleButton.querySelector('.material-icons');
        this.skipButton = document.getElementById('skipButton');
        this.resetButton = document.getElementById('resetButton');
        
        this.sessionCountElement = document.getElementById('sessionCount');
        this.totalSessionsElement = document.getElementById('totalSessions');
        
        this.tabElements = {
            work: document.getElementById('work-tab'),
            shortBreak: document.getElementById('short-break-tab'),
            longBreak: document.getElementById('long-break-tab')
        };
        
        this.settingsForm = {
            workDuration: document.getElementById('workDuration'),
            shortBreakDuration: document.getElementById('shortBreakDuration'),
            longBreakDuration: document.getElementById('longBreakDuration'),
            sessionsBeforeLongBreak: document.getElementById('sessionsBeforeLongBreak'),
            saveButton: document.getElementById('saveSettingsButton')
        };
        
        this.tasksContainer = document.getElementById('tasksList');
        this.taskForm = {
            nameInput: document.getElementById('taskName'),
            estimatedPomodorosInput: document.getElementById('taskEstimatedPomodoros'),
            saveButton: document.getElementById('saveTaskButton')
        };
        
        this.circleRadius = parseInt(this.timerCircle.getAttribute('r'));
        this.circumference = 2 * Math.PI * this.circleRadius;
        this.timerCircle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        this.timerCircle.style.strokeDashoffset = this.circumference;
    }
    
    displayTimer(timeString, progress = 0) {
        this.timerElement.textContent = timeString;
        this.updateProgressRing(progress);
    }
    
    updateProgressRing(progress) {
        const offset = this.circumference - (progress * this.circumference);
        this.timerCircle.style.strokeDashoffset = offset;
    }
    
    updateTimerMode(mode) {
        this.timerContainer.classList.remove('work', 'shortBreak', 'longBreak');
        
        this.timerContainer.classList.add(mode);
        
        Object.keys(this.tabElements).forEach(tabMode => {
            if (tabMode === mode) {
                this.tabElements[tabMode].classList.add('active');
            } else {
                this.tabElements[tabMode].classList.remove('active');
            }
        });
        
        switch (mode) {
            case 'work':
                this.timerCircle.setAttribute('stroke', '#8a2be2');
                break;
            case 'shortBreak':
                this.timerCircle.setAttribute('stroke', '#20b2aa');
                break;
            case 'longBreak':
                this.timerCircle.setAttribute('stroke', '#3cb371');
                break;
        }
    }
    
    updateToggleButton(isRunning) {
        if (isRunning) {
            this.toggleButtonIcon.textContent = 'pause';
            this.toggleButton.setAttribute('title', 'Пауза');
        } else {
            this.toggleButtonIcon.textContent = 'play_arrow';
            this.toggleButton.setAttribute('title', 'Старт');
        }
    }
    
    updateSessionInfo(currentSession, totalSessions) 
    {
        this.sessionCountElement.textContent = currentSession;
        this.totalSessionsElement.textContent = totalSessions;
    }
    
    fillSettingsForm(settings) 
    {
        this.settingsForm.workDuration.value = settings.workDuration;
        this.settingsForm.shortBreakDuration.value = settings.shortBreakDuration;
        this.settingsForm.longBreakDuration.value = settings.longBreakDuration;
        this.settingsForm.sessionsBeforeLongBreak.value = settings.sessionsBeforeLongBreak;
    }
    
    getSettingsFormValues() {
        return {
            workDuration: parseInt(this.settingsForm.workDuration.value, 10),
            shortBreakDuration: parseInt(this.settingsForm.shortBreakDuration.value, 10),
            longBreakDuration: parseInt(this.settingsForm.longBreakDuration.value, 10),
            sessionsBeforeLongBreak: parseInt(this.settingsForm.sessionsBeforeLongBreak.value, 10)
        };
    }
    
    renderTasks(tasks, activeTaskId) 
    {
        this.tasksContainer.innerHTML = '';
        
        if (tasks.length === 0) {
            this.tasksContainer.innerHTML = `
                <div class="p-4 text-center text-muted">
                    <span class="material-icons" style="font-size: 3rem;">assignment</span>
                    <p>Поки що немає завдань. Додайте завдання, щоб почати!</p>
                </div>
            `;
            return;
        }
        
        const tasksList = document.createElement('ul');
        tasksList.className = 'list-group list-group-flush';
        
        tasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `list-group-item d-flex justify-content-between align-items-center 
                ${task.completed ? 'completed-task' : ''} 
                ${task.id === activeTaskId ? 'active-task' : ''}`;
            taskItem.dataset.taskId = task.id;
            
            const taskContent = document.createElement('div');
            taskContent.className = 'd-flex flex-column flex-grow-1';
            
            const taskHeader = document.createElement('div');
            taskHeader.className = 'd-flex justify-content-between align-items-center mb-2';
            
            const taskTitle = document.createElement('h6');
            taskTitle.className = 'm-0 task-title';
            taskTitle.textContent = task.name;
            
            const taskControls = document.createElement('div');
            taskControls.className = 'task-controls';
            
            const setActiveBtn = document.createElement('button');
            setActiveBtn.className = 'btn btn-sm btn-outline-primary me-1 set-active-btn';
            setActiveBtn.setAttribute('title', 'Встановити як активне');
            setActiveBtn.innerHTML = '<span class="material-icons">play_circle</span>';
            
            const completeBtn = document.createElement('button');
            completeBtn.className = 'btn btn-sm btn-outline-success me-1 complete-btn';
            completeBtn.setAttribute('title', task.completed ? 'Скасувати виконання' : 'Позначити як виконане');
            completeBtn.innerHTML = `<span class="material-icons">${task.completed ? 'close' : 'check'}</span>`;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger delete-btn';
            deleteBtn.setAttribute('title', 'Видалити завдання');
            deleteBtn.innerHTML = '<span class="material-icons">delete</span>';
            
            taskControls.appendChild(setActiveBtn);
            taskControls.appendChild(completeBtn);
            taskControls.appendChild(deleteBtn);
            
            taskHeader.appendChild(taskTitle);
            taskHeader.appendChild(taskControls);
            
            const progressContainer = document.createElement('div');
            progressContainer.className = 'progress-container';
            
            const pomodoroProgress = document.createElement('div');
            pomodoroProgress.className = 'd-flex align-items-center';
            
            const progressText = document.createElement('span');
            progressText.className = 'me-2 small';
            progressText.textContent = `${task.completedPomodoros}/${task.estimatedPomodoros} помодорів`;
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress flex-grow-1';
            progressBar.style.height = '10px';
            
            const progressBarInner = document.createElement('div');
            const progressPercent = task.estimatedPomodoros > 0 
                ? (task.completedPomodoros / task.estimatedPomodoros) * 100 
                : 0;
            progressBarInner.className = 'progress-bar';
            progressBarInner.style.width = `${Math.min(progressPercent, 100)}%`;
            progressBarInner.setAttribute('aria-valuenow', progressPercent);
            progressBarInner.setAttribute('aria-valuemin', '0');
            progressBarInner.setAttribute('aria-valuemax', '100');

            progressBar.appendChild(progressBarInner);
            pomodoroProgress.appendChild(progressText);
            pomodoroProgress.appendChild(progressBar);
            progressContainer.appendChild(pomodoroProgress);

            taskContent.appendChild(taskHeader);
            taskContent.appendChild(progressContainer);
            taskItem.appendChild(taskContent);

            tasksList.appendChild(taskItem);
        });
        
        this.tasksContainer.appendChild(tasksList);
        this.setupTaskEventListeners();
    }
    
    setupTaskEventListeners() 
    {
    }
    
    clearTaskForm() {
        this.taskForm.nameInput.value = '';
        this.taskForm.estimatedPomodorosInput.value = '1';
    }
    
    getTaskFormValues() {
        return {
            name: this.taskForm.nameInput.value.trim(),
            estimatedPomodoros: parseInt(this.taskForm.estimatedPomodorosInput.value, 10)
        };
    }
    
    showNotification(title, options = {}) {
        if (!("Notification" in window)) {
            console.log("Цей браузер не підтримує сповіщення");
            return;
        }
        if (Notification.permission === "granted") {
            new Notification(title, options);
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification(title, options);
                }
            });
        }
    }
    
    playSound(soundType) {
        const audio = new Audio();
        
        switch (soundType) {
            case 'work':
                audio.src = 'sounds/work.mp3';
                break;
            case 'break':
                audio.src = 'sounds/break.mp3';
                break;
            case 'complete':
                audio.src = 'sounds/complete.mp3';
                break;
        }
        
        audio.play().catch(e => console.log('Помилка відтворення звуку:', e));
    }
}