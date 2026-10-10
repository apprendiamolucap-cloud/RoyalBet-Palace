(function() {
  let saldo = 500;

  // ---------- IMMAGINI ONLINE ----------
  const IMG_PALLONE    = 'https://cdn-icons-png.flaticon.com/128/12065/12065246.png';
  const IMG_FANTASMINO = 'https://cdn-icons-png.flaticon.com/128/706/706023.png';

  // ============================================================
  //  RUOTA DELLA FORTUNA
  // ============================================================
  const premi = [
    { label: '+50',        valore: 50,   tipo: 'crediti', colore: '#1e5631' },
    { label: 'x2',         valore: 2,    tipo: 'moltiplicatore', colore: '#8a6d1c' },
    { label: '+100',       valore: 100,  tipo: 'crediti', colore: '#1e5631' },
    { label: 'Tenta',      valore: 0,    tipo: 'ritenta', colore: '#7a2c2c' },
    { label: '+250',       valore: 250,  tipo: 'crediti', colore: '#1e5631' },
    { label: 'Niente',     valore: 0,    tipo: 'niente', colore: '#3a3a3a' },
    { label: '+500',       valore: 500,  tipo: 'crediti', colore: '#1e5631' },
    { label: '+1000',      valore: 1000, tipo: 'crediti', colore: '#a67c00' }
  ];

  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const btnGira = document.getElementById('giraRuota');
  const messaggioRuota = document.getElementById('ruotaMessaggio');
  const timerRuota = document.getElementById('ruotaTimer');

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const raggio = canvas.width / 2 - 10;
  const numSpicchi = premi.length;
  const angoloSpicchio = (2 * Math.PI) / numSpicchi;

  let rotazioneAttuale = 0;
  let inRotazione = false;

  function disegnaRuota(rotazione) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // bordo esterno dorato
    ctx.beginPath();
    ctx.arc(centerX, centerY, raggio + 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#c9a95c';
    ctx.fill();

    // spicchi
    premi.forEach((premio, i) => {
      const angoloInizio = i * angoloSpicchio + rotazione;
      const angoloFine = angoloInizio + angoloSpicchio;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, raggio, angoloInizio, angoloFine);
      ctx.closePath();
      ctx.fillStyle = premio.colore;
      ctx.fill();

      ctx.strokeStyle = '#c9a95c';
      ctx.lineWidth = 3;
      ctx.stroke();

      // testo
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angoloInizio + angoloSpicchio / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Segoe UI, sans-serif';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 6;
      ctx.fillText(premio.label, raggio - 20, 8);
      ctx.restore();
    });

    // centro decorativo
    ctx.beginPath();
    ctx.arc(centerX, centerY, 45, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e3b2b';
    ctx.fill();
    ctx.strokeStyle = '#c9a95c';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#c9a95c';
    ctx.fill();
  }

  function getDataOggi() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function puoGirare() {
    const ultimoGiro = localStorage.getItem('ultimoGiroRuota');
    return ultimoGiro !== getDataOggi();
  }

  function aggiornaStatoRuota() {
    if (puoGirare()) {
      btnGira.disabled = false;
      btnGira.textContent = 'GIRA LA RUOTA';
      timerRuota.textContent = 'Hai 1 giro disponibile oggi';
      messaggioRuota.textContent = 'Premi per girare';
    } else {
      btnGira.disabled = true;
      btnGira.textContent = 'GIRO GIÀ USATO';
      timerRuota.textContent = 'Torna domani per un nuovo giro';
      messaggioRuota.textContent = 'Ci sei già passato oggi!';
    }
  }

  function giraRuota() {
    if (inRotazione) return;
    if (!puoGirare()) return;

    inRotazione = true;
    btnGira.disabled = true;

    // scegli un premio casuale
    const indice = Math.floor(Math.random() * numSpicchi);

    // calcola l'angolo per far finire quello spicchio sotto la freccia
    // La freccia è in alto (12 ore) -> angolo -PI/2
    // Vogliamo che il centro dello spicchio indice + 0.5 stia in alto
    const giriExtra = 6 + Math.floor(Math.random() * 3); // 6-8 giri
    const target = (2 * Math.PI) * giriExtra
      + (2 * Math.PI - (indice + 0.5) * angoloSpicchio);

    const rotazionePartenza = rotazioneAttuale;
    const rotazioneFinale = rotazionePartenza + target;
    const durata = 4500;
    const tempoInizio = performance.now();

    function animazione(t) {
      const elapsed = t - tempoInizio;
      const progress = Math.min(elapsed / durata, 1);
      // ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      rotazioneAttuale = rotazionePartenza + (rotazioneFinale - rotazionePartenza) * ease;
      disegnaRuota(rotazioneAttuale);

      if (progress < 1) {
        requestAnimationFrame(animazione);
      } else {
        fineGiro(indice);
      }
    }

    requestAnimationFrame(animazione);
  }

  function fineGiro(indice) {
    const premio = premi[indice];
    inRotazione = false;

    // applica premio
    if (premio.tipo === 'crediti') {
      saldo += premio.valore;
      messaggioRuota.textContent = 'HAI VINTO ' + premio.valore + ' CREDITI!';
    } else if (premio.tipo === 'moltiplicatore') {
      const bonus = saldo; // x2 -> aggiungi il saldo attuale
      saldo += bonus;
      messaggioRuota.textContent = 'MOLTIPLICATORE x2! +' + bonus + ' crediti';
    } else if (premio.tipo === 'ritenta') {
      messaggioRuota.textContent = 'RITENTA! Torna domani';
    } else {
      messaggioRuota.textContent = 'NIENTE! Riprova domani';
    }

    saldoDisplay.textContent = saldo;
    localStorage.setItem('ultimoGiroRuota', getDataOggi());
    aggiornaStatoRuota();

    if (saldo <= 0) {
      saldo = 500;
      saldoDisplay.textContent = saldo;
    }
  }

  btnGira.addEventListener('click', giraRuota);

  // disegno iniziale + stato
  disegnaRuota(rotazioneAttuale);
  aggiornaStatoRuota();

  // ============================================================
  //  SCHEDINE CALCIO
  // ============================================================
  const squadre = [
    { nome: 'Juventus', img: IMG_PALLONE },
    { nome: 'Inter',    img: IMG_PALLONE },
    { nome: 'Milan',    img: IMG_PALLONE },
    { nome: 'Roma',     img: IMG_PALLONE },
    { nome: 'Napoli',   img: IMG_PALLONE },
    { nome: 'Lazio',    img: IMG_PALLONE }
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

  const saldoDisplay = document.getElementById('saldoDisplay');
  const matchList = document.getElementById('matchList');
  const horseList = document.getElementById('horseList');
  const messaggioCavalli = document.getElementById('messaggioCavalli');

  function aggiornaSaldo() {
    saldoDisplay.textContent = saldo;
  }

  function renderCalcio() {
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

  // ============================================================
  //  FANTASMINI
  // ============================================================
  const fantasmini = [
    { nome: 'Blinky',  img: IMG_FANTASMINO, quota: 2.5 },
    { nome: 'Pinky',   img: IMG_FANTASMINO, quota: 3.2 },
    { nome: 'Inky',    img: IMG_FANTASMINO, quota: 4.0 },
    { nome: 'Clyde',   img: IMG_FANTASMINO, quota: 5.5 },
    { nome: 'Spettro', img: IMG_FANTASMINO, quota: 6.0 }
  ];
  let fantasminoSelezionato = null;

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

  // ============================================================
  //  GIOCO CALCIO
  // ============================================================
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

  // ============================================================
  //  GIOCO FANTASMINI
  // ============================================================
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

  // ============================================================
  //  AVVIO
  // ============================================================
  aggiornaSaldo();
  renderCalcio();
  renderFantasmini();
})();
