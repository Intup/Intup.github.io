import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDB8IvZfa59Qvg_wtB1k90ubdoDtPWq5BA",
  authDomain: "baseaio.firebaseapp.com",
  databaseURL: "https://baseaio.firebaseio.com",
  projectId: "baseaio",
  storageBucket: "baseaio.firebasestorage.app",
  messagingSenderId: "470723267691",
  appId: "1:470723267691:web:9ca87d8836342fc41b752e",
  measurementId: "G-W3W0KGHJLS"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentLane = 'all';
let currentStatus = 'all';
let currentSearch = '';
// let changelogData = {};
const changelogCache = {};
let currentLolPatch = '';

window.toggleSection = function(headerElement) {
    const section = headerElement.parentElement;
    section.classList.toggle('collapsed');
}

window.filterLane = function(laneId, btnElement) {
    currentLane = laneId;
    updateButtonActiveState(btnElement, '.filter-group button[onclick*="filterLane"]');
    applyFilters();
}

window.filterStatus = function(statusId, btnElement) {
    currentStatus = statusId;
    updateButtonActiveState(btnElement, '.filter-group button[onclick*="filterStatus"]');
    applyFilters();
}

document.getElementById('searchInput').addEventListener('keyup', function(e) {
    currentSearch = e.target.value.toUpperCase();
    applyFilters();
});

function applyFilters() {
    const sections = document.querySelectorAll('.role-section');
    
    sections.forEach(section => {
        const sectionId = section.id;
        const cards = section.querySelectorAll('.champ-card');
        let visibleCardsCount = 0;

        const laneMatch = (currentLane === 'all' || currentLane === sectionId);

        if (!laneMatch) {
            section.style.display = 'none';
            return; 
        }
 
        cards.forEach(card => {
            const name = card.getAttribute('data-name').toUpperCase();
            const status = card.getAttribute('data-status');  
            const searchMatch = name.includes(currentSearch);
            const statusMatch = (currentStatus === 'all' || status === currentStatus);

            if (searchMatch && statusMatch) {
                card.style.display = ''; 
                visibleCardsCount++;
            } else {
                card.style.display = 'none'; 
            }
        });

        if (visibleCardsCount > 0) {
            section.style.display = '';
        } else {
            section.style.display = 'none';
        }
    });
}

function updateButtonActiveState(clickedBtn, selector) {
    const buttons = document.querySelectorAll(selector);
    buttons.forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');
}

async function initSystem() {
    try {
     
        const riotResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const riotVersions = await riotResponse.json();
        currentLolPatch = riotVersions[0]; 
        const patchBase = currentLolPatch.split('.').slice(0, 2).join('.'); 

        
        const statusRef = ref(db, 'status');
        onValue(statusRef, (snapshot) => {
        
             const data = snapshot.val();
             if (!data) return;
             const patchList = document.getElementById('patch-list-container');
             patchList.innerHTML = ''; 
             data.forEach(item => {
               
                const isCompatible = item.version.startsWith(patchBase);
                let statusText = isCompatible ? "SUPPORTED" : "UPDATING";
                let statusClass = isCompatible ? "supported" : "outdated";
                const itemHTML = `
                    <div class="patch-item">
                        <div class="patch-info">
                            <span class="version" style="${!isCompatible ? 'color: #ef4444' : ''}">${item.version}</span>
                            <span class="date">${item.date}</span>
                        </div>
                        <span class="status-tag ${statusClass}">${statusText}</span>
                    </div>`;
                patchList.insertAdjacentHTML('beforeend', itemHTML);
             });
        });

        const champsRef = ref(db, 'champions');
        onValue(champsRef, (snapshot) => {
           
             const data = snapshot.val();
             if (!data) return;
             for (const [lane, champions] of Object.entries(data)) {
                 const gridContainer = document.getElementById(`grid-${lane}`);
                 if (gridContainer && Array.isArray(champions)) {
                     champions.sort((a, b) => a.name.localeCompare(b.name));
                     const laneHTML = champions.map(champ => {
                        let badgeHTML = '';
                        if (champ.status === 'new') badgeHTML = '<span class="badge new">NEW</span>';
                        if (champ.status === 'upd') badgeHTML = '<span class="badge upd">UPDATED</span>';
                        if (champ.status === 'soon') badgeHTML = '<span class="badge soon">SOON</span>';
                        if (champ.status === 'Outdated') badgeHTML = '<span class="badge hot">Outdated</span>';
                        return `
                            <div class="champ-card" data-name="${champ.name}" data-status="${champ.status || 'normal'}">
                                ${badgeHTML}
                                <div class="img-container spin-target">
                                    <img src="https://ddragon.leagueoflegends.com/cdn/${currentLolPatch}/img/champion/${champ.name}.png" class="champ-img" alt="${champ.name}">
                                </div>
                                <div class="champ-name">${champ.name}</div>
                            </div>
                        `;
                     }).join('');
                     gridContainer.innerHTML = laneHTML;
                 }
             }
             applyFilters();
        });

    } catch (error) {
        console.error("Erro init:", error);
    }
}

