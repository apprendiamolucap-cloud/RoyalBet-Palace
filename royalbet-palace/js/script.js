(function() {
  // ---------- STATO ----------
  let saldo = 500;

  // ---------- DATI SQUADRE ----------
  const squadre = [
    { nome: 'Juventus', img: 'images/pallone.png' },
    { nome: 'Inter', img: 'images/pallone.png' },
    { nome: 'Milan', img: 'images/pallone.png' },
    { nome: 'Roma', img: 'images/pallone.png' },
    { nome: 'Napoli', img: 'images/pallone.png' },
    { nome: 'Lazio', img: 'images/pallone.png' }
  ];

  function generaPartite() {
    const partite = [];
    const squadreCopia = [...squadre];
    for (let i = squadreCopia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [squadreCopia[i], squadreCopia[j]] = [squadreCopia[j], squadreCopia[i]];
    }
    for (let i = 0; i < 3; i++) {
      const casa = squadreCopia[i * 2];
      const trasferta = squadreCopia[i * 2 + 1];
      const quota1 = (1.5 + Math.random() * 3).toFixed(2);
      const quotaX = (2.8 + Math.random() * 2.5).toFixed(2);
      const quota2 = (1.8 + Math.random() * 3.5).toFixed(2);
      partite.push({
        casa: casa,
        trasferta: trasferta,
        quote: { 1: quota1, X: quotaX, 2: quota2 }
      });
    }
    return partite;
  }

  let partite = generaPartite();

  function resetSelezioniCalcio() {
    partite.forEach(p => p.selected = null);
  }
  resetSelezioniCalcio();

  // ---------- CAVALLI ----------
  const cavalli = [
    { nome: 'Fulmine', img: 'images/cavallo.png', quota: 2.5 },
    { nome: 'Saetta', img: 'images/cavallo.png', quota: 3.2 },
    { nome: 'Tuono', img: 'images/cavallo.png', quota: 4.0 },
    { nome: 'Lampo', img: 'images/cavallo.png', quota: 5.5 },
    { nome: 'Vento', img: 'images/cavallo.png', quota: 6.0 }
  ];
  let cavalloSelezionato = null;

  // ---------- RIFERIMENTI DOM ----------
  const saldoDisplay = document.getElementById('saldoDisplay');
  const matchList = document.getElementById('matchList');
  const horseList = document.getElementById('horseList');
  const messaggioCavalli = document.getElementById('messaggioCavalli');

  function aggiornaSaldo() {
    saldoDisplay.textContent = saldo;
  }

  function renderCalcio() {
    matchList.innerHTML = '';
    partite.forEach((partita, idx) => {
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
        btn.dataset.partitaIdx = idx;
        btn.dataset.esito = esito;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const pIdx = parseInt(btn.dataset.partitaIdx);
          const esitoScelto = btn.dataset.esito;
          if (partite[pIdx].selected === esitoScelto) {
            partite[pIdx].selected = null;
          } else {
            partite[pIdx].selected = esitoScelto;
          }
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

  function renderCavalli() {
    horseList.innerHTML = '';
    cavalli.forEach((cavallo, idx) => {
      const card = document.createElement('div');
      card.className = 'horse-card';
      if (cavalloSelezionato === idx) card.classList.add('selected');

      const infoDiv = document.createElement('div');
      infoDiv.className = 'horse-info';
      const img = document.createElement('img');
      img.src = cavallo.img;
      img.alt = cavallo.nome;
      const nomeSpan = document.createElement('span');
      nomeSpan.className = 'horse-name';
      nomeSpan.textContent = cavallo.nome;
      infoDiv.appendChild(img);
      infoDiv.appendChild(nomeSpan);

      const quotaSpan = document.createElement('span');
      quotaSpan.className = 'horse-quota';
      quotaSpan.textContent = 'x' + cavallo.quota.toFixed(2);

      card.appendChild(infoDiv);
      card.appendChild(quotaSpan);

      card.addEventListener('click', () => {
        if (cavalloSelezionato === idx) {
          cavalloSelezionato = null;
        } else {
          cavalloSelezionato = idx;
        }
        renderCavalli();
        messaggioCavalli.textContent = cavalloSelezionato !== null
          ? 'Hai puntato su ' + cavalli[cavalloSelezionato].nome
          : 'Seleziona un cavallo e punta';
      });

      horseList.appendChild(card);
    });
  }

  // ---------- GIOCO CALCIO ----------
  document.getElementById('giocaCalcio').addEventListener('click', () => {
    const puntataInput = document.getElementById('puntataCalcio');
    let puntata = parseInt(puntataInput.value, 10);
    if (isNaN(puntata) || puntata < 1) {
      alert('Inserisci una puntata valida (minimo 1)');
      return;
    }
    if (puntata > saldo) {
      alert('Credito insufficiente!');
      return;
    }

    const selezioni = partite.filter(p => p.selected !== null);
    if (selezioni.length === 0) {
      alert('Seleziona almeno un esito (1, X o 2) su una partita.');
      return;
    }

    let quotaTotale = 1;
    selezioni.forEach(p => {
      quotaTotale *= parseFloat(p.quote[p.selected]);
    });
    quotaTotale = Math.round(quotaTotale * 100) / 100;

    let tutteVincenti = true;
    for (let p of partite) {
      if (p.selected) {
        const esitiPossibili = ['1', 'X', '2'];
        const risultato = esitiPossibili[Math.floor(Math.random() * 3)];
        if (risultato !== p.selected) {
          tutteVincenti = false;
          break;
        }
      }
    }

    saldo -= puntata;

    if (tutteVincenti) {
      const vincita = Math.floor(puntata * quotaTotale);
      saldo += vincita;
      alert('RoyalBet Palace: HAI VINTO! Vincita: ' + vincita + ' crediti (quota ' + quotaTotale + ')');
    } else {
      alert('RoyalBet Palace: Hai perso la schedina. Riprova!');
    }

    resetSelezioniCalcio();
    partite = generaPartite();
    renderCalcio();
    aggiornaSaldo();

    puntataInput.value = Math.min(20, saldo) || 1;
    if (saldo <= 0) {
      saldo = 500;
      aggiornaSaldo();
      alert('Credito esaurito! Ricarica a 500.');
    }
  });

  // ---------- GIOCO CAVALLI ----------
  document.getElementById('giocaCavalli').addEventListener('click', () => {
    const puntataInput = document.getElementById('puntataCavalli');
    let puntata = parseInt(puntataInput.value, 10);
    if (isNaN(puntata) || puntata < 1) {
      alert('Inserisci una puntata valida (minimo 1)');
      return;
    }
    if (puntata > saldo) {
      alert('Credito insufficiente!');
      return;
    }
    if (cavalloSelezionato === null) {
      alert('Seleziona un cavallo prima di giocare!');
      return;
    }

    const cavallo = cavalli[cavalloSelezionato];
    const probabilitaVincita = 1 / cavallo.quota;
    const esito = Math.random() < probabilitaVincita;

    saldo -= puntata;

    if (esito) {
      const vincita = Math.floor(puntata * cavallo.quota);
      saldo += vincita;
      messaggioCavalli.textContent = 'RoyalBet Palace: ' + cavallo.nome + ' ha vinto! Guadagno: +' + vincita + ' crediti';
    } else {
      messaggioCavalli.textContent = 'RoyalBet Palace: ' + cavallo.nome + ' non ha vinto. Riprova!';
    }

    aggiornaSaldo();

    cavalloSelezionato = null;
    renderCavalli();
    if (saldo <= 0) {
      saldo = 500;
      aggiornaSaldo();
      alert('Credito esaurito! Ricarica a 500.');
    }
    puntataInput.value = Math.min(20, saldo) || 1;
  });

  // ---------- AVVIO ----------
  function init() {
    aggiornaSaldo();
    renderCalcio();
    renderCavalli();
    messaggioCavalli.textContent = 'Seleziona un cavallo e punta';
  }
  init();
})();
