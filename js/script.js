(function() {
  let saldo = 500;

  const IMG_PALLONE    = 'https://cdn-icons-png.flaticon.com/128/12065/12065246.png';
  const IMG_FANTASMINO = 'https://cdn-icons-png.flaticon.com/128/706/706023.png';

  // ============================================================
  //  POPUP VINCITA + CONFETTI
  // ============================================================
  const popupOverlay = document.getElementById('popupOverlay');
  const popupTitle = document.getElementById('popupTitle');
  const popupIcon = document.getElementById('popupIcon');
  const popupText = document.getElementById('popupText');
  const popupBtn = document.getElementById('popupBtn');
  const confettiCanvas = document.getElementById('confettiCanvas');
  const confettiCtx = confettiCanvas.getContext('2d');

  let confettiParticles = [];
  let confettiAnim = null;

  function resizeConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeConfetti);
  resizeConfetti();

  function lanciaConfetti() {
    confettiCanvas.style.display = 'block';
    confettiParticles = [];
    const colori = ['#ffd966', '#c9a74b', '#f5e7b0', '#3d6b48', '#ebc768', '#ff6b6b', '#ffdb8e'];
    for (let i = 0; i < 180; i++) {
      confettiParticles.push({
        x: Math.random() * confettiCanvas.width,
        y: -20 - Math.random() * 300,
        w: 8 + Math.random() * 8,
        h: 10 + Math.random() * 10,
        dx: -2 + Math.random() * 4,
        dy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: -0.15 + Math.random() * 0.3,
        colore: colori[Math.floor(Math.random() * colori.length)],
        vita: 1
      });
    }
    if (confettiAnim) cancelAnimationFrame(confettiAnim);
    animaConfetti();
  }

  function animaConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let attivi = 0;
    confettiParticles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      p.dy += 0.06;
      p.rot += p.rotSpeed;
      if (p.y > confettiCanvas.height + 40) {
        p.vita = 0;
      } else {
        attivi++;
        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate(p.rot);
        confettiCtx.fillStyle = p.colore;
        confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        confettiCtx.restore();
      }
    });
    if (attivi > 0) {
      confettiAnim = requestAnimationFrame(animaConfetti);
    } else {
      confettiCanvas.style.display = 'none';
    }
  }

  function mostraPopup(titolo, testo, tipo) {
    popupTitle.textContent = titolo;
    popupText.textContent = testo;

    if (tipo === 'vittoria') {
      popupIcon.textContent = '🏆';
      popupTitle.style.color = '#ffd966';
      lanciaConfetti();
    } else if (tipo === 'sconfitta') {
      popupIcon.textContent = '😞';
      popupTitle.style.color = '#ff8a8a';
    } else {
      popupIcon.textContent = '🎰';
      popupTitle.style.color = '#ffd966';
    }

    popupOverlay.classList.add('show');
  }

  popupBtn.addEventListener('click', () => {
    popupOverlay.classList.remove('show');
  });

  // ============================================================
  //  RUOTA DELLA FORTUNA
  // ============================================================
  const premi = [
    { label: '+50',    valore: 50,   tipo: 'crediti',        angolo: 22.5 },
    { label: 'x2',     valore: 2,    tipo: 'moltiplicatore', angolo: 67.5 },
    { label: '+100',   valore: 100,  tipo: 'crediti',        angolo: 112.5 },
    { label: 'Tenta',  valore: 0,    tipo: 'ritenta',        angolo: 157.5 },
    { label: '+250',   valore: 250,  tipo: 'crediti',        angolo: 202.5 },
    { label: 'Niente', valore: 0,    tipo: 'niente',         angolo: 247.5 },
    { label: '+500',   valore: 500,  tipo: 'crediti',        angolo: 292.5 },
    { label: '+1000',  valore: 1000, tipo: 'crediti',        angolo: 337.5 }
  ];

  const wheel = document.getElementById('wheel');
  const btnGira = document.getElementById('giraRuota');
  const messaggioRuota = document.getElementById('ruotaMessaggio');
  const timerRuota = document.getElementById('ruotaTimer');
  const saldoDisplay = document.getElementById('saldoDisplay');

  let rotazioneAttuale = 0;
  let inRotazione = false;

  function creaEtichette() {
    wheel.querySelectorAll('.label').forEach(el => el.remove());
    const raggio = 150;
    premi.forEach((premio) => {
      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = premio.label;
      const rad = (premio.angolo - 90) * Math.PI / 180;
      const x = Math.cos(rad) * raggio;
      const y = Math.sin(rad) * raggio;
      label.style.transform =
        'translate(' + x + 'px, ' + y + 'px)';
      wheel.appendChild(label);
    });
  }

  function getDataOggi() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function puoGirare() {
    return localStorage.getItem('ultimoGiroRuota') !== getDataOggi();
  }

  function aggiornaStatoRuota() {
    if (puoGirare()) {
      btnGira.disabled = false;
      btnGira.textContent = 'GIRA LA RUOTA';
      timerRuota.textContent = 'Hai 1 giro disponibile oggi';
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
    messaggioRuota.textContent = 'La ruota sta girando...';

    const indice = Math.floor(Math.random() * premi.length);
    const premio = premi[indice];
    const giriExtra = 6 + Math.floor(Math.random() * 3);
    const angoloTarget = 360 * giriExtra + (360 - premio.angolo);

    const partenza = rotazioneAttuale % 360;
    rotazioneAttuale += (angoloTarget - partenza);
    if (rotazioneAttuale < 0) rotazioneAttuale += 360 * giriExtra;

    wheel.style.transform = 'rotate(' + rotazioneAttuale + 'deg)';

    setTimeout(() => {
      fineGiro(premio);
    }, 5100);
  }

  function fineGiro(premio) {
    inRotazione = false;

    if (premio.tipo === 'crediti') {
      saldo += premio.valore;
      messaggioRuota.textContent = 'HAI VINTO ' + premio.valore + ' CREDITI!';
      mostraPopup('HAI VINTO!', '+' + premio.valore + ' crediti', 'vittoria');
    } else if (premio.tipo === 'moltiplicatore') {
      const bonus = saldo;
      saldo += bonus;
      messaggioRuota.textContent = 'MOLTIPLICATORE x2! +' + bonus + ' crediti';
      mostraPopup('MOLTIPLICATORE x2!', '+' + bonus + ' crediti', 'vittoria');
    } else if (premio.tipo === 'ritenta') {
      messaggioRuota.textContent = 'RITENTA! Torna domani';
      mostraPopup('RITENTA!', 'Torna domani per un altro giro', 'neutro');
    } else {
      messaggioRuota.textContent = 'NIENTE! Riprova domani';
      mostraPopup('NIENTE', 'Riprova domani!', 'sconfitta');
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

  creaEtichette();
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
    if (isNaN(puntata) || puntata < 1) {
      mostraPopup('ATTENZIONE', 'Inserisci una puntata valida', 'sconfitta');
      return;
    }
    if (puntata > saldo) {
      mostraPopup('CREDITO INSUFFICIENTE', 'Non hai abbastanza crediti', 'sconfitta');
      return;
    }

    const selezioni = partite.filter(p => p.selected !== null);
    if (selezioni.length === 0) {
      mostraPopup('ATTENZIONE', 'Seleziona almeno un esito', 'sconfitta');
      return;
    }

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
      mostraPopup('HAI VINTO!', '+' + vincita + ' crediti (quota ' + quotaTotale + ')', 'vittoria');
    } else {
      mostraPopup('HAI PERSO', 'Riprova con una nuova schedina', 'sconfitta');
    }

    partite = generaPartite();
    renderCalcio();
    aggiornaSaldo();
    puntataInput.value = Math.min(20, saldo) || 1;
    if (saldo <= 0) { saldo = 500; aggiornaSaldo(); }
  });

  // ============================================================
  //  GIOCO FANTASMINI
  // ============================================================
  document.getElementById('giocaCavalli').addEventListener('click', () => {
    const puntataInput = document.getElementById('puntataCavalli');
    const puntata = parseInt(puntataInput.value, 10);
    if (isNaN(puntata) || puntata < 1) {
      mostraPopup('ATTENZIONE', 'Inserisci una puntata valida', 'sconfitta');
      return;
    }
    if (puntata > saldo) {
      mostraPopup('CREDITO INSUFFICIENTE', 'Non hai abbastanza crediti', 'sconfitta');
      return;
    }
    if (fantasminoSelezionato === null) {
      mostraPopup('ATTENZIONE', 'Seleziona un fantasmino', 'sconfitta');
      return;
    }

    const f = fantasmini[fantasminoSelezionato];
    const esito = Math.random() < (1 / f.quota);

    saldo -= puntata;
    if (esito) {
      const vincita = Math.floor(puntata * f.quota);
      saldo += vincita;
      messaggioCavalli.textContent = f.nome + ' ha vinto! +' + vincita + ' crediti';
      mostraPopup('HAI VINTO!', f.nome + ' è arrivato primo! +' + vincita + ' crediti', 'vittoria');
    } else {
      messaggioCavalli.textContent = f.nome + ' non ha vinto. Riprova!';
      mostraPopup('HAI PERSO', f.nome + ' non ha vinto. Riprova!', 'sconfitta');
    }

    aggiornaSaldo();
    fantasminoSelezionato = null;
    renderFantasmini();
    puntataInput.value = Math.min(20, saldo) || 1;
    if (saldo <= 0) { saldo = 500; aggiornaSaldo(); }
  });

  // ============================================================
  //  AVVIO
  // ============================================================
  aggiornaSaldo();
  renderCalcio();
  renderFantasmini();
})();