window.openModal = async function(champName, imgUrl) {
    const modal = document.getElementById('changelogModal');
    const modalContent = modal.querySelector('.modal-content');
    const title = document.getElementById('modalTitle');
    const img = document.getElementById('modalChampImg');
    const listContainer = document.getElementById('modalList');

 
    modalContent.classList.remove('animate-entry');
    void modalContent.offsetWidth; 
    
    title.innerText = champName;
    img.src = imgUrl;
    
    modal.style.display = 'flex';
    modalContent.classList.add('animate-entry');
 
    if (changelogCache[champName]) {
        console.log(`Dados de ${champName} carregados do CACHE (0 KB)`);
        renderLogsToModal(changelogCache[champName], listContainer);  
        return;  
    }
 
    console.log(`Baixando dados de ${champName} do Firebase...`);
    listContainer.innerHTML = `<div style="padding:20px; text-align:center; color:#888;">Fetching data from server...</div>`;

    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `changelogs/${champName}`));
        
        listContainer.innerHTML = ''; 

        if (snapshot.exists()) {
            const logs = snapshot.val();
  
            changelogCache[champName] = logs;

            renderLogsToModal(logs, listContainer);
        } else {
             listContainer.innerHTML = `
                <div class="nunu-message">
                    <img src="assets/nunu.png" alt="Nunu" class="nunu-icon">
                    <p>No logs found for ${champName} yet.<br>Wait for updates!</p>
                </div>
            `;
             
            changelogCache[champName] = "empty"; 
        }

    } catch (error) {
        console.error(error);
        listContainer.innerHTML = `<div style="color:red; padding:20px;">Error loading data.</div>`;
    }
}

window.closeModal = function() {
    const modal = document.getElementById('changelogModal');
    modal.style.display = 'none';
}

document.addEventListener('click', function(e) {
    const card = e.target.closest('.champ-card');
    if (card) {
        const name = card.getAttribute('data-name');
        const img = card.querySelector('.champ-img').src;
        window.openModal(name, img);
    }
    
    if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('close-modal')) {
        window.closeModal();
    }
});

function renderLogsToModal(logs, container) {
    if (logs === "empty") {
        container.innerHTML = `
            <div class="nunu-message">
                <img src="assets/nunu.png" alt="Nunu" class="nunu-icon">
                <p>No logs found for this champ yet.<br>Wait for updates!</p>
            </div>`;
        return;
    }

    const logsArray = Array.isArray(logs) ? logs : Object.values(logs);
 
    let fullHtml = '';

    logsArray.forEach(log => {
        let changesHtml = '';
        if(log.changes) {
            log.changes.forEach(change => {
                changesHtml += `<li>${change}</li>`;
            });
        }

        fullHtml += `
            <div class="log-entry">
                <div class="log-meta">
                    <span>DATE: ${log.date}</span>
                    <span>V.${log.version || '---'}</span>
                </div>
                <ul class="log-list">
                    ${changesHtml}
                </ul>
            </div>
        `;
    });
    
    container.innerHTML = fullHtml;
}

document.addEventListener('DOMContentLoaded', initSystem);