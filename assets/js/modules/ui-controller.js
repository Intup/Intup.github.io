export const state = {
    currentLane: 'all',
    currentStatus: 'all',
    currentSearch: ''
};
 
export function applyFilters() {
    const sections = document.querySelectorAll('.role-section');
    
    sections.forEach(section => {
        const sectionId = section.id;
        const cards = section.querySelectorAll('.champ-card');
        let visibleCardsCount = 0;

        const laneMatch = (state.currentLane === 'all' || state.currentLane === sectionId);

        if (!laneMatch) {
            section.style.display = 'none';
            return; 
        }
 
        cards.forEach(card => {
            const name = card.getAttribute('data-name').toUpperCase();
            const status = card.getAttribute('data-status');  
            const searchMatch = name.includes(state.currentSearch);
            const statusMatch = (state.currentStatus === 'all' || status === state.currentStatus);

            if (searchMatch && statusMatch) {
                card.style.display = ''; 
                visibleCardsCount++;
            } else {
                card.style.display = 'none'; 
            }
        });

        section.style.display = visibleCardsCount > 0 ? '' : 'none';
    });
}

export function updateButtonActiveState(clickedBtn, selector) {
    const buttons = document.querySelectorAll(selector);
    buttons.forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');
}
 
export function generateCardHTML(champ, currentLolPatch) {
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
}
 
export function toggleSection(headerElement) {
    const section = headerElement.parentElement;
    section.classList.toggle('collapsed');
}