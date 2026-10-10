// ============================================================
//  CORSA FANTASMINI — v4 con skin fantasma e moltiplicatori
// ============================================================
(function() {

  const IMG_FANTASMINO = 'https://cdn-icons-png.flaticon.com/128/706/706023.png';
  const IMG_FANTASMA = 'https://cdn-icons-png.flaticon.com/128/854/854878.png';

  const fantasmini = [
    { nome: 'Blinky',  quota: 2.5, colore: '#ff4040' },
    { nome: 'Pinky',   quota: 3.2, colore: '#ff80c0' },
    { nome: 'Inky',    quota: 4.0, colore: '#40a0ff' },
    { nome: 'Clyde',   quota: 5.5, colore: '#ffa040' },
    { nome: 'Spettro', quota: 6.0, colore: '#a0a0ff' }
  ];

  let fantasminoSelezionato = null;
  let inCorsa = false;

  function usaSkinFantasma() {
    const p = window.RB.profiloCorrente || {};
    const cosmetici = p.cosmeticiSbloccati || [];
    return cosmetici.includes('skin-fantasmino');
  }

  function getImgFantasmino() {
    return usaSkinFantasma() ? IMG_FANTASMA : IMG_FANTASMINO;
  }

  function initFantasmini() {
    const btnGioca = document.getElementById('giocaCavalli');
    if (!btnGioca) return;
    btnGioca.addEventListener('click', avviaCorsa);
    renderFantasmini();
    aggiornaStatsFantasmini();
  }

  function renderFantasmini() {
    const horseList = document.getElementById('horseList');
    if (!horseList) return;

    const imgSrc = getImgFantasmino();

    horseList.innerHTML = '';
    fantasmini.forEach((fantasmino, idx) => {
      const card = document.createElement('div');
      card.className = 'horse-card';
      if (fantasminoSelezionato === idx) card.classList.add('selected');
      card.style.borderLeft = '4px solid ' + fantasmino.colore;

      const infoDiv = document.createElement('div');
      infoDiv.className = 'horse-info';

      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = fantasmino.nome;
      img.style.filter = 'drop-shadow(0 0 6px ' + fantasmino.colore + ')';

      const nomeSpan = document.createElement('span');
      nomeSpan.className = 'horse-name';
      nomeSpan.textContent = fantasmino.nome;
      nomeSpan.style.color = fantasmino.colore;

      infoDiv.appendChild(img);
      infoDiv.appendChild(nomeSpan);

      const quotaSpan = document.createElement('span');
      quotaSpan.className = 'horse-quota';
      quotaSpan.textContent = 'x' + fantasmino.quota.toFixed(2);

      card.appendChild(infoDiv);
      card.appendChild(quotaSpan);

      card.addEventListener('click', () => {
        if (inCorsa) return;
        fantasminoSelezionato = (fantasminoSelezionato === idx) ? null : idx;
        renderFantasmini();
        const msg = document.getElementById('messaggioCavalli');
        if (msg) {
          msg.textContent = fantasminoSelezionato !== null
            ? 'Hai puntato su ' + fantasmini[fantasminoSelezionato].nome
            : 'Seleziona un fantasmino e punta';
        }
      });

      horseList.appendChild(card);
    });
  }

  async function avviaCorsa() {
    if (inCorsa) return;
    if (!window.RB.utenteCorrente) return;

    const puntataInput = document.getElementById('puntataCavalli');
    const puntata = parseInt(puntataInput.value, 10);

    if (isNaN(puntata) || puntata < 1) {
      window.RB.mostraPopup('ATTENZIONE', 'Inserisci una puntata valida', 'sconfitta');
      return;
    }
    if (puntata > window.RB.saldo) {
      window.RB.mostraPopup('CREDITO INSUFFICIENTE', 'Non hai abbastanza crediti', 'sconfitta');
      return;
    }
    if (fantasminoSelezionato === null) {
      window.RB.mostraPopup('ATTENZIONE', 'Seleziona un fantasmino', 'sconfitta');
      return;
    }

    inCorsa = true;
    const btnGioca = document.getElementById('giocaCavalli');
    if (btnGioca) btnGioca.disabled = true;

    const pesi = fantasmini.map(f => 1 / f.quota);
    const somma = pesi.reduce((a, b) => a + b, 0);
    const r = Math.random() * somma;
    let accumulato = 0;
    let vincitore = 0;
    for (let i = 0; i < pesi.length; i++) {
      accumulato += pesi[i];
      if (r <= accumulato) {
        vincitore = i;
        break;
      }
    }

    mostraPista();

    const velocitaFantasmini = fantasmini.map((_, i) => {
      if (i === vincitore) return 1.0;
      return 0.78 + Math.random() * 0.17;
    });

    const durata = 5000;
    const tempoInizio = performance.now();

    function animazione(t) {
      const elapsed = t - tempoInizio;
      const progress = Math.min(elapsed / durata, 1);
      const ease = 1 - Math.pow(1 - progress, 2);

      fantasmini.forEach((_, i) => {
        const elem = document.getElementById('corsa-' + i);
        if (!elem) return;
        const posizione = velocitaFantasmini[i] * ease * 100;
        elem.style.left = posizione + '%';
      });

      if (progress < 1) {
        requestAnimationFrame(animazione);
      } else {
        setTimeout(() => concludiCorsa(vincitore, puntata), 500);
      }
    }

    requestAnimationFrame(animazione);

    const msg = document.getElementById('messaggioCavalli');
    if (msg) msg.textContent = '🏁 La corsa è iniziata!';
  }

  function mostraPista() {
    const horseList = document.getElementById('horseList');
    if (!horseList) return;

    const imgSrc = getImgFantasmino();

    horseList.innerHTML = '';
    const pista = document.createElement('div');
    pista.className = 'pista-corsa';

    const traguardo = document.createElement('div');
    traguardo.className = 'traguardo';
    pista.appendChild(traguardo);

    fantasmini.forEach((f, i) => {
      const corsia = document.createElement('div');
      corsia.className = 'corsia';

      const num = document.createElement('div');
      num.className = 'corsia-num';
      num.textContent = i + 1;
      corsia.appendChild(num);

      const runner = document.createElement('div');
      runner.className = 'runner';
      runner.id = 'corsa-' + i;
      runner.style.left = '0%';
      runner.style.transition = 'none';

      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = f.nome;
      img.style.filter = 'drop-shadow(0 0 8px ' + f.colore + ')';

      const nome = document.createElement('span');
      nome.className = 'runner-name';
      nome.textContent = f.nome;
      nome.style.color = f.colore;

      runner.appendChild(img);
      runner.appendChild(nome);
      corsia.appendChild(runner);
      pista.appendChild(corsia);
    });

    horseList.appendChild(pista);
  }

  async function concludiCorsa(indiceVincitore, puntata) {
    const vincitore = fantasmini[indiceVincitore];
    const f = fantasmini[fantasminoSelezionato];
    const haVinto = (indiceVincitore === fantasminoSelezionato);

    const moltiplicatore = window.RB.getMoltiplicatoreAttivo ? window.RB.getMoltiplicatoreAttivo() : 1;

    const p = window.RB.profiloCorrente;
    if (!p.stats) p.stats = {};
    if (!p.stats.fantasmini) p.stats.fantasmini = { giocate: 0, vinte: 0 };
    p.stats.fantasmini.giocate++;

    let aggiornamenti = {};

    window.RB.saldo -= puntata;
    if (haVinto) {
      let vincita = Math.floor(puntata * f.quota);
      if (moltiplicatore > 1) {
        vincita = vincita * moltiplicatore;
      }
      window.RB.saldo += vincita;
      p.stats.fantasmini.vinte++;

      let testo = vincitore.nome + ' è arrivato primo! +' + vincita + ' crediti';
      if (moltiplicatore > 1) {
        testo += ' · MOLTIPLICATORE x' + moltiplicatore;
      }
      const msg = document.getElementById('messaggioCavalli');
      if (msg) msg.textContent = '🏆 ' + vincitore.nome + ' ha vinto! +' + vincita + ' crediti';
      window.RB.mostraPopup('HAI VINTO!', testo, 'vittoria');
    } else {
      const msg = document.getElementById('messaggioCavalli');
      if (msg) msg.textContent = '🏁 ' + vincitore.nome + ' ha vinto. Riprova!';
      window.RB.mostraPopup('HAI PERSO', vincitore.nome + ' ha vinto. Riprova!', 'sconfitta');
    }

    aggiornamenti.saldo = window.RB.saldo;
    aggiornamenti.stats = p.stats;

    window.RB.saldoDisplay.textContent = window.RB.saldo;

    try {
      const r = window.RB.ref(window.RB.db, 'utenti/' + window.RB.utenteCorrente.uid);
      await window.RB.update(r, aggiornamenti);
    } catch (e) {
      console.error('Errore salvataggio fantasmini:', e);
    }

    fantasminoSelezionato = null;
    inCorsa = false;
    const btnGioca = document.getElementById('giocaCavalli');
    if (btnGioca) btnGioca.disabled = false;

    if (window.RB.saldo <= 0) {
      window.RB.saldo = 500;
      window.RB.saldoDisplay.textContent = 500;
      const r = window.RB.ref(window.RB.db, 'utenti/' + window.RB.utenteCorrente.uid);
      await window.RB.update(r, { saldo: 500 });
    }

    setTimeout(() => {
      renderFantasmini();
      aggiornaStatsFantasmini();
    }, 2000);
  }

  function aggiornaStatsFantasmini() {
    const cont = document.getElementById('statsFantasmini');
    if (!cont) return;
    const p = window.RB.profiloCorrente;
    if (!p || !p.stats || !p.stats.fantasmini) {
      cont.innerHTML = '';
      return;
    }
    const s = p.stats.fantasmini;
    const perc = s.giocate > 0 ? Math.round((s.vinte / s.giocate) * 100) : 0;
    cont.innerHTML = `
      <div class="stat-box">
        <span class="stat-num">${s.giocate}</span>
        <span class="stat-label">Corse giocate</span>
      </div>
      <div class="stat-box">
        <span class="stat-num">${s.vinte}</span>
        <span class="stat-label">Vinte</span>
      </div>
      <div class="stat-box">
        <span class="stat-num">${perc}%</span>
        <span class="stat-label">Successo</span>
      </div>
    `;
  }

  function attesaRB(callback) {
    if (window.RB) callback();
    else setTimeout(() => attesaRB(callback), 50);
  }

  attesaRB(() => {
    window.RB.renderFantasmini = renderFantasmini;
    window.RB.initFantasmini = initFantasmini;
    window.RB.aggiornaStatsFantasmini = aggiornaStatsFantasmini;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initFantasmini);
    } else {
      initFantasmini();
    }
  });
})();
