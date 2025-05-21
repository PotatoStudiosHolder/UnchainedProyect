// Variables globales
let characters = [];
let selectedCharacterId = null;
const STORAGE_KEY = 'gm_combat_characters';        

// DOM Elements
const addCharacterBtn = document.getElementById('addCharacterBtn');
const deleteCharacterBtn = document.getElementById('deleteCharacterBtn');
const backBtn = document.getElementById('backBtn');
const charactersContainer = document.getElementById('charactersContainer');
const addCharacterModal = document.getElementById('addCharacterModal');
const addCharacterForm = document.getElementById('addCharacterForm');
const closeModalBtn = document.querySelector('.close');

// Cargar datos del localStorage al iniciar
document.addEventListener('DOMContentLoaded', loadFromLocalStorage);

// Event Listeners
addCharacterBtn.addEventListener('click', openAddCharacterModal);        
deleteCharacterBtn.addEventListener('click', deleteSelectedCharacter);
backBtn.addEventListener('click', goBack);
closeModalBtn.addEventListener('click', closeAddCharacterModal);
addCharacterForm.addEventListener('submit', addCharacter);

window.addEventListener('click', (e) => {
    if (e.target === addCharacterModal) {
        closeAddCharacterModal();
    }
});



// Funciones de localStorage
function saveToLocalStorage() {
    const data = {
        characters,
        selectedCharacterId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}



function loadFromLocalStorage() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        const data = JSON.parse(savedData);
        characters = data.characters || [];
        selectedCharacterId = data.selectedCharacterId;
        renderCharacters();
    }
}



// Funciones de la interfaz
function openAddCharacterModal() {
    addCharacterModal.style.display = 'block';
}


function closeAddCharacterModal() {
    addCharacterModal.style.display = 'none';
    addCharacterForm.reset();
}


function goBack() {
    history.back();
}

function addCharacter(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const lastName = document.getElementById('lastName').value;
    const gas = parseInt(document.getElementById('gas').value);
    const hojas = parseInt(document.getElementById('hojas').value);

    const character = {
        id: Date.now(),
        name,
        lastName,
        gas,
        gasMax: gas,
        hojas: 0,
        hojasMax: hojas,
        experiencia: 0,
        attributes: {
            velocidad: 0,
            resistencia: 0,
            agilidad: 0,
            fuerza: 0,
            eficacia: 0,
            tolerancia: 0
        }
    };


    characters.push(character);
    renderCharacters();    
    saveToLocalStorage();
    closeAddCharacterModal();  
}



function renderCharacters() {
    charactersContainer.innerHTML = '';
    characters.forEach(character => {
        const characterCard = document.createElement('div');
        characterCard.className = `character-card ${character.id === selectedCharacterId ? 'card-selected' : ''}`;
        characterCard.dataset.id = character.id;        
       
        characterCard.innerHTML = `
                    <h3>${character.name} ${character.lastName}</h3>
                    
                    <div class="gas-container">
                        <div class="gas-label">Gas:</div>
                        <input type="number" class="gas-input" value="${character.gas}" min="0" max="${character.gasMax}" onchange="updateGas(${character.id}, this.value)">
                        <div>/</div>
                        <input type="number" class="gas-max" value="${character.gasMax}" readonly>
                    </div>
                    
                    <div class="hojas-container">
                        <div class="hojas-label">Hojas:</div>
                        <input type="number" class="hojas-input" value="${character.hojas}" min="0" max="${character.hojasMax}" onchange="updateHojas(${character.id}, this.value)">
                        <div>/</div>
                        <input type="number" class="hojas-input" value="${character.hojasMax}" min="0" max="8" onchange="updateHojasMax(${character.id}, this.value)">
                    </div>
                    
                    <div class="rango-container">
                        <div class="attribute-label">XP Rango</div>
                        <input type="number" class="attribute-input" value="${character.experiencia}" min="0" onchange="updateXP(${character.id}, this.value)">
                    </div>
                    
                    <div class="attributes-container">
                        <div class="attribute-item">
                            <div class="attribute-label">Velocidad</div>
                            <input type="number" class="attribute-input" value="${character.attributes.velocidad}" min="0" onchange="updateAttribute(${character.id}, 'velocidad', this.value)">
                        </div>
                        <div class="attribute-item">
                            <div class="attribute-label">Resistencia</div>
                            <input type="number" class="attribute-input" value="${character.attributes.resistencia}" min="0" onchange="updateAttribute(${character.id}, 'resistencia', this.value)">
                        </div>
                        <div class="attribute-item">
                            <div class="attribute-label">Agilidad</div>
                            <input type="number" class="attribute-input" value="${character.attributes.agilidad}" min="0" onchange="updateAttribute(${character.id}, 'agilidad', this.value)">
                        </div>
                        <div class="attribute-item">
                            <div class="attribute-label">Fuerza</div>
                            <input type="number" class="attribute-input" value="${character.attributes.fuerza}" min="0" onchange="updateAttribute(${character.id}, 'fuerza', this.value)">
                        </div>
                        <div class="attribute-item">
                            <div class="attribute-label">Eficacia</div>
                            <input type="number" class="attribute-input" value="${character.attributes.eficacia}" min="0" onchange="updateAttribute(${character.id}, 'eficacia', this.value)">
                        </div>
                        <div class="attribute-item">
                            <div class="attribute-label">Tolerancia</div>
                            <input type="number" class="attribute-input" value="${character.attributes.tolerancia}" min="0" onchange="updateAttribute(${character.id}, 'tolerancia', this.value)">
                        </div>
                    </div>
                `;
                characterCard.addEventListener('click', function() {

                    selectCharacter(character.id);
                });

                charactersContainer.appendChild(characterCard);
            });
        }

        function selectCharacter(id) {        
            selectedCharacterId = id;
            renderCharacters();
            saveToLocalStorage();
        }

        function deleteSelectedCharacter() {
            if (selectedCharacterId === null) {
                alert('Selecciona un personaje para eliminar');
                return;
            }

            characters = characters.filter(character => character.id !== selectedCharacterId);
            selectedCharacterId = null;
            renderCharacters();
            saveToLocalStorage();
        }

        function updateGas(id, value) {
            const character = characters.find(c => c.id === id);
            if (character) {
                character.gas = parseInt(value);
                renderCharacters();
                saveToLocalStorage();
            }
        }

        function updateHojas(id, value) {
            const character = characters.find(c => c.id === id);
            if (character) {
                character.hojas = parseInt(value);
                renderCharacters();
                saveToLocalStorage();
            }
        }

        function updateHojasMax(id, value) {
            const character = characters.find(c => c.id === id);
            if (character) {
                character.hojasMax = parseInt(value) > 8 ? 8 : parseInt(value);
                renderCharacters();
                saveToLocalStorage();
            }
        }

        function updateXP(id, value) {
            const character = characters.find(c => c.id === id);
            if (character) {
                character.experiencia = parseInt(value);
                renderCharacters();
                saveToLocalStorage();
            }
        }

        function updateAttribute(id, attributeName, value) {
            const character = characters.find(c => c.id === id);
            if (character) {
                character.attributes[attributeName] = parseInt(value);
                renderCharacters();
                saveToLocalStorage();
            }
        }