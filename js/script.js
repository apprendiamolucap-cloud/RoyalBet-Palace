(function() {
  let saldo = 500;

  const squadre = [
    { nome: 'Juventus', img: 'images/pallone.png' },
    { nome: 'Inter',    img: 'images/pallone.png' },
    { nome: 'Milan',    img: 'images/pallone.png' },
    { nome: 'Roma',     img: 'images/pallone.png' },
    { nome: 'Napoli',   img: 'images/pallone.png' },
    { nome: 'Lazio',    img: 'images/pallone.png' }
  ];

  function generaPartite() {
    const partite = [];
    const copia = [...squadre];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    for (let i = 0; i < 3; i++) {
      const casa = copia[i * 2];
      const trasferta = copia[i * 2 + 1];
      partite.push({
        casa: casa,
        trasferta: trasferta,
        quote: {
          1: (1.5 + Math.random() * 3).toFixed(2),
          X: (2.8 + Math.random() * 2.5).toFixed(2),
          2: (1.8 + Math.random() * 3.5).toFixed(2)
        }
      });
    }
    return partite;
  }

  let partite = generaPartite();

  const fantasmini = [
    { nome: 'Blinky',  img: 'images/fantasmino.png', quota: 2.5 },
    { nome: 'Pinky',   img: 'images/fantasmino.png', quota: 3.2 },
    { nome: 'Inky',    img: 'images/fantasmino.png', quota: 4.0 },
    { nome: 'Clyde',   img: 'images/fantasmino.png', quota: 5.5 },
    { nome: 'Spettro', img: 'images/fantasmino.png', quota: 6.0 }
  ];
  let fantasminoSelezionato = null;

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

  function renderFantasmini() {
    horseList.innerHTML = '';
    fantasmini.forEach((fantasmino, idx) => {
      const card = document.createElement('div');
      card.className = 'horse-card';
      if (fantasminoSelezionato === idx) card.classList.add('selected');

      const infoDiv = document.createElement('div');
      infoDiv.className = 'horse-info';
      const img = document.createElement('img');
      img.src = fantasmino.img;
      img.alt = fantasmino.nome;
      const nomeSpan = document.createElement('span');
      nomeSpan.className = 'horse-name';
      nomeSpan.textContent = fantasmino.nome;
      infoDiv.appendChild(img);
      infoDiv.appendChild(nomeSpan);

      const quotaSpan = document.createElement('span');
      quotaSpan.className = 'horse-quota';
      quotaSpan.textContent = 'x' + fantasmino.quota.toFixed(2);

      card.appendChild(infoDiv);
      card.appendChild(quotaSpan);

      card.addEventListener('click', () => {
        fantasminoSelezionato = (fantasminoSelezionato === idx) ? null : idx;
        renderFantasmini();
        messaggioCavalli.textContent = fantasminoSelezionato !== null
          ? 'Hai puntato su ' + fantasmini[fantasminoSelezionato].nome
          : 'Seleziona un fantasmino e punta';
      });

      horseList.appendChild(card);
    });
  }

  document.getElementById('giocaCalcio').addEventListener('click', () => {
    const puntataInput = document.getElementById('puntataCalcio');
    const puntata = parseInt(puntataInput.value, 10);
    if (isNaN(puntata) || puntata < 1) { alert('Puntata non valida'); return; }
    if (puntata > saldo) { alert('Credito insufficiente!'); return; }

    const selezioni = partite.filter(p => p.selected !== null);
    if (selezioni.length === 0) { alert('Seleziona almeno un esito'); return; }

    let quotaTotale = 1;
    selezioni.forEach(p => quotaTotale *= parseFloat(p.quote[p.selected]));
    quotaTotale = Math.round(quotaTotale * 100) / 100;

    let vittoria = true;
    for (const p of partite) {
      if (p.selected) {
        const esiti = ['1', 'X', '2'];
        const risultato = esiti[Math.floor(Math.random() * 3)];
        if (risultato !== p.selected) { vittoria = false; break; }
      }
    }

    saldo -= puntata;
    if (vittoria) {
      const vincita = Math.floor(puntata * quotaTotale);
      saldo += vincita;
      alert('HAI VINTO! +' + vincita + ' crediti (quota ' + quotaTotale + ')');
    } else {
      alert('Hai perso la schedina.');
    }

    partite = generaPartite();
    renderCalcio();
    aggiornaSaldo();
    puntataInput.value = Math.min(20, saldo) || 1;
    if (saldo <= 0) { saldo = 500; aggiornaSaldo(); alert('Ricarica a 500'); }
  });

  document.getElementById('giocaCavalli').addEventListener('click', () => {
    const puntataInput = document.getElementById('puntataCavalli');
    const puntata = parseInt(puntataInput.value, 10);
    if (isNaN(puntata) || puntata < 1) { alert('Puntata non valida'); return; }
    if (puntata > saldo) { alert('Credito insufficiente!'); return; }
    if (fantasminoSelezionato === null) { alert('Seleziona un fantasmino'); return; }

    const f = fantasmini[fantasminoSelezionato];
    const esito = Math.random() < (1 / f.quota);

    saldo -= puntata;
    if (esito) {
      const vincita = Math.floor(puntata * f.quota);
      saldo += vincita;
      messaggioCavalli.textContent = f.nome + ' ha vinto! +' + vincita + ' crediti';
    } else {
      messaggioCavalli.textContent = f.nome + ' non ha vinto. Riprova!';
    }

    aggiornaSaldo();
    fantasminoSelezionato = null;
    renderFantasmini();
    puntataInput.value = Math.min(20, saldo) || 1;
    if (saldo <= 0) { saldo = 500; aggiornaSaldo(); alert('Ricarica a 500'); }
  });

  aggiornaSaldo();
  renderCalcio();
  renderFantasmini();
})();
