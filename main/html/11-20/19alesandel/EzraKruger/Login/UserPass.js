const backBtn = document.getElementById('backBtn');
backBtn.addEventListener('click', goBack);

function goBack() {
    history.back();
}

// Modificación al primer archivo (paste.txt)
document.addEventListener('DOMContentLoaded', function() {
    // Contraseña correcta (en un entorno real, esto se verificaría en el servidor)
    const CORRECT_PASSWORD = "DeceasedUser";
    
    // Elementos del DOM
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const countdownElement = document.getElementById('countdown');
    
    // Simular IP del usuario (en un entorno real, esto se obtendría del servidor)
    // En este ejemplo usamos una simulación de IP basada en un identificador único por navegador
    const userIP = getUserIP();
    
    // Inicializar almacenamiento de IPs bloqueadas si no existe
    if (!localStorage.getItem('blockedIPs')) {
        localStorage.setItem('blockedIPs', JSON.stringify([]));
    }
    
    // Inicializar registro de accesos si no existe
    if (!localStorage.getItem('accessLogs')) {
        localStorage.setItem('accessLogs', JSON.stringify([]));
    }
    
    // Variables para el control de intentos (específicos por IP)
    const storageKey = `failedAttempts_${userIP}`;
    const blockTimeKey = `blockEndTime_${userIP}`;
    
    let failedAttempts = parseInt(localStorage.getItem(storageKey) || '0');
    let blockEndTime = parseInt(localStorage.getItem(blockTimeKey) || '0');
    
    // Verificar si la IP del usuario está bloqueada permanentemente
    const blockedIPs = JSON.parse(localStorage.getItem('blockedIPs') || '[]');
    const isPermanentlyBlocked = blockedIPs.includes(userIP);
    
    // Verificar si el usuario está bloqueado temporalmente
    const isBlocked = blockEndTime > new Date().getTime();
    
    // Verificar el estado de bloqueo al cargar la página
    checkBlockStatus();
    
    // Función para obtener una simulación de IP del usuario
    function getUserIP() {
        // En un entorno real, esto sería manejado por el servidor
        // Aquí usamos un identificador único por dispositivo/navegador
        if (!localStorage.getItem('userIdentifier')) {
            const randomId = Math.random().toString(36).substring(2, 15) + 
                            Math.random().toString(36).substring(2, 15);
            localStorage.setItem('userIdentifier', randomId);
        }
        return localStorage.getItem('userIdentifier');
    }
    
    // Función para registrar un intento de acceso
    function logAccessAttempt(ip, success) {
        const accessLogs = JSON.parse(localStorage.getItem('accessLogs') || '[]');
        
        // Crear nuevo registro de acceso
        const accessLog = {
            ip: ip,
            timestamp: new Date().getTime(),
            success: success,
            date: new Date().toLocaleString()
        };
        
        // Añadir al principio del array para que los más recientes aparezcan primero
        accessLogs.unshift(accessLog);
        
        // Limitar el número de registros (opcional, para evitar que crezca demasiado)
        if (accessLogs.length > 1000) {
            accessLogs.pop();
        }
        
        // Guardar en localStorage
        localStorage.setItem('accessLogs', JSON.stringify(accessLogs));
    }
    
    // Función para verificar el estado de bloqueo
    function checkBlockStatus() {
        const currentTime = new Date().getTime();
        
        // Comprobar bloqueo permanente
        if (isPermanentlyBlocked) {
            disableLoginForm();
            errorMessage.textContent = "Su IP ha sido bloqueada permanentemente por exceder el número máximo de intentos.";
            return;
        }
        
        // Comprobar bloqueo temporal
        if (isBlocked && currentTime < blockEndTime) {
            disableLoginForm();
            const remainingTime = Math.ceil((blockEndTime - currentTime) / 1000);
            startCountdown(remainingTime);
        } else if (blockEndTime > 0 && currentTime >= blockEndTime) {
            // El tiempo de bloqueo ha terminado
            localStorage.removeItem(blockTimeKey);
            enableLoginForm();
        }
    }
    
    // Función para bloquear permanentemente una IP
    function blockIPPermanently(ip) {
        const blockedIPs = JSON.parse(localStorage.getItem('blockedIPs') || '[]');
        if (!blockedIPs.includes(ip)) {
            blockedIPs.push(ip);
            localStorage.setItem('blockedIPs', JSON.stringify(blockedIPs));
        }
    }
    
    // Deshabilitar el formulario de inicio de sesión
    function disableLoginForm() {
        passwordInput.disabled = true;
        loginBtn.disabled = true;
        loginBtn.classList.add('btn-disabled');
    }
    
    // Habilitar el formulario de inicio de sesión
    function enableLoginForm() {
        passwordInput.disabled = false;
        loginBtn.disabled = false;
        loginBtn.classList.remove('btn-disabled');
        errorMessage.textContent = "";
        countdownElement.textContent = "";
    }
    
    // Iniciar la cuenta regresiva
    function startCountdown(seconds) {
        let remainingSeconds = seconds;
        
        function updateCountdown() {
            if (remainingSeconds <= 0) {
                countdownElement.textContent = "";
                enableLoginForm();
                return;
            }
            
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            countdownElement.textContent = `Tiempo de espera: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            remainingSeconds--;
            setTimeout(updateCountdown, 1000);
        }
        
        updateCountdown();
    }
    
    // Manejar el intento de inicio de sesión
    loginBtn.addEventListener('click', function() {
        const password = passwordInput.value.trim();
        
        if (password === CORRECT_PASSWORD) {
            // Contraseña correcta
            successMessage.textContent = "¡Acceso concedido!";
            errorMessage.textContent = "";

            // Registrar intento exitoso
            logAccessAttempt(userIP, true);

            // Reiniciar los intentos fallidos para esta IP
            localStorage.removeItem(storageKey);
            localStorage.removeItem(blockTimeKey);
            
            // Limpiar el campo de contraseña
            passwordInput.value = "";
            
            // Redirigir al usuario a otra página
            window.location.href = "../00Pj.html";
        }else {
            // Contraseña incorrecta
            failedAttempts++;
            localStorage.setItem(storageKey, failedAttempts.toString());
            
            // Registrar intento fallido
            logAccessAttempt(userIP, false);
            
            if (failedAttempts >= 5) {
                // Bloqueo permanente después de 5 intentos
                blockIPPermanently(userIP);
                disableLoginForm();
                errorMessage.textContent = "Su IP ha sido bloqueada permanentemente por exceder el número máximo de intentos.";
                successMessage.textContent = "";
            } else if (failedAttempts >= 2) {
                // Bloqueo temporal después de 2 intentos
                const blockDuration = 30 * Math.pow(2, failedAttempts - 2) * 1000; // Duración en milisegundos
                const blockEndTimeValue = new Date().getTime() + blockDuration;
                
                blockEndTime = blockEndTimeValue;
                localStorage.setItem(blockTimeKey, blockEndTimeValue.toString());
                
                disableLoginForm();
                errorMessage.textContent = `Contraseña incorrecta. Demasiados intentos fallidos.`;
                successMessage.textContent = "";
                
                const remainingSeconds = Math.ceil(blockDuration / 1000);
                startCountdown(remainingSeconds);
            } else {
                // Mostrar error pero sin bloqueo (menos de 2 intentos)
                errorMessage.textContent = `Contraseña incorrecta. Intento ${failedAttempts} de 5.`;
                successMessage.textContent = "";
            }
            
            // Limpiar el campo de contraseña
            passwordInput.value = "";
        }
    });
    
    // Permitir enviar el formulario presionando Enter
    passwordInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            loginBtn.click();
        }
    });
});