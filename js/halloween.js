// ============================================================
//  EVENTO HALLOWEEN — v4 con cosmetici applicabili
// ============================================================
(function() {

  function eventoAttivo() {
    return new Date().getMonth() === 9; // 9 = ottobre
  }

  const PRODOTTI_HALLOWEEN = {
    'soldi-500':    { nome: '500 Crediti',            costo: 20,  tipo: 'crediti',  valore: 500 },
    'soldi-2000':   { nome: '2000 Crediti',           costo: 60,  tipo: 'crediti',  valore: 2000 },
    'soldi-10000':  { nome: '10000 Crediti',          costo: 200, tipo: 'crediti',  valore: 10000 },
    'gemma-1':      { nome: '1 Gemma',                costo: 15,  tipo: 'gemma',    valore: 1 },
    'gemma-5':      { nome: '5 Gemme',                costo: 60,  tipo: 'gemma',    valore: 5 },
    'gemma-15':     { nome: '15 Gemme',               costo: 150, tipo: 'gemma',    valore: 15 },
    'cornice-zucca':     { nome: 'Cornice Zucca',           costo: 40,  tipo: 'cosmetico', id: 'cornice-zucca' },
    'cornice-ragno':     { nome: 'Cornice Ragnatela',       costo: 60,  tipo: 'cosmetico', id: 'cornice-ragno' },
    'badge-pipistrello': { nome: 'Badge Pipistrello',       costo: 80,  tipo: 'cosmetico', id: 'badge-pipistrello' },
    'badge-teschio':     { nome: 'Badge Teschio Halloween', costo: 100, tipo: 'cosmetico', id: 'badge-teschio' },
    'tema-scuro':        { nome: 'Tema Scuro',              costo: 150, tipo: 'cosmetico', id: 'tema-halloween' },
    'skin-fantasmino':   { nome: 'Skin Fantasma',           costo: 200, tipo: 'cosmetico', id: 'skin-fantasmino' }
  };

  function initHalloween() {
    const btnDolcetto = document.getElementById('btnDolcetto');
    const paginaHalloween = document.getElementById('page-halloween');
    const navHalloween = document.querySelector('[data-page="halloween"]');

    const attivo = eventoAttivo();
    if (!attivo) {
      if (navHalloween) navHalloween.style.display = 'none';
      if (paginaHalloween) paginaHalloween.style.display = 'none';
    } else {
      if (navHalloween) navHalloween.style.display = 'inline-block';
    }

    if (btnDolcetto) {
      btnDolcetto.addEventListener('click', dolcettoOScherzetto);
    }

    document.querySelectorAll('.btn-halloween').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.halloween;
        if (id) compraHalloween(id);
      });
    });
  }

  async function dolcettoOScherzetto() {
    if (!window.RB.utenteCorrente) return;
    if (!eventoAttivo()) {
      window.RB.mostraPopup('EVENTO CHIUSO', 'Torna a ottobre per Dolcetto o Scherzetto', 'sconfitta');
      return;
    }
    const p = window.RB.profiloCorrente;
    const ora = Date.now();
    const TRE_ORE = 3 * 60 * 60 * 1000;
    if (p.ultimoDolcetto && (ora - p.ultimoDolcetto) < TRE_ORE) {
      const rimasti = Math.ceil((TRE_ORE - (ora - p.ultimoDolcetto)) / 60000);
      window.RB.mostraPopup('ASPETTA', 'Potrai bussare di nuovo tra ' + rimasti + ' minuti', 'sconfitta');
      return;
    }

    p.ultimoDolcetto = ora;
    const r = Math.random();
    let aggiornamenti = { ultimoDolcetto: ora };
    let messaggio = '';

    if (r < 0.60) {
      p.zucche = (p.zucche || 0) + 10;
      p.zuccheTotali = (p.zuccheTotali || 0) + 10;
      aggiornamenti.zucche = p.zucche;
      aggiornamenti.zuccheTotali = p.zuccheTotali;
      messaggio = '+10 Zucche!';
      window.RB.mostraPopup('🍬 DOLCETTO', messaggio, 'gemma');
    } else if (r < 0.85) {
      p.zucche = (p.zucche || 0) + 25;
      p.zuccheTotali = (p.zuccheTotali || 0) + 25;
      aggiornamenti.zucche = p.zucche;
      aggiornamenti.zuccheTotali = p.zuccheTotali;
      messaggio = '+25 Zucche!';
      window.RB.mostraPopup('🍫 DOLCETTO GRANDE', messaggio, 'gemma');
    } else {
      const perdita = Math.min(10, window.RB.saldo);
      window.RB.saldo -= perdita;
      p.zucche = (p.zucche || 0) + 3;
      p.zuccheTotali = (p.zuccheTotali || 0) + 3;
      aggiornamenti.saldo = window.RB.saldo;
      aggiornamenti.zucche = p.zucche;
      aggiornamenti.zuccheTotali = p.zuccheTotali;
      window.RB.aggiornaSaldo();
      window.RB.mostraPopup('😈 SCHERZETTO!', '-' + perdita + ' crediti, +3 Zucche di consolazione', 'sconfitta');
    }

    window.RB.aggiornaValute();
    await window.RB.salvaProfilo(aggiornamenti);
    aggiornaTimerDolcetto();
  }

  function aggiornaTimerDolcetto() {
    const timerEl = document.getElementById('timerDolcetto');
    if (!timerEl || !window.RB.profiloCorrente) return;
    const p = window.RB.profiloCorrente;
    const TRE_ORE = 3 * 60 * 60 * 1000;
    if (!p.ultimoDolcetto) {
      timerEl.textContent = 'Disponibile ora!';
      timerEl.style.color = '#ffd966';
      return;
    }
    const passato = Date.now() - p.ultimoDolcetto;
    if (passato >= TRE_ORE) {
      timerEl.textContent = 'Disponibile ora!';
      timerEl.style.color = '#ffd966';
    } else {
      const rimasti = Math.ceil((TRE_ORE - passato) / 60000);
      const ore = Math.floor(rimasti / 60);
      const min = rimasti % 60;
      timerEl.textContent = 'Prossimo: ' + (ore > 0 ? ore + 'h ' : '') + min + 'min';
      timerEl.style.color = '#8f9f7f';
    }
  }

  function aggiornaHalloween() {
    if (!window.RB.profiloCorrente) return;
    const zuccheEl = document.getElementById('zuccheGrandiDisplay');
    if (zuccheEl) zuccheEl.textContent = window.RB.profiloCorrente.zucche || 0;
    aggiornaTimerDolcetto();

    const sbloccati = window.RB.profiloCorrente.cosmeticiSbloccati || [];
    document.querySelectorAll('.btn-halloween').forEach(btn => {
      const id = btn.dataset.halloween;
      const prod = PRODOTTI_HALLOWEEN[id];
      if (!prod) return;
      if (prod.tipo === 'cosmetico' && sbloccati.includes(prod.id)) {
        btn.disabled = true;
        btn.textContent = 'POSSEDUTO';
      }
    });
  }

  async function compraHalloween(id) {
    if (!window.RB.utenteCorrente) return;
    if (!eventoAttivo()) {
      window.RB.mostraPopup('EVENTO CHIUSO', 'Lo shop Halloween è aperto solo a ottobre', 'sconfitta');
      return;
    }
    const prod = PRODOTTI_HALLOWEEN[id];
    if (!prod) return;
    const p = window.RB.profiloCorrente;
    const zucche = p.zucche || 0;

    if (zucche < prod.costo) {
      window.RB.mostraPopup('ZUCche INSUFFICIENTI', 'Ti servono ' + prod.costo + ' zucche', 'sconfitta');
      return;
    }

    if (prod.tipo === 'cosmetico') {
      if (!p.cosmeticiSbloccati) p.cosmeticiSbloccati = [];
      if (p.cosmeticiSbloccati.includes(prod.id)) {
        window.RB.mostraPopup('GIÀ POSSEDUTO', 'Hai già ' + prod.nome, 'sconfitta');
        return;
      }
    }

    p.zucche -= prod.costo;
    let aggiornamenti = { zucche: p.zucche };

    if (prod.tipo === 'crediti') {
      window.RB.saldo += prod.valore;
      aggiornamenti.saldo = window.RB.saldo;
      window.RB.aggiornaSaldo();
      window.RB.mostraPopup('CREDITI ACQUISTATI', '+' + prod.valore + ' crediti', 'vittoria');

    } else if (prod.tipo === 'gemma') {
      p.gemme = (p.gemme || 0) + prod.valore;
      p.gemmeTotali = (p.gemmeTotali || 0) + prod.valore;
      aggiornamenti.gemme = p.gemme;
      aggiornamenti.gemmeTotali = p.gemmeTotali;
      window.RB.aggiornaValute();
      window.RB.mostraPopup('💎 GEMME ACQUISTATE', '+' + prod.valore + ' gemme', 'gemma');

    } else if (prod.tipo === 'cosmetico') {
      if (!p.cosmeticiSbloccati) p.cosmeticiSbloccati = [];
      p.cosmeticiSbloccati.push(prod.id);
      aggiornamenti.cosmeticiSbloccati = p.cosmeticiSbloccati;
      window.RB.mostraPopup('SBLOCCATO!', prod.nome + ' è ora disponibile nel profilo', 'gemma');

      // Se è un badge, lo attivo subito (opzionale)
      if (prod.id === 'badge-pipistrello') {
        p.badge = '🦇';
        aggiornamenti.badge = '🦇';
      }
      if (prod.id === 'badge-teschio') {
        p.badge = '💀';
        aggiornamenti.badge = '💀';
      }
    }

    window.RB.aggiornaValute();
    window.RB.aggiornaNomeUI();
    if (window.RB.renderizzaPersonalizzazioni) window.RB.renderizzaPersonalizzazioni();
    await window.RB.salvaProfilo(aggiornamenti);
    aggiornaHalloween();
  }

  function attesaRB(callback) {
    if (window.RB) callback();
    else setTimeout(() => attesaRB(callback), 50);
  }

  attesaRB(() => {
    window.RB.initHalloween = initHalloween;
    window.RB.aggiornaHalloween = aggiornaHalloween;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initHalloween);
    } else {
      initHalloween();
    }

    setInterval(() => {
      if (window.RB.profiloCorrente) aggiornaTimerDolcetto();
    }, 30000);
  });
})();
