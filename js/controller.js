class PomodoroController 
{
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.initialize();
        this.setupEventListeners();
    }
    
    initialize() {
        const initialSettings = this.model.getSettings();
        this.view.fillSettingsForm(initialSettings);
        const modeInfo = this.model.setMode('work');
        this.view.updateTimerMode(modeInfo.mode);
        this.view.displayTimer(modeInfo.duration);
        this.view.updateSessionInfo(modeInfo.session, modeInfo.totalSessions);
        const tasks = this.model.getAllTasks();
        const activeTaskId = this.model.activeTaskId;
        this.view.renderTasks(tasks, activeTaskId);
        this.view.updateToggleButton(this.model.isTimerRunning);
    }
    
    setupEventListeners() 
    {
        this.view.toggleButton.addEventListener('click', () => this.toggleTimer());
        this.view.skipButton.addEventListener('click', () => this.skipToNextMode());
        this.view.resetButton.addEventListener('click', () => this.resetTimer());
        for (const mode in this.view.tabElements) {
            this.view.tabElements[mode].addEventListener('click', () => {
                this.changeMode(mode);
            });
        }
        this.view.settingsForm.saveButton.addEventListener('click', () => {
            const newSettings = this.view.getSettingsFormValues();
            const modeInfo = this.model.updateSettings(newSettings);
            this.view.displayTimer(modeInfo.duration);
            this.view.updateSessionInfo(modeInfo.session, modeInfo.totalSessions);
            const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
            settingsModal.hide();
        });
        
        this.view.taskForm.saveButton.addEventListener('click', () => {
            const taskData = this.view.getTaskFormValues();
            if (taskData.name && taskData.estimatedPomodoros > 0) {
                this.model.addTask(taskData.name, taskData.estimatedPomodoros);
                this.view.renderTasks(this.model.getAllTasks(), this.model.activeTaskId);
                this.view.clearTaskForm();
                const taskModal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
                taskModal.hide();
            }
        });
        this.setupTaskEventListeners();
    }
    
    setupTaskEventListeners() {
        this.view.tasksContainer.addEventListener('click', event => {
            const taskItem = event.target.closest('.list-group-item');
            if (!taskItem) return;
            const taskId = taskItem.dataset.taskId;
            if (event.target.closest('.set-active-btn')) {
                this.setActiveTask(taskId);
            }
            if (event.target.closest('.complete-btn')) {
                this.toggleTaskCompletion(taskId);
            }
            if (event.target.closest('.delete-btn')) {
                this.deleteTask(taskId);
            }
        });
    }

    toggleTimer() {
        if (this.model.isTimerRunning) {
            this.model.pauseTimer();
            this.view.updateToggleButton(false);
        } else {
            this.model.startTimer((timeString, progress) => {
                this.view.displayTimer(timeString, progress);
            });
            this.view.updateToggleButton(true);
        }
    }
    
    skipToNextMode() {
        this.model.saveCompletedSession(this.model.currentMode);
        this.model.completeTimer();
        const modeInfo = this.model.moveToNextMode();
        this.view.updateTimerMode(modeInfo.mode);
        this.view.displayTimer(modeInfo.duration);
        this.view.updateSessionInfo(modeInfo.session, modeInfo.totalSessions);
        this.view.updateToggleButton(false);
        const soundType = modeInfo.mode === 'work' ? 'work' : 'break';
        this.view.playSound(soundType);
        const notificationTitle = modeInfo.mode === 'work' 
            ? 'Час працювати!' 
            : (modeInfo.mode === 'shortBreak' ? 'Коротка перерва' : 'Довга перерва');

        this.view.showNotification(notificationTitle, {
            body: modeInfo.mode === 'work' 
                ? 'Почніть нову сесію роботи.' 
                : 'Час відпочити.',
            icon: 'images/pomodoro-icon.png'
        });
    }
    
    resetTimer() {
        this.model.resetTimer();
        const modeInfo = this.model.setMode(this.model.currentMode);
        this.view.displayTimer(modeInfo.duration);
        this.view.updateSessionInfo(modeInfo.session, modeInfo.totalSessions);
        this.view.updateToggleButton(false);
    }
    
    changeMode(mode) {
        const modeInfo = this.model.setModeManually(mode);
        this.view.updateTimerMode(modeInfo.mode);
        this.view.displayTimer(modeInfo.duration);
        this.view.updateSessionInfo(modeInfo.session, modeInfo.totalSessions);
        this.view.updateToggleButton(false);
    }
    
    setActiveTask(taskId) {
        if (this.model.setActiveTask(taskId)) {
            this.view.renderTasks(this.model.getAllTasks(), taskId);
        }
    }
    
    toggleTaskCompletion(taskId) {
        const updatedTask = this.model.toggleTaskCompletion(taskId);
        if (updatedTask) {
            this.view.renderTasks(this.model.getAllTasks(), this.model.activeTaskId);
            
            if (updatedTask.completed) {
                this.view.playSound('complete');
            }
        }
    }
    
    deleteTask(taskId) {
        if (confirm('Ви впевнені, що хочете видалити це завдання?')) {
            if (this.model.deleteTask(taskId)) {
                this.view.renderTasks(this.model.getAllTasks(), this.model.activeTaskId);
            }
        }
    }
}