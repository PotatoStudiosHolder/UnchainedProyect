document.addEventListener('DOMContentLoaded', function() {
    // Contraseña de administrador (en un entorno real, se verificará en el servidor)
    const ADMIN_PASSWORD = "admin";
    
    // Elementos del DOM
    const adminLoginSection = document.getElementById('admin-login-section');
    const adminPanel = document.getElementById('admin-panel');
    const adminPasswordInput = document.getElementById('admin-password');
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const adminError = document.getElementById('admin-error');
    const refreshBtn = document.getElementById('refresh-btn');
    const ipsList = document.getElementById('ips-list');
    const logsList = document.getElementById('logs-list');
    const noIpsMessage = document.getElementById('no-ips');
    const noLogsMessage = document.getElementById('no-logs');
    const unblockAllBtn = document.getElementById('unblock-all-btn');
    const clearLogsBtn = document.getElementById('clear-logs-btn');
    const messageElement = document.getElementById('message');
    const totalBlockedElement = document.getElementById('total-blocked');
    const tempBlockedElement = document.getElementById('temp-blocked');
    const totalAccessElement = document.getElementById('total-access');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const blockIpBtn = document.getElementById('block-ip-btn');
    const ipToBlockInput = document.getElementById('ip-to-block');
    
    let currentFilter = 'all';
    
    // Configurar eventos
    adminLoginBtn.addEventListener('click', validateAdminLogin);
    refreshBtn.addEventListener('click', refreshData);
    unblockAllBtn.addEventListener('click', unblockAllIPs);
    clearLogsBtn.addEventListener('click', clearAccessLogs);
    blockIpBtn.addEventListener('click', manuallyBlockIP);
    
    // Configurar las pestañas
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            tabPanels.forEach(panel => {
                if (panel.id === tabId) {
                    panel.classList.add('active');
                } else {
                    panel.classList.remove('active');
                }
            });
        });
    });
    
    // Configurar los filtros de los registros de acceso
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentFilter = button.getAttribute('data-filter');
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            loadAccessLogs(currentFilter);
        });
    });
    
    // Permitir enviar el formulario al presionar Enter
    adminPasswordInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            adminLoginBtn.click();
        }
    });
    
    // Permitir bloquear IP al presionar Enter
    ipToBlockInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            blockIpBtn.click();
        }
    });
    
    /**
     * Valida si la dirección IP es en formato IPv4 o IPv6
     * @param {string} ip - Dirección IP a validar
     * @return {Object} - Objeto con el resultado de la validación y el tipo de IP
     */
    function validateIPAddress(ip) {
        // Patrón para validar IPv4
        const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
        
        // Patrón para validar IPv6
        const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,6}:([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)$|^fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}$|^::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])$|^([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])$/;
        
        if (ipv4Pattern.test(ip)) {
            // Verificar que cada octeto esté en el rango correcto (0-255)
            const octets = ip.split('.');
            for (let i = 0; i < 4; i++) {
                const num = parseInt(octets[i]);
                if (num < 0 || num > 255) {
                    return { isValid: false, type: 'unknown' };
                }
            }
            return { isValid: true, type: 'ipv4' };
        } else if (ipv6Pattern.test(ip)) {
            return { isValid: true, type: 'ipv6' };
        } else {
            return { isValid: false, type: 'unknown' };
        }
    }
    
    /**
     * Función para validar el login de administrador
     */
    function validateAdminLogin() {
        const password = adminPasswordInput.value.trim();
        if (password === ADMIN_PASSWORD) {
            adminLoginSection.style.display = 'none';
            adminPanel.style.display = 'block';
            refreshData();
            
            // Registrar acceso exitoso (simular IP de ejemplo para el acceso admin)
            const adminIP = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
            logAccess(adminIP, 'success', 'ipv6');
        } else {
            adminError.textContent = "Contraseña incorrecta";
            
            // Registrar acceso fallido (simular IP de ejemplo para intento fallido)
            const failIP = "2001:0db8:85a3:0000:0000:8a2e:0370:7335";
            logAccess(failIP, 'failure', 'ipv6');
        }
        adminPasswordInput.value = "";
    }
    
    /**
     * Registra un intento de acceso en el historial
     * @param {string} ip - Dirección IP
     * @param {string} status - Estado del acceso (success/failure)
     * @param {string} ipType - Tipo de IP (ipv4/ipv6)
     */
    function logAccess(ip, status, ipType) {
        let accessLogs = JSON.parse(localStorage.getItem('accessLogs') || '[]');
        accessLogs.push({
            ip: ip,
            ipType: ipType,
            timestamp: new Date().getTime(),
            status: status
        });
        localStorage.setItem('accessLogs', JSON.stringify(accessLogs));
        updateStats();
    }
    
    /**
     * Función para bloquear una IP manualmente
     */
    function manuallyBlockIP() {
        const ip = ipToBlockInput.value.trim();
        
        if (!ip) {
            showMessage('Por favor, introduzca una dirección IP', 'error');
            return;
        }
        
        const ipValidation = validateIPAddress(ip);
        
        if (!ipValidation.isValid) {
            showMessage('La dirección IP no es válida', 'error');
            return;
        }
        
        // Comprobar si la IP ya está bloqueada
        const blockedIPs = JSON.parse(localStorage.getItem('blockedIPs') || '[]');
        if (blockedIPs.includes(ip)) {
            showMessage('Esta IP ya está bloqueada', 'error');
            return;
        }
        
        // Bloquear la IP
        blockedIPs.push(ip);
        localStorage.setItem('blockedIPs', JSON.stringify(blockedIPs));
        
        // Registrar la acción
        logAccess(ip, 'failure', ipValidation.type); // Marcar como fallo ya que se está bloqueando
        
        showMessage('IP bloqueada exitosamente', 'success');
        ipToBlockInput.value = "";
        loadBlockedIPs();
        updateStats();
    }
    
    /**
     * Función para refrescar todos los datos
     */
    function refreshData() {
        loadBlockedIPs();
        loadAccessLogs(currentFilter);
        updateStats();
    }
    
    /**
     * Función para actualizar las estadísticas
     */
    function updateStats() {
        const blockedIPs = JSON.parse(localStorage.getItem('blockedIPs') || '[]');
        const temporarilyBlockedIPs = findTemporarilyBlockedIPs();
        const accessLogs = JSON.parse(localStorage.getItem('accessLogs') || '[]');
        
        totalBlockedElement.textContent = blockedIPs.length + temporarilyBlockedIPs.length;
        tempBlockedElement.textContent = temporarilyBlockedIPs.length;
        totalAccessElement.textContent = accessLogs.length;
    }
    
    /**
     * Función para cargar las IPs bloqueadas
     */
    function loadBlockedIPs() {
        ipsList.innerHTML = '';
        const blockedIPs = JSON.parse(localStorage.getItem('blockedIPs') || '[]');
        const temporarilyBlockedIPs = findTemporarilyBlockedIPs();
        
        if (blockedIPs.length === 0 && temporarilyBlockedIPs.length === 0) {
            noIpsMessage.style.display = 'block';
            return;
        } else {
            noIpsMessage.style.display = 'none';
        }
        
        // Mostrar IPs bloqueadas de forma permanente
        blockedIPs.forEach(ip => {
            const ipValidation = validateIPAddress(ip);
            const ipType = ipValidation.type;
            
            const row = document.createElement('tr');
            
            const ipCell = document.createElement('td');
            ipCell.textContent = ip;
            ipCell.className = ipType === 'ipv6' ? 'ipv6' : 'ipv4';
            
            const typeCell = document.createElement('td');
            typeCell.textContent = ipType === 'ipv6' ? 'IPv6' : 'IPv4';
            
            const statusCell = document.createElement('td');
            statusCell.textContent = 'Permanente';
            statusCell.style.color = '#e74a3b';
            
            const timeCell = document.createElement('td');
            timeCell.textContent = '—';
            
            const actionCell = document.createElement('td');
            const unblockBtn = document.createElement('button');
            unblockBtn.className = 'action-btn';
            unblockBtn.textContent = 'Desbloquear';
            unblockBtn.addEventListener('click', () => unblockIP(ip));
            actionCell.appendChild(unblockBtn);
            
            row.appendChild(ipCell);
            row.appendChild(typeCell);
            row.appendChild(statusCell);
            row.appendChild(timeCell);
            row.appendChild(actionCell);
            ipsList.appendChild(row);
        });
        
        // Mostrar IPs bloqueadas temporalmente
        temporarilyBlockedIPs.forEach(item => {
            const ipValidation = validateIPAddress(item.ip);
            const ipType = ipValidation.type;
            
            const row = document.createElement('tr');
            
            const ipCell = document.createElement('td');
            ipCell.textContent = item.ip;
            ipCell.className = ipType === 'ipv6' ? 'ipv6' : 'ipv4';
            
            const typeCell = document.createElement('td');
            typeCell.textContent = ipType === 'ipv6' ? 'IPv6' : 'IPv4';
            
            const statusCell = document.createElement('td');
            statusCell.textContent = 'Temporal';
            statusCell.style.color = '#ffc107';
            
            const timeCell = document.createElement('td');
            const remainingTime = Math.ceil((item.endTime - new Date().getTime()) / 1000);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            timeCell.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            const actionCell = document.createElement('td');
            const unblockBtn = document.createElement('button');
            unblockBtn.className = 'action-btn';
            unblockBtn.textContent = 'Desbloquear';
            unblockBtn.addEventListener('click', () => {
                localStorage.removeItem(`blockEndTime_${item.ip}`);
                localStorage.removeItem(`failedAttempts_${item.ip}`);
                showMessage('IP desbloqueada exitosamente', 'success');
                loadBlockedIPs();
                updateStats();
            });
            actionCell.appendChild(unblockBtn);
            
            row.appendChild(ipCell);
            row.appendChild(typeCell);
            row.appendChild(statusCell);
            row.appendChild(timeCell);
            row.appendChild(actionCell);
            ipsList.appendChild(row);
        });
    }
    
    /**
     * Función para cargar los registros de acceso según el filtro
     * @param {string} filter - Filtro de los registros (all/success/failure)
     */
    function loadAccessLogs(filter) {
        logsList.innerHTML = '';
        const accessLogs = JSON.parse(localStorage.getItem('accessLogs') || '[]');
        const filteredLogs = filter === 'all' 
            ? accessLogs 
            : accessLogs.filter(log => log.status === filter);
        
        if (filteredLogs.length === 0) {
            noLogsMessage.style.display = 'block';
            return;
        } else {
            noLogsMessage.style.display = 'none';
        }
        
        // Ordenar logs por fecha (más recientes primero)
        filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
        
        filteredLogs.forEach(log => {
            const row = document.createElement('tr');
            
            const ipCell = document.createElement('td');
            ipCell.textContent = log.ip;
            ipCell.className = log.ipType === 'ipv6' ? 'ipv6' : 'ipv4';
            
            const typeCell = document.createElement('td');
            typeCell.textContent = log.ipType === 'ipv6' ? 'IPv6' : 'IPv4';
            
            const dateCell = document.createElement('td');
            const date = new Date(log.timestamp);
            dateCell.textContent = date.toLocaleString();
            
            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = log.status === 'success' ? 'success-badge' : 'failure-badge';
            statusBadge.textContent = log.status === 'success' ? 'Exitoso' : 'Fallido';
            statusCell.appendChild(statusBadge);
            
            row.appendChild(ipCell);
            row.appendChild(typeCell);
            row.appendChild(dateCell);
            row.appendChild(statusCell);
            logsList.appendChild(row);
        });
    }
    
    /**
     * Función para desbloquear una IP específica
     * @param {string} ip - Dirección IP a desbloquear
     */
    function unblockIP(ip) {
        const blockedIPs = JSON.parse(localStorage.getItem('blockedIPs') || '[]');
        const index = blockedIPs.indexOf(ip);
        if (index !== -1) {
            blockedIPs.splice(index, 1);
            localStorage.setItem('blockedIPs', JSON.stringify(blockedIPs));
            showMessage('IP desbloqueada exitosamente', 'success');
            loadBlockedIPs();
            updateStats();
        }
    }
    
    /**
     * Función para desbloquear todas las IPs
     */
    function unblockAllIPs() {
        if (confirm('¿Está seguro que desea desbloquear todas las IPs?')) {
            localStorage.removeItem('blockedIPs');
            
            // Limpiar también bloqueos temporales
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('blockEndTime_') || key.startsWith('failedAttempts_')) {
                    localStorage.removeItem(key);
                }
            }
            
            showMessage('Todas las IPs han sido desbloqueadas', 'success');
            loadBlockedIPs();
            updateStats();
        }
    }
    
    /**
     * Función para limpiar el historial de accesos
     */
    function clearAccessLogs() {
        if (confirm('¿Está seguro que desea borrar todo el historial de accesos?')) {
            localStorage.removeItem('accessLogs');
            showMessage('Historial de accesos borrado correctamente', 'success');
            loadAccessLogs(currentFilter);
            updateStats();
        }
    }
    
    /**
     * Busca las IPs bloqueadas temporalmente
     * @return {Array} - Array de objetos con información de IPs bloqueadas temporalmente
     */
    function findTemporarilyBlockedIPs() {
        const temporarilyBlockedIPs = [];
        const now = new Date().getTime();
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('blockEndTime_')) {
                const ip = key.replace('blockEndTime_', '');
                const endTime = parseInt(localStorage.getItem(key));
                
                if (endTime > now) {
                    temporarilyBlockedIPs.push({
                        ip: ip,
                        endTime: endTime
                    });
                } else {
                    // Limpiar bloqueos expirados
                    localStorage.removeItem(key);
                    localStorage.removeItem(`failedAttempts_${ip}`);
                }
            }
        }
        
        return temporarilyBlockedIPs;
    }
    
    /**
     * Muestra un mensaje con estilo de éxito o error
     * @param {string} text - Texto del mensaje
     * @param {string} type - Tipo de mensaje (success/error)
     */
    function showMessage(text, type) {
        messageElement.textContent = text;
        messageElement.className = `message ${type}`;
        messageElement.style.display = 'block';
        
        // Ocultar el mensaje después de 5 segundos
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    }
    
    /**
     * Verifica intentos fallidos y bloquea temporalmente si es necesario
     * @param {string} ip - Dirección IP
     * @return {boolean} - Verdadero si la IP está bloqueada temporalmente
     */
    function checkFailedAttempts(ip) {
        const MAX_FAILED_ATTEMPTS = 3;
        const BLOCK_TIME = 15 * 60 * 1000; // 15 minutos en milisegundos
        
        const now = new Date().getTime();
        const blockEndTime = localStorage.getItem(`blockEndTime_${ip}`);
        
        // Verificar si la IP ya está bloqueada temporalmente
        if (blockEndTime && parseInt(blockEndTime) > now) {
            return true;
        }
        
        // Si había un bloqueo pero ya expiró, limpiamos
        if (blockEndTime) {
            localStorage.removeItem(`blockEndTime_${ip}`);
            localStorage.removeItem(`failedAttempts_${ip}`);
        }
        
        // Incrementar el contador de intentos fallidos
        const failedAttempts = localStorage.getItem(`failedAttempts_${ip}`)
            ? parseInt(localStorage.getItem(`failedAttempts_${ip}`)) + 1
            : 1;
        
        localStorage.setItem(`failedAttempts_${ip}`, failedAttempts.toString());
        
        // Bloquear temporalmente después de varios intentos fallidos
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            const endTime = now + BLOCK_TIME;
            localStorage.setItem(`blockEndTime_${ip}`, endTime.toString());
            return true;
        }
        
        return false;
    }
    
    /**
     * Función para simular accesos (para fines de demostración)
     */
    function simulateAccesses() {
        const ipv4Examples = [
            "192.168.1.1",
            "10.0.0.1",
            "172.16.0.1",
            "8.8.8.8",
            "1.1.1.1"
        ];
        
        const ipv6Examples = [
            "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
            "2001:0db8:85a3::8a2e:370:7334",
            "fe80::1ff:fe23:4567:890a",
            "::1",
            "2001:db8:3333:4444:5555:6666:7777:8888"
        ];
        
        // Simular algunos accesos exitosos
        for (let i = 0; i < 3; i++) {
            const useIPv6 = Math.random() > 0.5;
            const ip = useIPv6 
                ? ipv6Examples[Math.floor(Math.random() * ipv6Examples.length)]
                : ipv4Examples[Math.floor(Math.random() * ipv4Examples.length)];
                
            logAccess(ip, 'success', useIPv6 ? 'ipv6' : 'ipv4');
        }
        
        // Simular algunos accesos fallidos
        for (let i = 0; i < 2; i++) {
            const useIPv6 = Math.random() > 0.5;
            const ip = useIPv6 
                ? ipv6Examples[Math.floor(Math.random() * ipv6Examples.length)]
                : ipv4Examples[Math.floor(Math.random() * ipv4Examples.length)];
                
            logAccess(ip, 'failure', useIPv6 ? 'ipv6' : 'ipv4');
            
            // Simular bloqueo temporal para uno de los IPs
            if (i === 0) {
                localStorage.setItem(`failedAttempts_${ip}`, "3");
                const now = new Date().getTime();
                const endTime = now + (15 * 60 * 1000); // 15 minutos
                localStorage.setItem(`blockEndTime_${ip}`, endTime.toString());
            }
        }
        
        // Simular una IP bloqueada permanentemente
        const blockedIPs = JSON.parse(localStorage.getItem('blockedIPs') || '[]');
        if (blockedIPs.length === 0) {
            blockedIPs.push("192.168.1.100");
            localStorage.setItem('blockedIPs', JSON.stringify(blockedIPs));
        }
    }
    
    // Simular datos para demostración si no hay registros
    if (!localStorage.getItem('accessLogs') || JSON.parse(localStorage.getItem('accessLogs')).length === 0) {
        simulateAccesses();
    }
    
    // Iniciar intervalo para actualizar temporizadores de bloqueo cada segundo
    setInterval(() => {
        const panel = document.getElementById('blocked-ips');
        if (panel.classList.contains('active')) {
            loadBlockedIPs();
        }
    }, 1000);
});