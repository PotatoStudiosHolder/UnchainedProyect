const backButtons = document.querySelectorAll('.back-btn');
    backButtons.forEach(button => {  
        button.addEventListener('click', goBack);
    });
        
    function goBack() {  
        history.back();
    }