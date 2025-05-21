function switchCategory(categoryId) {          
    // Ocultar todas las categorías
    const categories = document.querySelectorAll('.category-content');
    categories.forEach(category => {
        category.classList.remove('active');
    });

    // Mostrar la categoría seleccionada
    document.getElementById(categoryId).classList.add('active');
    
    // Cambiar la pestaña activa
    const tabs = document.querySelectorAll('.category-tab');
    
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });

    // Encontrar y activar la pestaña correspondiente
    const clickedTab = Array.from(tabs).find(tab => 
        tab.textContent.toLowerCase().includes(categoryId) || 
        (categoryId === 'utiles' && tab.textContent.toLowerCase().includes('útiles'))
    );
     
    if (clickedTab) {
    
        clickedTab.classList.add('active');
    }
}

const backBtn = document.getElementById('backBtn');
backBtn.addEventListener('click', goBack);

function goBack() {
    history.back();
}