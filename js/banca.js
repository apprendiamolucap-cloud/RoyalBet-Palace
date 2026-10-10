// ============================================================
//  BANCA ROYALBET
// ============================================================
(function() {
  let bancaAttiva = false;

  function initBanca() {
    const btnDeposita = document.getElementById('btnDeposita');
    const btnRitira = document.getElementById('btnRitira');
    const btnPrestito = document.getElementById('btnPrestito');
    const btnRestituisci = document.getElementById('btnRestituisci');
    const btnBonusFedelta = document.getElementById('btnBonusFedelta');
    if (!btnDeposita) return;

    btnDeposita.addEventListener('click', deposita);
    btnRitira.addEventListener('click', ritira);
    btnPrestito.addEventListener('click', chiediPrestito);
    btnRestituisci.addEventListener('click', restituisciPrestito);
    btnBonusFedelta.addEventListener('click', riscattaFedelta);
  }

  function aggiornaBanca() {
    if (!window.RB || !window.RB.profiloCorrente) return;
    const p = window.RB.profiloCorrente;
    bancaAttiva = (window.RB.saldo >= 1000) || (p.deposito && p.deposito > 0);

    const bancaStato = document.getElementById('bancaStato');
    const bancaGrid = document.querySelector('.banca-grid');

    if (!bancaAttiva && window.RB.saldo < 1000) {
      bancaStato.innerHTML = 'Banca bloccata · Raggiungi <strong>1000 crediti</strong> per sbloccarla';
      if (bancaGrid) bancaGrid.style.opacity = '0.35';
      if (bancaGrid) bancaGrid.style.pointerEvents = 'none';
      return;
    }

    bancaStato.textContent = 'Deposita, chiedi prestiti e guadagna bonus fedeltà';
    if (bancaGrid) {
      bancaGrid.style.opacity = '1';
      bancaGrid.style.pointerEvents = 'auto';
    }

    const depositoTotale = document.getElementById('depositoTotale');
    const prestitoTotale = document.getElementById('prestitoTotale');
    const giorniFedelta = document.getElementById('giorniFedelta');
    const infoDeposito = document.getElementById('infoDeposito');
    const infoPrestito = document.getElementById('infoPrestito');
    const infoFedelta = document.getElementById('infoFedelta');

    if (depositoTotale) depositoTotale.textContent = p.deposito || 0;
    if (prestitoTotale) prestitoTotale.textContent = p.prestito || 0;
    if (giorniFedelta) giorniFedelta.textContent = p.giorniFedelta || 0;

    if (infoDeposito && p.deposito > 0) {
      const prossimo = (p.ultimoInteresseDeposito || Date.now()) + 86400000;
      const oreRimaste = Math.max(0, Math.ceil((prossimo - Date.now()) / 3600000));
      infoDeposito.textContent = 'Prossimo interesse tra ' + oreRimaste + ' ore (+2%)';
    } else if (infoDeposito) {
      infoDeposito.textContent = 'Nessun deposito attivo';
    }

    if (infoPrestito && p.prestito > 0) {
      infoPrestito.textContent = 'Restituisci ' + Math.floor(p.prestito * 1.2) + ' crediti per chiudere il prestito';
    } else if (infoPrestito) {
      infoPrestito.textContent = 'Nessun prestito attivo';
    }

    if (infoFedelta) {
      if (p.giorniFedelta >= 7 && !p.bonusFedeltaRiscattato) {
        infoFedelta.textContent = '🎁 Bonus disponibile! Clicca riscatta';
      } else {
        infoFedelta.textContent = 'Accedi ' + (7 - (p.giorniFedelta || 0)) + ' giorni ancora';
      }
    }
  }

  async function deposita() {
    const input = document.getElementById('importoDeposito');
    const importo = parseInt(input.value, 10);
    if (isNaN(importo) || importo < 1) {
      window.RB.mostraPopup('ATTENZIONE', 'Inserisci un importo valido', 'sconfitta');
      return;
    }
    if (importo > window.RB.saldo) {
      window.RB.mostraPopup('CREDITO INSUFFICIENTE', 'Non hai abbastanza crediti', 'sconfitta');
      return;
    }

    window.RB.saldo -= importo;
    window.RB.profiloCorrente.deposito = (window.RB.profiloCorrente.deposito || 0) + importo;
    window.RB.profiloCorrente.ultimoInteresseDeposito = Date.now();

    window.RB.aggiornaSaldo();
    await window.RB.salvaSaldo();

    const r = window.RB.ref(window.RB.db, 'utenti/' + window.RB.utenteCorrente.uid);
    await window.RB.update(r, {
      deposito: window.RB.profiloCorrente.deposito,
      ultimoInteresseDeposito: window.RB.profiloCorrente.ultimoInteresseDeposito
    });

    input.value = '';
    aggiornaBanca();
    window.RB.mostraPopup('DEPOSITO OK', 'Hai depositato ' + importo + ' crediti', 'vittoria');
  }

  async function ritira() {
    const input = document.getElementById('importoDeposito');
    const importo = parseInt(input.value, 10);
    if (isNaN(importo) || importo < 1) {
      window.RB.mostraPopup('ATTENZIONE', 'Inserisci un importo valido', 'sconfitta');
      return;
    }
    const deposito = window.RB.profiloCorrente.deposito || 0;
    if (importo > deposito) {
      window.RB.mostraPopup('IMPOSSIBILE', 'Non hai così tanto in deposito', 'sconfitta');
      return;
    }

    window.RB.profiloCorrente.deposito -= importo;
    window.RB.saldo += importo;

    window.RB.aggiornaSaldo();
    await window.RB.salvaSaldo();

    const r = window.RB.ref(window.RB.db, 'utenti/' + window.RB.utenteCorrente.uid);
    await window.RB.update(r, { deposito: window.RB.profiloCorrente.deposito });

    input.value = '';
    aggiornaBanca();
    window.RB.mostraPopup('RITIRO OK', 'Hai ritirato ' + importo + ' crediti', 'vittoria');
  }

  async function chiediPrestito() {
    if (window.RB.profiloCorrente.prestito > 0) {
      window.RB.mostraPopup('PRESTITO ATTIVO', 'Restituisci il prestito attuale prima', 'sconfitta');
      return;
    }
    const input = document.getElementById('importoPrestito');
    const importo = parseInt(input.value, 10);
    if (isNaN(importo) || importo < 100 || importo > 500) {
      window.RB.mostraPopup('ATTENZIONE', 'Importo tra 100 e 500 crediti', 'sconfitta');
      return;
    }

    window.RB.saldo += importo;
    window.RB.profiloCorrente.prestito = importo;

    window.RB.aggiornaSaldo();
    await window.RB.salvaSaldo();

    const r = window.RB.ref(window.RB.db, 'utenti/' + window.RB.utenteCorrente.uid);
    await window.RB.update(r, { prestito: importo });

    input.value = '';
    aggiornaBanca();
    window.RB.mostraPopup('PRESTITO OK', 'Hai ricevuto ' + importo + ' crediti', 'vittoria');
  }

  async function restituisciPrestito() {
    const p = window.RB.profiloCorrente;
    if (!p.prestito || p.prestito <= 0) {
      window.RB.mostraPopup('NESSUN PRESTITO', 'Non hai prestiti attivi', 'sconfitta');
      return;
    }
    const totale = Math.floor(p.prestito * 1.2);
    if (window.RB.saldo < totale) {
      window.RB.mostraPopup('CREDITO INSUFFICIENTE', 'Ti servono ' + totale + ' crediti', 'sconfitta');
      return;
    }

    window.RB.saldo -= totale;
    p.prestito = 0;

    window.RB.aggiornaSaldo();
    await window.RB.salvaSaldo();

    const r = window.RB.ref(window.RB.db, 'utenti/' + window.RB.utenteCorrente.uid);
    await window.RB.update(r, { prestito: 0 });

    aggiornaBanca();
    window.RB.mostraPopup('PRESTITO CHIUSO', 'Hai restituito ' + totale + ' crediti', 'vittoria');
  }

  async function riscattaFedelta() {
    const p = window.RB.profiloCorrente;
    if (p.giorniFedelta < 7 || p.bonusFedeltaRiscattato) {
      window.RB.mostraPopup('NON DISPONIBILE', 'Accedi 7 giorni di fila', 'sconfitta');
      return;
    }
    window.RB.saldo += 100;
    p.bonusFedeltaRiscattato = true;
    p.giorniFedelta = 0;

    window.RB.aggiornaSaldo();
    await window.RB.salvaSaldo();

    const r = window.RB.ref(window.RB.db, 'utenti/' + window.RB.utenteCorrente.uid);
    await window.RB.update(r, {
      bonusFedeltaRiscattato: true,
      giorniFedelta: 0
    });

    aggiornaBanca();
    window.RB.mostraPopup('BONUS!', '+100 crediti fedeltà', 'vittoria');
  }

  // Aspetta che window.RB esista
  function attesaRB(callback) {
    if (window.RB) callback();
    else setTimeout(() => attesaRB(callback), 50);
  }

  attesaRB(() => {
    window.RB.aggiornaBanca = aggiornaBanca;
    window.RB.initBanca = initBanca;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBanca);
    } else {
      initBanca();
    }
  });
})();
