import { ref, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { db } from "./firebase-config.js";

const changelogCache = {};

export async function getRiotVersion() {
    try {
        const riotResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const riotVersions = await riotResponse.json();
        return riotVersions[0];
    } catch (e) {
        console.error("Erro ao buscar versão Riot", e);
        return "0.0.0";
    }
}

export async function fetchChangelogs(champName) {
   
    if (changelogCache[champName]) {
        console.log(`[Cache] Dados recuperados para ${champName}`);
        return changelogCache[champName];
    }
 
    console.log(`[Firebase] Baixando dados para ${champName}...`);
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, `changelogs/${champName}`));
        if (snapshot.exists()) {
            const data = snapshot.val();
            changelogCache[champName] = data;
            return data;
        } else {
            changelogCache[champName] = "empty";
            return "empty";
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}