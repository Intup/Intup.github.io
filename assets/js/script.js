let currentLane = 'all';
let currentStatus = 'all';
let currentSearch = '';

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
