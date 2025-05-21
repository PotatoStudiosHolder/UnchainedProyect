document.addEventListener('DOMContentLoaded', function() {
    // Obtener la contraseña desde las variables de entorno
    const CORRECT_PASSWORD = "Incorrecta";

    // Elementos del DOM
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const countdownElement = document.getElementById('countdown');

    // Simular IP del usuario
    const userIP = getUserIP();

    // Inicializar almacenamiento si es necesario
    if (!localStorage.getItem('blockedIPs')) {
        localStorage.setItem('blockedIPs', JSON.stringify([]));
    }
    if (!localStorage.getItem('accessLogs')) {
        localStorage.setItem('accessLogs', JSON.stringify([]));
    }

    const storageKey = `failedAttempts_${userIP}`;
    const blockTimeKey = `blockEndTime_${userIP}`;

    let failedAttempts = parseInt(localStorage.getItem(storageKey) || '0');
    let blockEndTime = parseInt(localStorage.getItem(blockTimeKey) || '0');

    const blockedIPs = JSON.parse(localStorage.getItem('blockedIPs') || '[]');
    const isPermanentlyBlocked = blockedIPs.includes(userIP);
    const isBlocked = blockEndTime > new Date().getTime();

    checkBlockStatus();

    function getUserIP() {
        if (!localStorage.getItem('userIdentifier')) {
            const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('userIdentifier', randomId);
        }
        return localStorage.getItem('userIdentifier');
    }

    function logAccessAttempt(ip, success) {
        const accessLogs = JSON.parse(localStorage.getItem('accessLogs') || '[]');
        const accessLog = { ip, timestamp: new Date().getTime(), success, date: new Date().toLocaleString() };
        accessLogs.unshift(accessLog);
        if (accessLogs.length > 1000) accessLogs.pop();
        localStorage.setItem('accessLogs', JSON.stringify(accessLogs));
    }

    function checkBlockStatus() {
        const currentTime = new Date().getTime();
        if (isPermanentlyBlocked) {
            disableLoginForm();
            errorMessage.textContent = "Su IP ha sido bloqueada permanentemente.";
            return;
        }
        if (isBlocked && currentTime < blockEndTime) {
            disableLoginForm();
            startCountdown(Math.ceil((blockEndTime - currentTime) / 1000));
        } else if (blockEndTime > 0 && currentTime >= blockEndTime) {
            localStorage.removeItem(blockTimeKey);
            enableLoginForm();
        }
    }

    function blockIPPermanently(ip) {
        const blockedIPs = JSON.parse(localStorage.getItem('blockedIPs') || '[]');
        if (!blockedIPs.includes(ip)) {
            blockedIPs.push(ip);
            localStorage.setItem('blockedIPs', JSON.stringify(blockedIPs));
        }
    }

    function disableLoginForm() {
        passwordInput.disabled = true;
        loginBtn.disabled = true;
        loginBtn.classList.add('btn-disabled');
    }

    function enableLoginForm() {
        passwordInput.disabled = false;
        loginBtn.disabled = false;
        loginBtn.classList.remove('btn-disabled');
        errorMessage.textContent = "";
        countdownElement.textContent = "";
    }

    function startCountdown(seconds) {
        let remainingSeconds = seconds;
        function updateCountdown() {
            if (remainingSeconds <= 0) {
                countdownElement.textContent = "";
                enableLoginForm();
                return;
            }
            countdownElement.textContent = `Tiempo de espera: ${Math.floor(remainingSeconds / 60)}:${(remainingSeconds % 60).toString().padStart(2, '0')}`;
            remainingSeconds--;
            setTimeout(updateCountdown, 1000);
        }
        updateCountdown();
    }

    loginBtn.addEventListener('click', function() {
        const password = passwordInput.value.trim();

        if (password === CORRECT_PASSWORD) {
            successMessage.textContent = "¡Acceso concedido!";
            errorMessage.textContent = "";
            logAccessAttempt(userIP, true);
            localStorage.removeItem(storageKey);
            localStorage.removeItem(blockTimeKey);
            passwordInput.value = "";
            window.location.href = "../00Pj.html";
        } else {
            failedAttempts++;
            localStorage.setItem(storageKey, failedAttempts.toString());
            logAccessAttempt(userIP, false);

            if (failedAttempts >= 5) {
                blockIPPermanently(userIP);
                disableLoginForm();
                errorMessage.textContent = "Su IP ha sido bloqueada permanentemente.";
            } else if (failedAttempts >= 2) {
                const blockDuration = 30 * Math.pow(2, failedAttempts - 2) * 1000;
                blockEndTime = new Date().getTime() + blockDuration;
                localStorage.setItem(blockTimeKey, blockEndTime.toString());
                disableLoginForm();
                errorMessage.textContent = `Contraseña incorrecta. Demasiados intentos fallidos.`;
                startCountdown(Math.ceil(blockDuration / 1000));
            } else {
                errorMessage.textContent = `Contraseña incorrecta. Intento ${failedAttempts} de 5.`;
            }
            passwordInput.value = "";
        }
    });

    passwordInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            loginBtn.click();
        }
    });
});
