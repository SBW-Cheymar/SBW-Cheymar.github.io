// --- Configuration des championnats ---
const championnats = [
  { id: 'carousel-10', nbEquipes: 10, prefixe: 'Equipe' },
  { id: 'carousel-12', nbEquipes: 12, prefixe: 'Equipe' },
  { id: 'carousel-14', nbEquipes: 14, prefixe: 'Team' },
  { id: 'carousel-16', nbEquipes: 16, prefixe: 'E' }
];

// --- Fonction pour extraire l'index de l'équipe ---
function getTeamIndex(teamName) {
  const parts = teamName.split(' ');
  if (parts.length > 1) {
    const indexStr = parts[parts.length - 1];
    const index = parseInt(indexStr);
    if (!isNaN(index)) return index;
  }
  return 9999; 
}

// --- NOUVEL ALGORITHME : Génération du Calendrier Équilibré ---
function generateBalancedCalendar(nbEquipes, prefixe) {
  if (nbEquipes % 2 !== 0) {
    throw new Error("L'algorithme requiert un nombre pair d'équipes.");
  }

  const totalJournees = nbEquipes - 1;
  const half = nbEquipes / 2;
  const equipes = Array.from({ length: nbEquipes }, (_, i) => i + 1);
  const getName = (index) => `${prefixe} ${index}`;

  // 1. Définition des paires de terrain
  const equipePaireMap = {}; 
  for (let i = 1; i <= nbEquipes; i += 2) {
    const a = getName(i);
    const b = getName(i + 1);
    equipePaireMap[a] = b;
    equipePaireMap[b] = a;
  }

  const joursAller = [];
  
  // Tableau de rotation des équipes [1, 2, ..., N-1, N]
  // La méthode alterne les appariements pour mieux gérer les contraintes
  let teams = equipes.slice(); 

  for (let journeeIndex = 0; journeeIndex < totalJournees; journeeIndex++) {
    const matchs = [];
    const homeTeamsInCurrentJour = new Set();

    // On utilise l'index de la rotation pour les appariements
    for (let i = 0; i < half; i++) {
        // Appariement selon la méthode standard pour N équipes
        // Équipe du haut de la liste vs Équipe du bas
        const t1Index = teams[i];
        const t2Index = teams[nbEquipes - 1 - i];
        
        const t1 = getName(t1Index);
        const t2 = getName(t2Index);
        
        let home, away;

        // 2. Attribution D/E IDEALE (Alternance stricte)
        // Équipe impaire (starts D) est D aux jours pairs (0, 2, 4...)
        // Équipe paire (starts E) est D aux jours impairs (1, 3, 5...)
        const startsHome = t1Index % 2 !== 0;
        const t1ShouldBeHome = (startsHome && journeeIndex % 2 === 0) || (!startsHome && journeeIndex % 2 === 1);
        
        if (t1ShouldBeHome) {
            home = t1;
            away = t2;
        } else {
            home = t2;
            away = t1;
        }

        // 3. VÉRIFICATION ET CORRECTION DE LA CONTRAINTE DE TERRAIN
        let mustSwap = false;
        
        // Conflit avec la paire de l'équipe 'home'
        if (homeTeamsInCurrentJour.has(equipePaireMap[home])) {
            mustSwap = true;
        }

        // Si swap nécessaire
        if (mustSwap) {
            const originalHome = home;
            home = away;
            away = originalHome; 
            
            // RE-CHECK : Le swap doit résoudre le conflit.
            if (homeTeamsInCurrentJour.has(equipePaireMap[home])) {
                throw new Error("Conflit insoluble: La contrainte de terrain/paires ne peut être respectée.");
            }
        }
        
        // 4. Enregistrement
        homeTeamsInCurrentJour.add(home);
        matchs.push({ home, away });
    }
    
    joursAller.push({ type: "Aller", journee: journeeIndex + 1, matchs });

    // Rotation des équipes : Rotation générale de la liste
    const first = teams.shift(); 
    teams.push(first);
  }

  // 5. Génération de la phase Retour (Inversion pure)
  const joursRetour = joursAller.map(j => ({
    type: "Retour",
    journee: j.journee + totalJournees,
    matchs: j.matchs.map(m => ({ home: m.away, away: m.home }))
  }));

  return [...joursAller, ...joursRetour];
}

// --- Le reste du code est inchangé et utilise la nouvelle fonction ---

function generateCalendrier(nbEquipes, prefixe) {
  return generateBalancedCalendar(nbEquipes, prefixe);
}

function afficherJournee(container, calendrier, index) {
  const title = container.querySelector('.journee-title');
  const content = container.querySelector('.carousel-content');
  const data = calendrier[index];

  content.innerHTML = '';
  title.textContent = `Journée ${data.journee} (${data.type})`;

  const table = document.createElement('table');
  table.className = 'table table-striped';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Domicile</th>
        <th>Extérieur</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');
  data.matchs.forEach(match => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><i class="fas fa-house-chimney"></i> ${match.home}</td>
      <td><i class="fas fa-location-dot"></i> ${match.away}</td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  content.appendChild(table);
}

// --- Initialisation des carrousels ---
championnats.forEach(champ => {
  const container = document.getElementById(champ.id);
  const prevBtn = container.querySelector('.prev-button');
  const nextBtn = container.querySelector('.next-button');

  try {
      // Utilisation de la nouvelle fonction generateBalancedCalendar
      const calendrier = generateCalendrier(champ.nbEquipes, champ.prefixe);
      
      let currentIndex = 0;
      afficherJournee(container, calendrier, currentIndex);

      prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
          currentIndex--;
          afficherJournee(container, calendrier, currentIndex);
        }
      });

      nextBtn.addEventListener('click', () => {
        if (currentIndex < calendrier.length - 1) {
          currentIndex++;
          afficherJournee(container, calendrier, currentIndex);
        }
      });
  } catch(e) {
      container.querySelector('.carousel-content').innerHTML = `<p style="color:red;font-weight:bold;">Erreur: Impossible de générer le calendrier (${e.message})</p>`;
  }
});

