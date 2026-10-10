// ============================================================
//  ROYALBET PALACE — SCRIPT PRINCIPALE (v3 - fix Firebase)
// ============================================================

window.addEventListener('firebaseReady', () => {
  avviaGioco();
});

function avviaGioco() {
  const { auth, db, provider, signInWithPopup, signOut, onAuthStateChanged, ref, get, set, update } = window.FB;

  // ===== STATO GLOBALE =====
  window.RB = {
    saldo: 500,
    utenteCorrente: null,
    profiloCorrente: null,
    db, ref, get, set, update, auth
  };

  const IMG_PALLONE = 'https://cdn-icons-png.flaticon.com/128/12065/12065246.png';
  const IMG_FANTASMINO = 'https://cdn-icons-png.flaticon.com/128/706/706023.png';
  window.RB.IMG_PALLONE = IMG_PALLONE;
  window.RB.IMG_FANTASMINO = IMG_FANTASMINO;

  // ===== RIFERIMENTI DOM =====
  const schermataLogin = document.getElementById('schermataLogin');
  const contenutoGioco = document.getElementById('contenutoGioco');
  const userLoggedOut = document.getElementById('userLoggedOut');
  const userLoggedIn = document.getElementById('userLoggedIn');
  const loginBtn = document.getElementById('loginBtn');
  const loginBtnWall = document.getElementById('loginBtnWall');
  const logoutBtn = document.getElementById('logoutBtn');
  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');
  const btnProfilo = document.getElementById('btnProfilo');
  const saldoDisplay = document.getElementById('saldoDisplay');

  window.RB.saldoDisplay = saldoDisplay;
  window.RB.userAvatar = userAvatar;
  window.RB.userName = userName;

  // ===== FUNZIONI BASE =====
  window.RB.aggiornaSaldo = function() {
    if (saldoDisplay) saldoDisplay.textContent = window.RB.saldo;
  };

  window.RB.salvaSaldo = async function() {
    if (!window.RB.utenteCorrente) return;
    try {
      const r = ref(db, 'utenti/' + window.RB.utenteCorrente.uid);
      await update(r, {
        saldo: window.RB.saldo,
        ultimoAccesso: Date.now()
      });
    } catch (e) {
      console.error('Errore salvataggio saldo:', e);
    }
  };

  window.RB.aggiornaNomeUI = function() {
  if (!window.RB.profiloCorrente) return;
  const p = window.RB.profiloCorrente;
  if (userName) {
    userName.textContent = (p.nome || 'Giocatore') + (p.badge ? ' ' + p.badge : '');
    // Reset classi/stili precedenti
    userName.classList.remove('rainbow');
    userName.style.background = '';
    userName.style.webkitBackgroundClip = '';
    userName.style.backgroundClip = '';
    userName.style.webkitTextFillColor = '';
    userName.style.color = '';

    if (p.coloreNome === 'rainbow') {
      userName.classList.add('rainbow');
    } else {
      userName.style.color = p.coloreNome || '#ffd966';
    }
  }
  const av = p.avatarUrl || (window.RB.utenteCorrente && window.RB.utenteCorrente.photoURL);
  if (av && userAvatar) userAvatar.src = av;
};

  // ===== ROUTER =====
  window.RB.vaiA = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');

    document.querySelectorAll('.nav-page').forEach(b => {
      b.classList.toggle('active', b.dataset.page === pageId);
    });

    if (pageId === 'classifica' && window.RB.aggiornaClassifica) window.RB.aggiornaClassifica();
    if (pageId === 'banca' && window.RB.aggiornaBanca) window.RB.aggiornaBanca();
    if (pageId === 'codici' && window.RB.aggiornaCodici) window.RB.aggiornaCodici();
  };

  document.querySelectorAll('.nav-page').forEach(btn => {
    btn.addEventListener('click', () => window.RB.vaiA(btn.dataset.page));
  });

  document.querySelectorAll('.home-card').forEach(card => {
    card.addEventListener('click', () => window.RB.vaiA(card.dataset.goto));
  });

  // ===== LOGIN / LOGOUT =====
  async function faiLogin() {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error('Errore login:', e);
    }
  }

  if (loginBtn) loginBtn.addEventListener('click', faiLogin);
  if (loginBtnWall) loginBtnWall.addEventListener('click', faiLogin);

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await window.RB.salvaSaldo();
      await signOut(auth);
    });
  }

  // ===== CARICA PROFILO =====
  window.RB.caricaProfilo = async function(user) {
    try {
      const r = ref(db, 'utenti/' + user.uid);
      const snapshot = await get(r);
      if (snapshot.exists()) {
        const dati = snapshot.val();
        // Completa campi mancanti senza sovrascrivere esistenti
        window.RB.profiloCorrente = {
          saldo: dati.saldo !== undefined ? dati.saldo : 500,
          nome: dati.nome || user.displayName || 'Giocatore',
          email: dati.email || user.email,
          avatarUrl: dati.avatarUrl || user.photoURL || '',
          bio: dati.bio || '',
          coloreNome: dati.coloreNome || '#ffd966',
          badge: dati.badge || '',
          codiciSbloccati: dati.codiciSbloccati || [],
          deposito: dati.deposito || 0,
          prestito: dati.prestito || 0,
          ultimoInteresseDeposito: dati.ultimoInteresseDeposito || Date.now(),
          ultimaVisitaFedelta: dati.ultimaVisitaFedelta || '',
          giorniFedelta: dati.giorniFedelta || 0,
          bonusFedeltaRiscattato: dati.bonusFedeltaRiscattato === true,
          stats: dati.stats || {
            calcio: { giocate: 0, vinte: 0 },
            fantasmini: { giocate: 0, vinte: 0 },
            ruota: { giri: 0, vinti: 0 }
          }
        };
        window.RB.saldo = window.RB.profiloCorrente.saldo;
      } else {
        // Nuovo profilo
        window.RB.saldo = 500;
        window.RB.profiloCorrente = {
          saldo: 500,
          nome: user.displayName || 'Giocatore',
          email: user.email,
          avatarUrl: user.photoURL || '',
          bio: '',
          coloreNome: '#ffd966',
          badge: '',
          codiciSbloccati: [],
          deposito: 0,
          prestito: 0,
          ultimoInteresseDeposito: Date.now(),
          ultimaVisitaFedelta: '',
          giorniFedelta: 0,
          bonusFedeltaRiscattato: false,
          stats: {
            calcio: { giocate: 0, vinte: 0 },
            fantasmini: { giocate: 0, vinte: 0 },
            ruota: { giri: 0, vinti: 0 }
          }
        };
        await set(r, window.RB.profiloCorrente);
      }
      window.RB.aggiornaSaldo();
      window.RB.aggiornaNomeUI();
    } catch (e) {
      console.error('Errore caricamento profilo:', e);
    }
  };

  // ===== REGISTRA VISITA FEDELTÀ (versione robusta) =====
  window.RB.registraVisitaFedelta = async function() {
    if (!window.RB.utenteCorrente || !window.RB.profiloCorrente) return;
    const oggi = new Date().toISOString().slice(0, 10);
    const p = window.RB.profiloCorrente;

    // Se già registrato oggi, esci
    if (p.ultimaVisitaFedelta === oggi) return;

    const ieri = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let nuoviGiorni;
    if (p.ultimaVisitaFedelta === ieri) {
      nuoviGiorni = (p.giorniFedelta || 0) + 1;
    } else {
      nuoviGiorni = 1;
    }

    p.ultimaVisitaFedelta = oggi;
    p.giorniFedelta = nuoviGiorni;
    if (typeof p.bonusFedeltaRiscattato !== 'boolean') {
      p.bonusFedeltaRiscattato = false;
    }

    try {
      const r = ref(db, 'utenti/' + window.RB.utenteCorrente.uid);
      await update(r, {
        ultimaVisitaFedelta: p.ultimaVisitaFedelta,
        giorniFedelta: p.giorniFedelta,
        bonusFedeltaRiscattato: p.bonusFedeltaRiscattato
      });
    } catch (e) {
      console.error('Errore fedeltà:', e);
    }
  };

  // ===== AUTH STATE =====
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      window.RB.utenteCorrente = user;
      if (schermataLogin) schermataLogin.style.display = 'none';
      if (contenutoGioco) contenutoGioco.style.display = 'block';
      if (userLoggedOut) userLoggedOut.style.display = 'none';
      if (userLoggedIn) userLoggedIn.style.display = 'flex';
      if (userAvatar) userAvatar.src = user.photoURL || 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png';
      if (userName) userName.textContent = user.displayName || user.email;

      await window.RB.caricaProfilo(user);
      await window.RB.registraVisitaFedelta();

      if (window.RB.aggiornaStatoRuota) window.RB.aggiornaStatoRuota();
      if (window.RB.renderCalcio) window.RB.renderCalcio();
      if (window.RB.renderFantasmini) window.RB.renderFantasmini();
      if (window.RB.aggiornaBanca) window.RB.aggiornaBanca();
      if (window.RB.aggiornaCodici) window.RB.aggiornaCodici();
    } else {
      window.RB.utenteCorrente = null;
      window.RB.profiloCorrente = null;
      if (schermataLogin) schermataLogin.style.display = 'flex';
      if (contenutoGioco) contenutoGioco.style.display = 'none';
      if (userLoggedOut) userLoggedOut.style.display = 'block';
      if (userLoggedIn) userLoggedIn.style.display = 'none';
      window.RB.saldo = 500;
      window.RB.aggiornaSaldo();
    }
  });

  // ===== POPUP + CONFETTI =====
  const popupOverlay = document.getElementById('popupOverlay');
  const popupTitle = document.getElementById('popupTitle');
  const popupIcon = document.getElementById('popupIcon');
  const popupText = document.getElementById('popupText');
  const popupBtn = document.getElementById('popupBtn');
  const confettiCanvas = document.getElementById('confettiCanvas');
  const confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;

  let confettiParticles = [];
  let confettiAnim = null;

  function resizeConfetti() {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeConfetti);
  resizeConfetti();

  function lanciaConfetti() {
    if (!confettiCanvas || !confettiCtx) return;
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
        colore: colori[Math.floor(Math.random() * colori.length)]
      });
    }
    if (confettiAnim) cancelAnimationFrame(confettiAnim);
    animaConfetti();
  }

  function animaConfetti() {
    if (!confettiCtx || !confettiCanvas) return;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let attivi = 0;
    confettiParticles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      p.dy += 0.06;
      p.rot += p.rotSpeed;
      if (p.y > confettiCanvas.height + 40) {
        // morto
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
    if (attivi > 0) confettiAnim = requestAnimationFrame(animaConfetti);
    else confettiCanvas.style.display = 'none';
  }

  window.RB.mostraPopup = function(titolo, testo, tipo) {
    if (!popupOverlay) return;
    popupTitle.textContent = titolo;
    popupText.textContent = testo;
    if (tipo === 'vittoria') {
      popupIcon.textContent = '🏆';
      popupTitle.style.color = '#ffd966';
      lanciaConfetti();
    } else if (tipo === 'sconfitta') {
      popupIcon.textContent = '😞';
      popupTitle.style.color = '#ff8a8a';
    } else if (tipo === 'codice') {
      popupIcon.textContent = '🎟️';
      popupTitle.style.color = '#ffd966';
      lanciaConfetti();
    } else {
      popupIcon.textContent = '🎰';
      popupTitle.style.color = '#ffd966';
    }
    popupOverlay.classList.add('show');
  };

  if (popupBtn) {
    popupBtn.addEventListener('click', () => {
      popupOverlay.classList.remove('show');
    });
  }

  // ===== APPLICA INTERESSE DEPOSITO =====
  window.RB.applicaInteresseDeposito = async function() {
    if (!window.RB.utenteCorrente || !window.RB.profiloCorrente) return;
    const p = window.RB.profiloCorrente;
    if (!p.deposito || p.deposito <= 0) return;
    const ora = Date.now();
    const ultimo = p.ultimoInteresseDeposito || ora;
    const orePassate = (ora - ultimo) / 3600000;
    if (orePassate >= 24) {
      const cicli = Math.floor(orePassate / 24);
      const interesse = Math.floor(p.deposito * 0.02 * cicli);
      p.deposito += interesse;
      p.ultimoInteresseDeposito = ultimo + cicli * 86400000;
      try {
        const r = ref(db, 'utenti/' + window.RB.utenteCorrente.uid);
        await update(r, {
          deposito: p.deposito,
          ultimoInteresseDeposito: p.ultimoInteresseDeposito
        });
      } catch (e) {
        console.error('Errore interesse:', e);
      }
    }
  };

  // ===== AVVIO =====
  window.RB.aggiornaSaldo();

  // Applica interesse deposito al login
  setTimeout(() => {
    if (window.RB.applicaInteresseDeposito) window.RB.applicaInteresseDeposito();
  }, 2000);
}
