// Función para cambiar entre pestañas
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Remover clase active de todos los botones y contenido
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Añadir clase active al botón clickeado y su contenido
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Evento para el botón de volver
const backBtn = document.getElementById('backBtn');
backBtn.addEventListener('click', () => {
    history.back();
});


// Evento para el botón de información
const infoBtn = document.getElementById('infoBtn');
infoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Información adicional sobre habilidades y nociones disponible pronto.');
});