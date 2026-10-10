// ============================================================
//  NEGOZIO GEMME — acquisti, moltiplicatori, cosmetici, case
// ============================================================
(function() {

  // ===== CATALOGO PRODOTTI =====
  const PRODOTTI = {
    'moltiplicatore-x2': {
      nome: 'Moltiplicatore x2',
      costo: 5,
      tipo: 'moltiplicatore',
      durata: 120000,  // 2 minuti
      valore: 'x2'
    },
    'moltiplicatore-x5': {
      nome: 'Moltiplicatore x5',
      costo: 15,
      tipo: 'moltiplicatore',
      durata: 60000,  // 1 minuto
      valore: 'x5'
    },
    'colore-arcobaleno': {
      nome: 'Colore Arcobaleno',
      costo: 10,
      tipo: 'cosmetico',
      cosmeticoId: 'colore-arcobaleno',
      colore: 'rainbow'
    },
    'badge-corona': {
      nome: 'Badge Corona',
      costo: 20,
      tipo: 'cosmetico',
      cosmeticoId: 'badge-corona',
      badge: '👑'
    },
    'casa-baracca': {
      nome: 'Baracca',
      costo: 25,
      tipo: 'casa',
      casaId: 'baracca',
      max: 10
    },
    'casa-villa': {
      nome: 'Villa',
      costo: 80,
      tipo: 'casa',
      casaId: 'villa',
      max: 10
    },
    'casa-castello': {
      nome: 'Castello',
      costo: 300,
      tipo: 'casa',
      casaId: 'castello',
      max: 10
    },
    'rigira-ruota': {
      nome: 'Rigira la Ruota',
      costo: 3,
      tipo: 'rigira'
    }
  };

  function initNegozio() {
    document.querySelectorAll('.btn-compra').forEach(btn => {
      btn.addEventListener('click', () => {
        const shopId = btn.dataset.shop;
        if (shopId) compra(shopId);
      });
    });
  }

  async function compra(shopId) {
    if (!window.RB.utenteCorrente) return;
    const prodotto = PRODOTTI[shopId];
    if (!prodotto) return;

    const p = window.RB.profiloCorrente;
    const gemmeAttuali = p.gemme || 0;

    // ===== CONTROLLO SALDO =====
    if (gemmeAttuali < prodotto.costo) {
      window.RB.mostraPopup('GEMME INSUFFICIENTI', 'Ti servono ' + prodotto.costo + ' gemme', 'sconfitta');
      return;
    }

    // ===== CONTROLLO LIMITI CASE =====
    if (prodotto.tipo === 'casa') {
      const casePossedute = p.case[prodotto.casaId] || 0;
      if (casePossedute >= prodotto.max) {
        window.RB.mostraPopup('LIMITE RAGGIUNTO', 'Hai già ' + prodotto.max + ' ' + prodotto.nome, 'sconfitta');
        return;
      }
    }

    // ===== CONTROLLO COSMETICI GIÀ SBLOCCATI =====
    if (prodotto.tipo === 'cosmetico') {
      const sbloccati = p.cosmeticiSbloccati || [];
      if (sbloccati.includes(prodotto.cosmeticoId)) {
        window.RB.mostraPopup('GIÀ SBLOCCATO', 'Possiedi già ' + prodotto.nome, 'sconfitta');
        return;
      }
    }

    // ===== APPLICA L'ACQUISTO =====
    p.gemme -= prodotto.costo;
    let aggiornamenti = { gemme: p.gemme };

    if (prodotto.tipo === 'moltiplicatore') {
      p.moltiplicatore = {
        tipo: prodotto.valore,
        scadenza: Date.now() + prodotto.durata
      };
      aggiornamenti.moltiplicatore = p.moltiplicatore;
      const durataSecondi = prodotto.durata / 1000;
      window.RB.mostraPopup('MOLTIPLICATORE ATTIVO', prodotto.valore + ' per ' + durataSecondi + ' secondi', 'gemma');

    } else if (prodotto.tipo === 'cosmetico') {
      if (!p.cosmeticiSbloccati) p.cosmeticiSbloccati = [];
      p.cosmeticiSbloccati.push(prodotto.cosmeticoId);
      aggiornamenti.cosmeticiSbloccati = p.cosmeticiSbloccati;
      window.RB.mostraPopup('COSMETICO SBLOCCATO', prodotto.nome + ' è ora disponibile nel profilo', 'gemma');

    } else if (prodotto.tipo === 'casa') {
      if (!p.case) p.case = { baracca: 0, villa: 0, castello: 0 };
      p.case[prodotto.casaId] = (p.case[prodotto.casaId] || 0) + 1;
      p.ultimoRiscattoCase = Date.now(); // reset timer per evitare guadagni enormi
      aggiornamenti.case = p.case;
      aggiornamenti.ultimoRiscattoCase = p.ultimoRiscattoCase;
      window.RB.mostraPopup('CASA ACQUISTATA', 'Ora possiedi ' + p.case[prodotto.casaId] + ' ' + prodotto.nome, 'gemma');

    } else if (prodotto.tipo === 'rigira') {
      // Sblocca la ruota per oggi
      const chiave = window.RB.utenteCorrente
        ? 'ultimoGiroRuota_' + window.RB.utenteCorrente.uid
        : 'ultimoGiroRuota_ospite';
      localStorage.removeItem(chiave);
      if (window.RB.aggiornaStatoRuota) window.RB.aggiornaStatoRuota();
      window.RB.mostraPopup('RUOTA SBLOCCATA', 'Puoi girare di nuovo adesso!', 'gemma');
    }

    // Salva tutto su Firebase
    try {
      await window.RB.salvaProfilo(aggiornamenti);
    } catch (e) {
      console.error('Errore acquisto:', e);
    }

    // Aggiorna UI
    window.RB.aggiornaValute();
    if (window.RB.renderizzaCase) window.RB.renderizzaCase();
    if (window.RB.renderizzaPersonalizzazioni) window.RB.renderizzaPersonalizzazioni();
  }

  // ===== RENDERIZZA LE CASE POSSEDUTE =====
  function renderizzaCase() {
    const cont = document.getElementById('caseGrid');
    if (!cont) return;
    const p = window.RB.profiloCorrente;
    if (!p) return;
    const casePossedute = p.case || { baracca: 0, villa: 0, castello: 0 };

    const totale = casePossedute.baracca + casePossedute.villa + casePossedute.castello;
    if (totale === 0) {
      cont.innerHTML = '<p class="case-vuoto">Non possiedi ancora nessuna casa</p>';
      return;
    }

    const caseInfo = {
      baracca: { emoji: '🏠', nome: 'Baracca', produzione: 1 },
      villa: { emoji: '🏡', nome: 'Villa', produzione: 5 },
      castello: { emoji: '🏰', nome: 'Castello', produzione: 20 }
    };

    cont.innerHTML = '';
    Object.keys(casePossedute).forEach(tipo => {
      const quantita = casePossedute[tipo] || 0;
      if (quantita <= 0) return;
      const info = caseInfo[tipo];

      const card = document.createElement('div');
      card.className = 'case-card';

      const emoji = document.createElement('span');
      emoji.className = 'case-emoji';
      emoji.textContent = info.emoji;

      const nome = document.createElement('div');
      nome.className = 'case-nome';
      nome.textContent = info.nome + ' ×' + quantita;

      const prod = document.createElement('div');
      prod.className = 'case-prod';
      prod.textContent = 'Produzione: ' + (info.produzione * quantita) + ' cr/min';

      const acc = document.createElement('div');
      acc.className = 'case-accumulo';
      acc.textContent = 'Si accumula mentre sei online';

      card.appendChild(emoji);
      card.appendChild(nome);
      card.appendChild(prod);
      card.appendChild(acc);
      cont.appendChild(card);
    });
  }

  function attesaRB(callback) {
    if (window.RB) callback();
    else setTimeout(() => attesaRB(callback), 50);
  }

  attesaRB(() => {
    window.RB.initNegozio = initNegozio;
    window.RB.compra = compra;
    window.RB.renderizzaCase = renderizzaCase;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initNegozio);
    } else {
      initNegozio();
    }
  });
})();
