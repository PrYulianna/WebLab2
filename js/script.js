document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('timer')) {
        console.error('Елемент "timer" не знайдено. Перевірте HTML розмітку.');
        return;
    }
    
    try {
        const model = new PomodoroModel();
        const view = new PomodoroView();
        const controller = new PomodoroController(model, view);
        
        console.log('Pomodoro Timer ініціалізовано успішно.');
        if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission().then(function(permission) {
                if (permission === "granted") {
                    console.log('Дозвіл на сповіщення отримано');
                }
            });
        }
    } 
    catch (error) {
        console.error('Помилка ініціалізації Pomodoro Timer:', error);
    }
    setupBootstrapComponents();
});

function setupBootstrapComponents() 
{
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) 
        {
        settingsModal.addEventListener('shown.bs.modal', function() {
            document.getElementById('workDuration').focus();
        });
    }
    
    const addTaskModal = document.getElementById('addTaskModal');
    if (addTaskModal) 
        {
        addTaskModal.addEventListener('shown.bs.modal', function() {
            document.getElementById('taskName').focus();
        });
        
        addTaskModal.addEventListener('hidden.bs.modal', function() {
            document.getElementById('taskName').value = '';
            document.getElementById('taskEstimatedPomodoros').value = '1';
        });
    }
}