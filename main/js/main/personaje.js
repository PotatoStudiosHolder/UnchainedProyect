const backBtn = document.getElementById('backBtn');
backBtn.addEventListener('click', goBack);

function goBack() {
    history.back();
}