// === TEST AUTOMATIQUE (Mis à jour pour utiliser la nouvelle fonction) ===
document.getElementById('test-button').addEventListener('click', () => {
  const result = document.getElementById('test-result');
  result.innerHTML = '';

  [
    { nb: 10, prefixe: 'Equipe' },
    { nb: 12, prefixe: 'Equipe' },
    { nb: 14, prefixe: 'Team' },
    { nb: 16, prefixe: 'E' }
  ].forEach(champ => {
    let calendrier = [];
    let generationErreur = false;
    let errorMessage = '';
    try {
        calendrier = generateCalendrier(champ.nb, champ.prefixe);
    } catch (e) {
        generationErreur = true;
        errorMessage = e.message;
    }
    
    if (generationErreur) {
        result.innerHTML += `<h3>Résultats pour ${champ.prefixe} (${champ.nb} équipes)</h3>`;
        result.innerHTML += `<p style="color:red;font-weight:bold;">❌ Échec de la génération : ${errorMessage}</p>`;
        result.innerHTML += `<p style="color:red;font-weight:bold;">⚠️ Problèmes détectés pour ${champ.prefixe}.</p>`;
        return;
    }


    let doublonErreur = false;
    let streakErreur = false; 
    let journeesErreur = false;
    let paireErreur = false;

    const historique = {};
    for (let i = 1; i <= champ.nb; i++) {
      historique[`${champ.prefixe} ${i}`] = [];
    }

    // Fonction getPaires réintégrée dans le test pour être autonome
    const getPairesTest = (nbEquipes, prefixe) => {
        const paires = [];
        for (let i = 1; i <= nbEquipes; i += 2) {
            if (i + 1 <= nbEquipes) { 
                paires.push({ a: `${prefixe} ${i}`, b: `${prefixe} ${i + 1}` });
            }
        }
        return paires;
    };


    calendrier.forEach(journee => {
      const matchsDuJour = new Set();
      journee.matchs.forEach(match => {
        // 1. Test Doublon par Journée
        if (matchsDuJour.has(match.home) || matchsDuJour.has(match.away)) {
          doublonErreur = true;
        }
        matchsDuJour.add(match.home);
        matchsDuJour.add(match.away);

        // Enregistre l'historique pour le test de séquence
        historique[match.home].push('D');
        historique[match.away].push('E');
      });

      // 2. Test Contrainte Terrain/Paire
      const paires = getPairesTest(champ.nb, champ.prefixe);
      for (const p of paires) {
        let aHome = false, bHome = false;
        journee.matchs.forEach(m => {
          if (m.home === p.a) aHome = true;
          if (m.home === p.b) bHome = true;
        });
        if (aHome && bHome) paireErreur = true;
      }
    });

    // 3. Test de la Séquence (DDD/EEE)
    for (const equipe in historique) {
      const parcours = historique[equipe].join('');
      // La vérification se fait sur DDD ou EEE
      if (/DDD/.test(parcours) || /EEE/.test(parcours)) {
        streakErreur = true;
      }
    }

    // 4. Test du nombre de journées
    if (calendrier.length !== 2 * (champ.nb - 1)) {
      journeesErreur = true;
    }

    // Affichage des résultats
    result.innerHTML += `<h3>Résultats pour ${champ.prefixe} (${champ.nb} équipes)</h3>`;
    result.innerHTML += !doublonErreur ? `<p style="color:green;">✅ Aucune équipe ne joue deux fois par journée.</p>` : `<p style="color:red;">❌ Des équipes jouent plusieurs fois dans la même journée.</p>`;
    result.innerHTML += !streakErreur ? `<p style="color:green;">✅ Pas de 3 matchs consécutifs domicile ou extérieur.</p>` : `<p style="color:red;">❌ 3 matchs consécutifs domicile ou extérieur détectés.</p>`;
    result.innerHTML += !paireErreur ? `<p style="color:green;">✅ Contrainte terrain/paires respectée.</p>` : `<p style="color:red;">❌ Violation: deux équipes d'un même terrain sont à domicile le même jour.</p>`;
    result.innerHTML += !journeesErreur ? `<p style="color:green;">✅ Nombre de journées correct.</p>` : `<p style="color:red;">❌ Nombre de journées incorrect.</p>`;

    if (!doublonErreur && !streakErreur && !journeesErreur && !paireErreur) {
      result.innerHTML += `<p style="color:green;font-weight:bold;">🎉 Championnat ${champ.prefixe} valide sans erreur !</p>`;
    } else {
      result.innerHTML += `<p style="color:red;font-weight:bold;">⚠️ Problèmes détectés pour ${champ.prefixe}.</p>`;
    }
  });
});

document.getElementById("theme-button").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  document.getElementById("theme-button").textContent = isDark ? "☀️" : "🌙";
});