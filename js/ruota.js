// ============================================================
//  RUOTA DELLA FORTUNA — con generazione codici segreti
// ============================================================
(function() {

  const premi = [
    { label: '+50',    valore: 50,   tipo: 'crediti',        angolo: 22.5 },
    { label: 'x2',     valore: 2,    tipo: 'moltiplicatore', angolo: 67.5 },
    { label: '+100',   valore: 100,  tipo: 'crediti',        angolo: 112.5 },
    { label: 'Codice', valore: 0,    tipo: 'codice',         angolo: 157.5 },
    { label: '+250',   valore: 250,  tipo: 'crediti',        angolo: 202.5 },
    { label: 'Niente', valore: 0,    tipo: 'niente',         angolo: 247.5 },
    { label: '+500',   valore: 500,  tipo: 'crediti',        angolo: 292.5 },
    { label: '+1000',  valore: 1000, tipo: 'crediti',        angolo: 337.5 }
  ];

  const CODICI_RUOTA = [
    'gold', 'red', 'blue', 'green', 'purple', 'rainbow',
    'crown', 'fire', 'star', 'diamond', 'skull', 'bolt'
  ];

  let rotazioneAttuale = 0;
  let inRotazione = false;

  function initRuota() {
    const btnGira = document.getElementById('giraRuota');
    if (!btnGira) return;
    btnGira.addEventListener('click', giraRuota);
    creaEtichette();
    aggiornaStatoRuota();
  }

  function creaEtichette() {
    const wheel = document.getElementById('wheel');
    if (!wheel) return;
    wheel.querySelectorAll('.label').forEach(el => el.remove());
    const raggio = 150;
    premi.forEach((premio) => {
      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = premio.label;
      const rad = (premio.angolo - 90) * Math.PI / 180;
      const x = Math.cos(rad) * raggio;
      const y = Math.sin(rad) * raggio;
      label.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
      wheel.appendChild(label);
    });
  }

  function getDataOggi() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function chiaveUltimoGiro() {
    return window.RB.utenteCorrente
      ? 'ultimoGiroRuota_' + window.RB.utenteCorrente.uid
      : 'ultimoGiroRuota_ospite';
  }

  function puoGirare() {
    return localStorage.getItem(chiaveUltimoGiro()) !== getDataOggi();
  }

  function aggiornaStatoRuota() {
    const btnGira = document.getElementById('giraRuota');
    const timerRuota = document.getElementById('ruotaTimer');
    const messaggioRuota = document.getElementById('ruotaMessaggio');
    if (!btnGira || !window.RB.utenteCorrente) return;

    if (puoGirare()) {
      btnGira.disabled = false;
      btnGira.textContent = 'GIRA LA RUOTA';
      if (timerRuota) timerRuota.textContent = 'Hai 1 giro disponibile oggi';
    } else {
      btnGira.disabled = true;
      btnGira.textContent = 'GIRO GIÀ USATO';
      if (timerRuota) timerRuota.textContent = 'Torna domani per un nuovo giro';
      if (messaggioRuota) messaggioRuota.textContent = 'Ci sei già passato oggi!';
    }
  }

  function giraRuota() {
    if (!window.RB.utenteCorrente) return;
    if (inRotazione || !puoGirare()) return;

    const wheel = document.getElementById('wheel');
    const btnGira = document.getElementById('giraRuota');
    const messaggioRuota = document.getElementById('ruotaMessaggio');
    if (!wheel || !btnGira) return;

    inRotazione = true;
    btnGira.disabled = true;
    if (messaggioRuota) messaggioRuota.textContent = 'La ruota sta girando...';

    const indice = Math.floor(Math.random() * premi.length);
    const premio = premi[indice];
    const giriExtra = 6 + Math.floor(Math.random() * 3);
    const angoloTarget = 360 * giriExtra + (360 - premio.angolo);
    const partenza = rotazioneAttuale % 360;
    rotazioneAttuale += (angoloTarget - partenza);
    if (rotazioneAttuale < 0) rotazioneAttuale += 360 * giriExtra;

    wheel.style.transform = 'rotate(' + rotazioneAttuale + 'deg)';

    setTimeout(() => fineGiro(premio), 5100);
  }

  async function fineGiro(premio) {
    inRotazione = false;
    const messaggioRuota = document.getElementById('ruotaMessaggio');
    const p = window.RB.profiloCorrente;
    if (!p) return;

    // Aggiorna stats
    if (!p.stats) p.stats = { ruota: { giri: 0, vinti: 0 } };
    if (!p.stats.ruota) p.stats.ruota = { giri: 0, vinti: 0 };
    p.stats.ruota.giri++;

    let aggiornamenti = {
      stats: p.stats
    };

    if (premio.tipo === 'crediti') {
      window.RB.saldo += premio.valore;
      p.stats.ruota.vinti++;
      aggiornamenti.saldo = window.RB.saldo;
      aggiornamenti.stats = p.stats;
      if (messaggioRuota) messaggioRuota.textContent = 'HAI VINTO ' + premio.valore + ' CREDITI!';
      window.RB.mostraPopup('HAI VINTO!', '+' + premio.valore + ' crediti', 'vittoria');

    } else if (premio.tipo === 'moltiplicatore') {
      const bonus = window.RB.saldo;
      window.RB.saldo += bonus;
      p.stats.ruota.vinti++;
      aggiornamenti.saldo = window.RB.saldo;
      aggiornamenti.stats = p.stats;
      if (messaggioRuota) messaggioRuota.textContent = 'MOLTIPLICATORE x2! +' + bonus + ' crediti';
      window.RB.mostraPopup('MOLTIPLICATORE x2!', '+' + bonus + ' crediti', 'vittoria');

    } else if (premio.tipo === 'codice') {
      // Genera un codice segreto
      const codiciSbloccati = p.codiciSbloccati || [];
      // Scegli un codice non ancora sbloccato se possibile
      const disponibili = CODICI_RUOTA.filter(c => !codiciSbloccati.includes(c));
      const pool = disponibili.length > 0 ? disponibili : CODICI_RUOTA;
      const codiceVinto = pool[Math.floor(Math.random() * pool.length)];
      codiciSbloccati.push(codiceVinto);
      p.codiciSbloccati = codiciSbloccati;
      p.stats.ruota.vinti++;
      aggiornamenti.codiciSbloccati = codiciSbloccati;
      aggiornamenti.stats = p.stats;
      if (messaggioRuota) messaggioRuota.textContent = '🎟️ HAI VINTO UN CODICE SEGRETO!';
      window.RB.mostraPopup('🎟️ CODICE SEGRETO!', 'Hai vinto il codice: ' + codiceVinto.toUpperCase() + '\nVai su "Codici" per attivarlo', 'codice');

    } else {
      if (messaggioRuota) messaggioRuota.textContent = 'NIENTE! Riprova domani';
      window.RB.mostraPopup('NIENTE', 'Riprova domani!', 'sconfitta');
    }

    window.RB.saldoDisplay.textContent = window.RB.saldo;
    localStorage.setItem(chiaveUltimoGiro(), getDataOggi());
    aggiornaStatoRuota();

    try {
      const r = window.RB.ref(window.RB.db, 'utenti/' + window.RB.utenteCorrente.uid);
      await window.RB.update(r, aggiornamenti);
    } catch (e) {
      console.error('Errore salvataggio ruota:', e);
    }

    if (window.RB.saldo <= 0) {
      window.RB.saldo = 500;
      window.RB.saldoDisplay.textContent = window.RB.saldo;
      const r = window.RB.ref(window.RB.db, 'utenti/' + window.RB.utenteCorrente.uid);
      await window.RB.update(r, { saldo: 500 });
    }
  }

  // Aspetta che window.RB esista
  function attesaRB(callback) {
    if (window.RB) callback();
    else setTimeout(() => attesaRB(callback), 50);
  }

  attesaRB(() => {
    window.RB.aggiornaStatoRuota = aggiornaStatoRuota;
    window.RB.initRuota = initRuota;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initRuota);
    } else {
      initRuota();
    }
  });
})();
