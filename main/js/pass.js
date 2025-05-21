document.addEventListener('DOMContentLoaded', function () {
  // La contraseña correcta. Cámbiala al valor real.
  const CORRECT_PASSWORD = "incorrecta";

  // Elementos del DOM
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('login-btn');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');
  const countdownElement = document.getElementById('countdown');

  // Simular la "IP" del usuario mediante un identificador único en localStorage
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

  // Obtener datos de localStorage
  let failedAttempts = parseInt(localStorage.getItem(storageKey) || '0');
  let blockEndTime = parseInt(localStorage.getItem(blockTimeKey) || '0');

  // Comprobar si el usuario ya está bloqueado
  checkBlockStatus();

  // Función para simular la IP del usuario mediante un identificador único
  function getUserIP() {
    let userIdentifier = localStorage.getItem('userIdentifier');
    if (!userIdentifier) {
      userIdentifier =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      localStorage.setItem('userIdentifier', userIdentifier);
    }
    return userIdentifier;
  }

  // Función para registrar cada intento de acceso
  function logAccessAttempt(ip, success) {
    const accessLogs = JSON.parse(localStorage.getItem('accessLogs')) || [];
    const accessLog = {
      ip,
      timestamp: new Date().getTime(),
      success,
      date: new Date().toLocaleString(),
    };
    accessLogs.unshift(accessLog);
    if (accessLogs.length > 1000) accessLogs.pop();
    localStorage.setItem('accessLogs', JSON.stringify(accessLogs));
  }

  // Función para comprobar el estado actual del bloqueo
  function checkBlockStatus() {
    const currentTime = new Date().getTime();
    const blockedIPs = JSON.parse(localStorage.getItem('blockedIPs')) || [];
    const isPermanentlyBlocked = blockedIPs.includes(userIP);
    const isCurrentlyBlocked = blockEndTime > currentTime;

    if (isPermanentlyBlocked) {
      disableLoginForm();
      errorMessage.textContent = "Su IP ha sido bloqueada permanentemente.";
      return;
    }
    if (isCurrentlyBlocked) {
      disableLoginForm();
      const secondsRemaining = Math.ceil((blockEndTime - currentTime) / 1000);
      startCountdown(secondsRemaining);
    } else if (blockEndTime > 0 && currentTime >= blockEndTime) {
      // Reiniciamos el bloqueo y los intentos fallidos al finalizar el periodo
      localStorage.removeItem(blockTimeKey);
      blockEndTime = 0;
      failedAttempts = 0;
      localStorage.setItem(storageKey, '0');
      enableLoginForm();
    }
  }

  // Función para bloquear definitivamente la IP del usuario
  function blockIPPermanently(ip) {
    const blockedIPs = JSON.parse(localStorage.getItem('blockedIPs')) || [];
    if (!blockedIPs.includes(ip)) {
      blockedIPs.push(ip);
      localStorage.setItem('blockedIPs', JSON.stringify(blockedIPs));
    }
  }

  // Deshabilita el formulario de login
  function disableLoginForm() {
    passwordInput.disabled = true;
    loginBtn.disabled = true;
    loginBtn.classList.add('btn-disabled');
  }

  // Habilita el formulario de login
  function enableLoginForm() {
    passwordInput.disabled = false;
    loginBtn.disabled = false;
    loginBtn.classList.remove('btn-disabled');
    errorMessage.textContent = "";
    countdownElement.textContent = "";
  }

  // Inicia el contador regresivo durante el período de bloqueo
  function startCountdown(seconds) {
    let remainingSeconds = seconds;
    const countdownInterval = setInterval(() => {
      if (remainingSeconds <= 0) {
        clearInterval(countdownInterval);
        countdownElement.textContent = "";
        enableLoginForm();
        return;
      }
      let minutes = Math.floor(remainingSeconds / 60);
      let secondsPart = (remainingSeconds % 60).toString().padStart(2, '0');
      countdownElement.textContent = `Tiempo de espera: ${minutes}:${secondsPart}`;
      remainingSeconds--;
    }, 1000);
  }

  // Gestión del clic en el botón de login
  loginBtn.addEventListener('click', function () {
    const password = passwordInput.value.trim();

    if (password === CORRECT_PASSWORD) {
      successMessage.textContent = "¡Acceso concedido!";
      errorMessage.textContent = "";
      logAccessAttempt(userIP, true);
      localStorage.removeItem(storageKey);
      localStorage.removeItem(blockTimeKey);
      passwordInput.value = "";
      window.location.href = "../html/Interface/GMmode.html";
    } else {
      failedAttempts++;
      localStorage.setItem(storageKey, failedAttempts.toString());
      logAccessAttempt(userIP, false);

      if (failedAttempts >= 5) {
        blockIPPermanently(userIP);
        disableLoginForm();
        errorMessage.textContent = "Su IP ha sido bloqueada permanentemente.";
      } else if (failedAttempts >= 2) {
        // Calcula la duración del bloqueo: 30 seg * 2^(intentos fallidos - 2)
        const blockDuration = 30 * Math.pow(2, failedAttempts - 2) * 1000;
        blockEndTime = new Date().getTime() + blockDuration;
        localStorage.setItem(blockTimeKey, blockEndTime.toString());
        disableLoginForm();
        errorMessage.textContent = "Contraseña incorrecta. Demasiados intentos fallidos.";
        startCountdown(Math.ceil(blockDuration / 1000));
      } else {
        errorMessage.textContent = `Contraseña incorrecta. Intento ${failedAttempts} de 5.`;
      }
      passwordInput.value = "";
    }
  });

  // Permitir la acción con la tecla Enter
  passwordInput.addEventListener('keyup', function (event) {
    if (event.key === 'Enter') {
      loginBtn.click();
    }
  });
});

const backBtn = document.getElementById('backBtn');
backBtn.addEventListener('click', goBack);

function goBack() {
    history.back();
}
