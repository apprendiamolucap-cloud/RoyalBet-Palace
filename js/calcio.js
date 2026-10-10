// ============================================================
//  SCHEDINE CALCIO — v4 con moltiplicatori
// ============================================================
(function() {

  const IMG_PALLONE = 'https://cdn-icons-png.flaticon.com/128/12065/12065246.png';

  const squadre = [
    { nome: 'Juventus', img: IMG_PALLONE },
    { nome: 'Inter',    img: IMG_PALLONE },
    { nome: 'Milan',    img: IMG_PALLONE },
    { nome: 'Roma',     img: IMG_PALLONE },
    { nome: 'Napoli',   img: IMG_PALLONE },
    { nome: 'Lazio',    img: IMG_PALLONE }
  ];

  let partite = [];

  function generaPartite() {
    const lista = [];
    const copia = [...squadre];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    for (let i = 0; i < 3; i++) {
      lista.push({
        casa: copia[i * 2],
        trasferta: copia[i * 2 + 1],
        quote: {
          1: (1.5 + Math.random() * 3).toFixed(2),
          X: (2.8 + Math.random() * 2.5).toFixed(2),
          2: (1.8 + Math.random() * 3.5).toFixed(2)
        },
        selected: null
      });
    }
    return lista;
  }

  function initCalcio() {
    const btnGioca = document.getElementById('giocaCalcio');
    if (!btnGioca) return;
    btnGioca.addEventListener('click', giocaSchedina);
    partite = generaPartite();
    renderCalcio();
    aggiornaStatsCalcio();
  }

  function renderCalcio() {
    const matchList = document.getElementById('matchList');
    if (!matchList) return;

    matchList.innerHTML = '';
    partite.forEach((partita) => {
      const row = document.createElement('div');
      row.className = 'match-row';

      const teamCasa = document.createElement('div');
      teamCasa.className = 'team';
      const imgCasa = document.createElement('img');
      imgCasa.src = partita.casa.img;
      imgCasa.alt = partita.casa.nome;
      const spanCasa = document.createElement('span');
      spanCasa.textContent = partita.casa.nome;
      teamCasa.appendChild(imgCasa);
      teamCasa.appendChild(spanCasa);

      const teamTrasf = document.createElement('div');
      teamTrasf.className = 'team';
      const imgTrasf = document.createElement('img');
      imgTrasf.src = partita.trasferta.img;
      imgTrasf.alt = partita.trasferta.nome;
      const spanTrasf = document.createElement('span');
      spanTrasf.textContent = partita.trasferta.nome;
      teamTrasf.appendChild(imgTrasf);
      teamTrasf.appendChild(spanTrasf);

      const oddsDiv = document.createElement('div');
      oddsDiv.className = 'odds-buttons';

      ['1', 'X', '2'].forEach(esito => {
        const btn = document.createElement('button');
        btn.className = 'odds-btn';
        if (partita.selected === esito) btn.classList.add('selected');
        btn.textContent = esito + ' ' + partita.quote[esito];
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          partita.selected = (partita.selected === esito) ? null : esito;
          renderCalcio();
        });
        oddsDiv.appendChild(btn);
      });

      row.appendChild(teamCasa);
      row.appendChild(teamTrasf);
      row.appendChild(oddsDiv);
      matchList.appendChild(row);
    });
  }

  async function giocaSchedina() {
    if (!window.RB.utenteCorrente) return;
    const puntataInput = document.getElementById('puntataCalcio');
    const puntata = parseInt(puntataInput.value, 10);

    if (isNaN(puntata) || puntata < 1) {
      window.RB.mostraPopup('ATTENZIONE', 'Inserisci una puntata valida', 'sconfitta');
      return;
    }
    if (puntata > window.RB.saldo) {
      window.RB.mostraPopup('CREDITO INSUFFICIENTE', 'Non hai abbastanza crediti', 'sconfitta');
      return;
    }

    const selezioni = partite.filter(p => p.selected !== null);
    if (selezioni.length === 0) {
      window.RB.mostraPopup('ATTENZIONE', 'Seleziona almeno un esito', 'sconfitta');
      return;
    }

    let quotaTotale = 1;
    selezioni.forEach(p => quotaTotale *= parseFloat(p.quote[p.selected]));
    quotaTotale = Math.round(quotaTotale * 100) / 100;

    const moltiplicatore = window.RB.getMoltiplicatoreAttivo ? window.RB.getMoltiplicatoreAttivo() : 1;

    let vittoria = true;
    for (const p of partite) {
      if (p.selected) {
        const esiti = ['1', 'X', '2'];
        const risultato = esiti[Math.floor(Math.random() * 3)];
        if (risultato !== p.selected) {
          vittoria = false;
          break;
        }
      }
    }

    const p = window.RB.profiloCorrente;
    if (!p.stats) p.stats = {};
    if (!p.stats.calcio) p.stats.calcio = { giocate: 0, vinte: 0 };
    p.stats.calcio.giocate++;

    let aggiornamenti = {};

    window.RB.saldo -= puntata;
    if (vittoria) {
      let vincita = Math.floor(puntata * quotaTotale);
      if (moltiplicatore > 1) {
        vincita = vincita * moltiplicatore;
      }
      window.RB.saldo += vincita;
      p.stats.calcio.vinte++;

      let testo = '+' + vincita + ' crediti (quota ' + quotaTotale + ')';
      if (moltiplicatore > 1) {
        testo += ' · MOLTIPLICATORE x' + moltiplicatore;
      }
      window.RB.mostraPopup('HAI VINTO!', testo, 'vittoria');
    } else {
      window.RB.mostraPopup('HAI PERSO', 'Riprova con una nuova schedina', 'sconfitta');
    }

    aggiornamenti.saldo = window.RB.saldo;
    aggiornamenti.stats = p.stats;

    window.RB.saldoDisplay.textContent = window.RB.saldo;

    try {
      const r = window.RB.ref(window.RB.db, 'utenti/' + window.RB.utenteCorrente.uid);
      await window.RB.update(r, aggiornamenti);
    } catch (e) {
      console.error('Errore salvataggio calcio:', e);
    }

    partite = generaPartite();
    renderCalcio();
    aggiornaStatsCalcio();

    puntataInput.value = Math.min(20, window.RB.saldo) || 1;

    if (window.RB.saldo <= 0) {
      window.RB.saldo = 500;
      window.RB.saldoDisplay.textContent = 500;
      const r = window.RB.ref(window.RB.db, 'utenti/' + window.RB.utenteCorrente.uid);
      await window.RB.update(r, { saldo: 500 });
    }
  }

  function aggiornaStatsCalcio() {
    const cont = document.getElementById('statsCalcio');
    if (!cont) return;
    const p = window.RB.profiloCorrente;
    if (!p || !p.stats || !p.stats.calcio) {
      cont.innerHTML = '';
      return;
    }
    const s = p.stats.calcio;
    const perc = s.giocate > 0 ? Math.round((s.vinte / s.giocate) * 100) : 0;
    cont.innerHTML = `
      <div class="stat-box">
        <span class="stat-num">${s.giocate}</span>
        <span class="stat-label">Schedine giocate</span>
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
    window.RB.renderCalcio = renderCalcio;
    window.RB.initCalcio = initCalcio;
    window.RB.aggiornaStatsCalcio = aggiornaStatsCalcio;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initCalcio);
    } else {
      initCalcio();
    }
  });
})();
