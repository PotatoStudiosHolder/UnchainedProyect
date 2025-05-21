document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Desactivar todas las pestañas
            tabs.forEach(t => t.classList.remove('active'));

            // Activar esta pestaña            
            this.classList.add('active');

            // Obtener el ID de la categoría
            const categoryId = this.getAttribute('data-category');

            // Ocultar todos los contenidos
            document.querySelectorAll('.category-content').forEach(content => {
                content.classList.remove('active');
            });
            // Mostrar el contenido correspondiente
            document.getElementById(categoryId).classList.add('active');
        });
    });
});

const backBtn = document.getElementById('backBtn');
backBtn.addEventListener('click', goBack);

function goBack() {
    history.back();
}