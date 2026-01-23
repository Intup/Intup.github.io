let currentLane = 'all';
let currentStatus = 'all';
let currentSearch = '';
let changelogData = {};

function toggleSection(headerElement) {
    const section = headerElement.parentElement;
    section.classList.toggle('collapsed');
}

function filterLane(laneId, btnElement) {
    currentLane = laneId;
    updateButtonActiveState(btnElement, '.filter-group button[onclick*="filterLane"]');
    applyFilters();
}


function filterStatus(statusId, btnElement) {
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

function filterChamps() {
    var input = document.getElementById('searchInput');
    var filter = input.value.toUpperCase();
    var cards = document.getElementsByClassName('champ-card');

    for (i = 0; i < cards.length; i++) {
        var name = cards[i].getAttribute('data-name');
        if (name.toUpperCase().indexOf(filter) > -1) {
            cards[i].style.display = "";
        } else {
            cards[i].style.display = "none";
        }
    }
}

async function fetchStatus() {
    try {
        //console.log("1.  Riot...");
        const riotResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        
        if (!riotResponse.ok) throw new Error(`Erro Riot: ${riotResponse.status}`);
        
        const riotVersions = await riotResponse.json();
        const currentLolPatch = riotVersions[0]; 
        //console.log("v lol:", currentLolPatch);

        const patchBase = currentLolPatch.split('.').slice(0, 2).join('.'); 

        //console.log("status.json...");
       
        const myResponse = await fetch('assets/data/status.json');

        if (!myResponse.ok) throw new Error(`Erro Arquivo Local (404 = Não achou o arquivo): ${myResponse.status}`);

        const myData = await myResponse.json();
        //console.log("data:", myData);

        const patchList = document.getElementById('patch-list-container');
        patchList.innerHTML = ''; 

        myData.forEach(item => {
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
                </div>
            `;
            patchList.insertAdjacentHTML('beforeend', itemHTML);
        });

    } catch (error) {
        console.error('Crash:', error);
        
        let msgErro = "Status Offline";
        if (error.message.includes("404")) msgErro = "No found status.json";
        if (error.message.includes("NetworkError")) msgErro = "live ser?";

        document.getElementById('patch-list-container').innerHTML = `<div style="padding:10px; color:red; font-size:0.8rem">${msgErro}</div>`;
    }
}
document.addEventListener('DOMContentLoaded', fetchStatus);

async function loadChangelogs() {
    try {
        const response = await fetch('assets/data/changelogs.json');
        if (!response.ok) throw new Error("Json não encontrado");
        changelogData = await response.json();
    } catch (error) {
        console.error("Error changelogs:", error);
    }
}

function openModal(champName, imgUrl) {
    const modal = document.getElementById('changelogModal');
    const title = document.getElementById('modalTitle');
    const img = document.getElementById('modalChampImg');
    const listContainer = document.getElementById('modalList');
    title.innerText = champName;
    img.src = imgUrl;
    listContainer.innerHTML = '';

    if (changelogData[champName]) {
        changelogData[champName].forEach(log => {
            let changesHtml = '';
            log.changes.forEach(change => {
                changesHtml += `<li>${change}</li>`;
            });

            const entryHtml = `
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
            listContainer.insertAdjacentHTML('beforeend', entryHtml);
        });
    } else {
       listContainer.innerHTML = `
            <div class="nunu-message">
                <img src="assets/nunu.png" alt="Nunu" class="nunu-icon">
                <p>Whoops, looks like Nunu ate this champ’s logs.<br>Don’t worry!! The info will be here soon!</p>
            </div>
        `;
    }
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('changelogModal').style.display = 'none';
}

document.getElementById('changelogModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});


document.addEventListener('DOMContentLoaded', () => {
    fetchStatus();     
    loadChangelogs();   
    const cards = document.querySelectorAll('.champ-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const name = card.getAttribute('data-name');
            const img = card.querySelector('.champ-img').src;
            openModal(name, img);
        });
    });
});

async function renderChampions() {
    try {
        const response = await fetch('assets/data/champions.json');
        const data = await response.json();
 
        const riotResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        if (!riotResponse.ok) throw new Error(`Erro Riot: ${riotResponse.status}`);
        
        const riotVersions = await riotResponse.json();
        const currentLolPatch = riotVersions[0]; 

        for (const [lane, champions] of Object.entries(data)) {
            const gridContainer = document.getElementById(`grid-${lane}`);
            
            //XD 
            champions.sort((a, b) => a.name.localeCompare(b.name));

            if (gridContainer) {
                const laneHTML = champions.map(champ => {
                    let badgeHTML = '';
                    //if (champ.status === 'hot') badgeHTML = '<span class="badge hot">HOT</span>';
                    if (champ.status === 'new') badgeHTML = '<span class="badge new">NEW</span>';
                    if (champ.status === 'upd') badgeHTML = '<span class="badge upd">UPDATED</span>';
                    if (champ.status === 'soon') badgeHTML = '<span class="badge soon">SOON</span>';
                    if (champ.status === 'Outdated') badgeHTML = '<span class="badge hot">Outdated</span>';

                    return `
                        <div class="champ-card" data-name="${champ.name}" data-status="${champ.status || 'normal'}">
                            ${badgeHTML}
                            <img src="https://ddragon.leagueoflegends.com/cdn/${currentLolPatch}/img/champion/${champ.name}.png" class="champ-img" alt="${champ.name}">
                            <div class="champ-name">${champ.name}</div>
                        </div>
                    `;
                }).join('');
 
                gridContainer.innerHTML = laneHTML;
            }
        }
        
    } catch (error) {
        console.error("Error loading champions:", error);
    }
}
 
document.addEventListener('DOMContentLoaded', async () => {

    await renderChampions();
    fetchStatus();
    loadChangelogs();

    const cards = document.querySelectorAll('.champ-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const name = card.getAttribute('data-name');
            const img = card.querySelector('.champ-img').src;
            openModal(name, img);
        });
    });
});