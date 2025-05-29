class PomodoroModel {
    constructor() {
        this.timerInterval = null;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.isTimerRunning = false;
        this.currentMode = 'work';
      
        this.settings = this.loadSettings() || {
            workDuration: 25 * 60 * 1000,
            shortBreakDuration: 5 * 60 * 1000,
            longBreakDuration: 15 * 60 * 1000,
            sessionsBeforeLongBreak: 4
        };
      
        this.currentSession = 1;
        this.totalSessions = this.settings.sessionsBeforeLongBreak;
      
        this.currentDuration = this.settings.workDuration;
      
        this.tasks = this.loadTasks() || [];
        this.activeTaskId = null;
    }
  
    startTimer(callback) {
        this.startTime = new Date().getTime() - this.elapsedTime;
        this.isTimerRunning = true;
      
        this.timerInterval = setInterval(() => {
            const currentTime = new Date().getTime();
            this.elapsedTime = currentTime - this.startTime;

            if (this.elapsedTime >= this.currentDuration) {
                this.completeTimer();
                callback(this.formatTime(0), 1);
                this.moveToNextMode();
                return;
            }
          
            const remainingTime = this.currentDuration - this.elapsedTime;
            const progress = this.elapsedTime / this.currentDuration;
          
            callback(this.formatTime(remainingTime), progress);
        }, 100);
    } 
  
    pauseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.isTimerRunning = false;
        }
    }
  
    resetTimer() {
        this.pauseTimer();
        this.elapsedTime = 0;
        this.isTimerRunning = false;
    }
  
    completeTimer() {
        this.pauseTimer();
        this.elapsedTime = 0;

        if (this.currentMode === 'work' && this.activeTaskId !== null) {
            const taskIndex = this.tasks.findIndex(task => task.id === this.activeTaskId);
            if (taskIndex !== -1) {
                this.tasks[taskIndex].completedPomodoros++;
                this.saveTasks();
            }
        }
    }
  
    moveToNextMode() {
        if (this.currentMode === 'work') {
          if (this.currentSession >= this.settings.sessionsBeforeLongBreak) {
                this.setMode('longBreak');
                this.currentSession = 1;
            } else {
                this.setMode('shortBreak');
                this.currentSession++;
            }
        } else {
            this.setMode('work');
        }
    }
  
    setMode(mode) {
        this.currentMode = mode;
        this.resetTimer();
      
        switch (mode) {
            case 'work':
                this.currentDuration = this.settings.workDuration;
                break;
            case 'shortBreak':
                this.currentDuration = this.settings.shortBreakDuration;
                break;
            case 'longBreak':
                this.currentDuration = this.settings.longBreakDuration;
                break;
        }
      
        return {
            mode: this.currentMode,
            duration: this.formatTime(this.currentDuration),
            session: this.currentSession,
            totalSessions: this.settings.sessionsBeforeLongBreak
        };
    }
  
    setModeManually(mode) {
        return this.setMode(mode);
    }
  
    formatTime(milliseconds) {
        const totalSeconds = Math.ceil(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
      
        return `${this.pad(minutes, 2)}:${this.pad(seconds, 2)}`;
    }
  
    pad(number, length) {
        let str = String(number);
        while (str.length < length) {
            str = "0" + str;
        }
        return str;
    }
  
    updateSettings(newSettings) {
        this.settings = {
            workDuration: newSettings.workDuration * 60 * 1000,
            shortBreakDuration: newSettings.shortBreakDuration * 60 * 1000,
            longBreakDuration: newSettings.longBreakDuration * 60 * 1000,
            sessionsBeforeLongBreak: newSettings.sessionsBeforeLongBreak
        };
      
        this.totalSessions = this.settings.sessionsBeforeLongBreak;
        this.saveSettings();
      
        switch (this.currentMode) {
            case 'work':
                this.currentDuration = this.settings.workDuration;
                break;
            case 'shortBreak':
                this.currentDuration = this.settings.shortBreakDuration;
                break;
            case 'longBreak':
                this.currentDuration = this.settings.longBreakDuration;
                break;
        }
      
        return {
            mode: this.currentMode,
            duration: this.formatTime(this.currentDuration),
            session: this.currentSession,
            totalSessions: this.settings.sessionsBeforeLongBreak
        };
    }
  
    getSettings() {
        return {
            workDuration: this.settings.workDuration / (60 * 1000),
            shortBreakDuration: this.settings.shortBreakDuration / (60 * 1000),
            longBreakDuration: this.settings.longBreakDuration / (60 * 1000),
            sessionsBeforeLongBreak: this.settings.sessionsBeforeLongBreak
        };
    }
  
    addTask(taskName, estimatedPomodoros) {
        const task = {
            id: Date.now().toString(),
            name: taskName,
            estimatedPomodoros: parseInt(estimatedPomodoros, 10),
            completedPomodoros: 0,
            completed: false,
            createdAt: new Date().toISOString()
        };
      
        this.tasks.push(task);
        this.saveTasks();
        return task;
    }
  
    toggleTaskCompletion(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex].completed = !this.tasks[taskIndex].completed;
            this.saveTasks();
            return this.tasks[taskIndex];
        }
        return null;
    }
  
    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            this.tasks.splice(taskIndex, 1);
          
            if (this.activeTaskId === taskId) {
                this.activeTaskId = null;
            }
          
            this.saveTasks();
            return true;
        }
        return false;
    }
  
    setActiveTask(taskId) {
        const taskExists = this.tasks.some(task => task.id === taskId);
        if (taskExists) {
            this.activeTaskId = taskId;
            return true;
        }
        return false;
    }
  
    getActiveTask() {
        if (!this.activeTaskId) return null;
        return this.tasks.find(task => task.id === this.activeTaskId);
    }
  
    getAllTasks() {
        return this.tasks;
    }
  
    saveSettings() {
        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
    }
  
    loadSettings() {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        return savedSettings ? JSON.parse(savedSettings) : null;
    }
  
    saveTasks() {
        localStorage.setItem('pomodoroTasks', JSON.stringify({
            tasks: this.tasks,
            activeTaskId: this.activeTaskId
        }));
    }
  
    loadTasks() {
        const savedTasks = localStorage.getItem('pomodoroTasks');
        if (savedTasks) {
            const parsedData = JSON.parse(savedTasks);
            this.activeTaskId = parsedData.activeTaskId;
            return parsedData.tasks;
        }
        return null;
    }
  
    saveCompletedSession(mode) {
        const sessionHistory = JSON.parse(localStorage.getItem('pomodoroHistory') || '[]');
      
        const session = {
            timestamp: new Date().toISOString(),
            mode: mode,
            duration: mode === 'work' 
                ? this.settings.workDuration / (60 * 1000) 
                : (mode === 'shortBreak' 
                    ? this.settings.shortBreakDuration / (60 * 1000) 
                    : this.settings.longBreakDuration / (60 * 1000)),
            taskId: this.activeTaskId,
            taskName: this.activeTaskId 
                ? (this.tasks.find(t => t.id === this.activeTaskId)?.name || 'Невідоме завдання') 
                : null
        };
      
        sessionHistory.push(session);
        localStorage.setItem('pomodoroHistory', JSON.stringify(sessionHistory));
    }
  
    getSessionHistory() {
        return JSON.parse(localStorage.getItem('pomodoroHistory') || '[]');
    }
}