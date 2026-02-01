import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { db } from "./modules/firebase-config.js";
import { getRiotVersion, fetchChangelogs } from "./modules/data-service.js";
import * as UI from "./modules/ui-controller.js";

let currentLolPatch = '';

async function initSystem() {
    currentLolPatch = await getRiotVersion();
    const patchBase = currentLolPatch.split('.').slice(0, 2).join('.');
    
    console.log(`Sistema iniciado. Versão LoL: ${currentLolPatch}`);

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
                const laneHTML = champions.map(champ => UI.generateCardHTML(champ, currentLolPatch)).join('');
                gridContainer.innerHTML = laneHTML;
            }
        }
        UI.applyFilters();
    });
}

window.filterLane = function(laneId, btnElement) {
    UI.state.currentLane = laneId;
    UI.updateButtonActiveState(btnElement, '.filter-group button[onclick*="filterLane"]');
    UI.applyFilters();
}

window.filterStatus = function(statusId, btnElement) {
    UI.state.currentStatus = statusId;
    UI.updateButtonActiveState(btnElement, '.filter-group button[onclick*="filterStatus"]');
    UI.applyFilters();
}

window.toggleSection = UI.toggleSection;

window.closeModal = function() {
    document.getElementById('changelogModal').style.display = 'none';
}

document.getElementById('searchInput').addEventListener('keyup', function(e) {
    UI.state.currentSearch = e.target.value.toUpperCase();
    UI.applyFilters();
});

document.addEventListener('click', async function(e) {
    const card = e.target.closest('.champ-card');
    
    if (card) {
        const name = card.getAttribute('data-name');
        const imgUrl = card.querySelector('.champ-img').src;
        await openModalLogic(name, imgUrl);
    }
    
    if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('close-modal')) {
        window.closeModal();
    }
});

async function openModalLogic(champName, imgUrl) {
    const modal = document.getElementById('changelogModal');
    const modalContent = modal.querySelector('.modal-content');
    const listContainer = document.getElementById('modalList');
    
    modalContent.classList.remove('animate-entry');
    void modalContent.offsetWidth; 
    
    document.getElementById('modalTitle').innerText = champName;
    document.getElementById('modalChampImg').src = imgUrl;
    
    modal.style.display = 'flex';
    modalContent.classList.add('animate-entry');
    
    listContainer.innerHTML = `<div style="padding:20px; text-align:center; color:#888;">Fetching data...</div>`;
    const logs = await fetchChangelogs(champName);
    renderLogs(logs, listContainer);
}

function renderLogs(logs, container) {
    if (!logs || logs === "empty") {
        container.innerHTML = `
            <div class="nunu-message">
                <img src="assets/img/gifs/nunu.png" alt="Nunu" class="nunu-icon">
                <p>No logs found yet.<br>Wait for updates!</p>
            </div>`;
        return;
    }

    const logsArray = Array.isArray(logs) ? logs : Object.values(logs);
    let fullHtml = '';

    logsArray.forEach(log => {
        let changesHtml = '';
        if(log.changes) {
            log.changes.forEach(change => changesHtml += `<li>${change}</li>`);
        }
        fullHtml += `
            <div class="log-entry">
                <div class="log-meta">
                    <span>DATE: ${log.date}</span>
                    <span>V.${log.version || '---'}</span>
                </div>
                <ul class="log-list">${changesHtml}</ul>
            </div>`;
    });
    container.innerHTML = fullHtml;
}


document.addEventListener('DOMContentLoaded', initSystem);