// ============================================================
//  CODICI SEGRETI + PERSONALIZZAZIONI
// ============================================================
(function() {

  const COLORI_SBLoccabili = [
    { id: 'oro', colore: '#ffd966', label: 'Oro', codiceRichiesto: 'gold' },
    { id: 'rosso', colore: '#ff5050', label: 'Rosso', codiceRichiesto: 'red' },
    { id: 'blu', colore: '#50a0ff', label: 'Blu', codiceRichiesto: 'blue' },
    { id: 'verde', colore: '#50ff80', label: 'Verde', codiceRichiesto: 'green' },
    { id: 'viola', colore: '#c050ff', label: 'Viola', codiceRichiesto: 'purple' },
    { id: 'arcobaleno', colore: 'rainbow', label: 'Arcobaleno', codiceRichiesto: 'rainbow' }
  ];

  const BADGE_SBLoccabili = [
    { id: 'corona', emoji: '👑', label: 'Corona', codiceRichiesto: 'crown' },
    { id: 'fuoco', emoji: '🔥', label: 'Fuoco', codiceRichiesto: 'fire' },
    { id: 'stella', emoji: '⭐', label: 'Stella', codiceRichiesto: 'star' },
    { id: 'diamante', emoji: '💎', label: 'Diamante', codiceRichiesto: 'diamond' },
    { id: 'teschio', emoji: '💀', label: 'Teschio', codiceRichiesto: 'skull' },
    { id: 'fulmine', emoji: '⚡', label: 'Fulmine', codiceRichiesto: 'bolt' }
  ];

  // Codici validi (generati dalla ruota)
  window.RB.codiciValidi = {
    'gold': { tipo: 'colore', valore: '#ffd966', label: 'Colore Oro' },
    'red': { tipo: 'colore', valore: '#ff5050', label: 'Colore Rosso' },
    'blue': { tipo: 'colore', valore: '#50a0ff', label: 'Colore Blu' },
    'green': { tipo: 'colore', valore: '#50ff80', label: 'Colore Verde' },
    'purple': { tipo: 'colore', valore: '#c050ff', label: 'Colore Viola' },
    'rainbow': { tipo: 'colore', valore: 'rainbow', label: 'Colore Arcobaleno' },
    'crown': { tipo: 'badge', valore: '👑', label: 'Badge Corona' },
    'fire': { tipo: 'badge', valore: '🔥', label: 'Badge Fuoco' },
    'star': { tipo: 'badge', valore: '⭐', label: 'Badge Stella' },
    'diamond': { tipo: 'badge', valore: '💎', label: 'Badge Diamante' },
    'skull': { tipo: 'badge', valore: '💀', label: 'Badge Teschio' },
    'bolt': { tipo: 'badge', valore: '⚡', label: 'Badge Fulmine' }
  };

  function initCodici() {
    const btnRiscatta = document.getElementById('btnRiscattaCodice');
    const btnGeneraTest = document.getElementById('btnGeneraCodiceTest');
    if (btnRiscatta) btnRiscatta.addEventListener('click', riscattaCodice);
    if (btnGeneraTest) {
      btnGeneraTest.addEventListener('click', generaCodiceTest);
      // Mostra modalità test solo se l'URL contiene ?test=1
      if (window.location.search.includes('test=1')) {
        document.getElementById('codiciTest').style.display = 'block';
      }
    }
  }

  function aggiornaCodici() {
    if (!window.RB || !window.RB.profiloCorrente) return;
    const sbloccati = window.RB.profiloCorrente.codiciSbloccati || [];
    const cont = document.getElementById('codiciSbloccati');
    if (!cont) return;

    if (sbloccati.length === 0) {
      cont.innerHTML = '<p class="codici-vuoto">Nessun codice riscattato ancora</p>';
      return;
    }

    cont.innerHTML = '';
    sbloccati.forEach(cod => {
      const info = window.RB.codiciValidi[cod];
      if (!info) return;
      const div = document.createElement('div');
      div.className = 'codice-sbloccato';
      div.innerHTML = info.label + '<span class="codice-tipo">' + info.tipo + '</span>';
      cont.appendChild(div);
    });
  }

  async function riscattaCodice() {
    const input = document.getElementById('inputCodice');
    const msg = document.getElementById('codiciMessaggio');
    const codice = input.value.trim().toLowerCase();

    if (!codice) {
      msg.style.color = '#ff8a8a';
      msg.textContent = 'Inserisci un codice';
      return;
    }

    const info = window.RB.codiciValidi[codice];
    if (!info) {
      msg.style.color = '#ff8a8a';
      msg.textContent = '❌ Codice non valido';
      return;
    }

    const sbloccati = window.RB.profiloCorrente.codiciSbloccati || [];
    if (sbloccati.includes(codice)) {
      msg.style.color = '#ffdb8e';
      msg.textContent = '⚠️ Codice già riscattato';
      return;
    }

    sbloccati.push(codice);
    window.RB.profiloCorrente.codiciSbloccati = sbloccati;

    const r = window.RB.ref(window.RB.db, 'utenti/' + window.RB.utenteCorrente.uid);
    await window.RB.update(r, { codiciSbloccati: sbloccati });

    msg.style.color = '#ffd966';
    msg.textContent = '✅ Sbloccato: ' + info.label;
    input.value = '';
    aggiornaCodici();
    window.RB.mostraPopup('CODICE RISCATTATO', info.label, 'codice');
  }

  function generaCodiceTest() {
    const keys = Object.keys(window.RB.codiciValidi);
    const random = keys[Math.floor(Math.random() * keys.length)];
    const input = document.getElementById('inputCodice');
    if (input) {
      input.value = random;
      document.getElementById('codiciMessaggio').textContent = 'Codice test generato: ' + random;
    }
  }

  // ===== PERSONALIZZAZIONE PROFILO =====
  window.RB.renderizzaPersonalizzazioni = function() {
    const p = window.RB.profiloCorrente;
    if (!p) return;
    const sbloccati = p.codiciSbloccati || [];

    // Colori
    const coloriCont = document.getElementById('profiloColori');
    if (coloriCont) {
      coloriCont.innerHTML = '';
      COLORI_SBLoccabili.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'colore-btn';
        if (c.colore === 'rainbow') {
          btn.style.background = 'linear-gradient(45deg, red, orange, yellow, green, blue, violet)';
        } else {
          btn.style.background = c.colore;
        }
        btn.title = c.label;
        const ha = sbloccati.includes(c.codiceRichiesto) || sbloccati.includes(c.id);
        if (!ha) {
          btn.style.opacity = '0.25';
          btn.style.cursor = 'not-allowed';
          btn.disabled = true;
        } else {
          if (p.coloreNome === c.colore || (c.colore === 'rainbow' && p.coloreNome === 'rainbow')) {
            btn.classList.add('selected');
          }
          btn.addEventListener('click', () => {
            p.coloreNome = c.colore;
            window.RB.aggiornaNomeUI();
            window.RB.renderizzaPersonalizzazioni();
          });
        }
        coloriCont.appendChild(btn);
      });
    }

    // Badge
    const badgeCont = document.getElementById('profiloBadge');
    if (badgeCont) {
      badgeCont.innerHTML = '';
      BADGE_SBLoccabili.forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'badge-btn';
        btn.textContent = b.emoji;
        btn.title = b.label;
        const ha = sbloccati.includes(b.codiceRichiesto) || sbloccati.includes(b.id);
        if (!ha) {
          btn.style.opacity = '0.25';
          btn.style.cursor = 'not-allowed';
          btn.disabled = true;
        } else {
          if (p.badge === b.emoji) btn.classList.add('selected');
          btn.addEventListener('click', () => {
            p.badge = (p.badge === b.emoji) ? '' : b.emoji;
            window.RB.aggiornaNomeUI();
            window.RB.renderizzaPersonalizzazioni();
          });
        }
        badgeCont.appendChild(btn);
      });
    }
  };

  window.RB.aggiornaCodici = aggiornaCodici;
  window.RB.initCodici = initCodici;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCodici);
  } else {
    initCodici();
  }
})();
