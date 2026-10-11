// ============================================================
//  ADMIN SYSTEM — v1
//  Codice segreto, pannello admin, ban chat, risorse infinite
// ============================================================

(function() {

  // ⚠️ IL TUO CODICE ADMIN SEGRETO
  // Puoi cambiarlo quando vuoi, ma ricordatelo!
  const CODICE_ADMIN = 'ROYAL-HACK-2026';

  let adminAttivo = false;

  // ===== INIT =====
  function initAdmin() {
    // Pulsanti pannello
    const btnCrediti = document.getElementById('adminCrediti');
    const btnGemme = document.getElementById('adminGemme');
    const btnZucche = document.getElementById('adminZucche');
    const btnReset = document.getElementById('adminReset');
    const btnBan = document.getElementById('adminBanBtn');
    const btnUnban = document.getElementById('adminUnbanBtn');
    const btnExit = document.getElementById('adminExit');

    if (btnCrediti) btnCrediti.addEventListener('click', () => aggiungiCrediti(1000000));
    if (btnGemme) btnGemme.addEventListener('click', () => aggiungiGemme(10000));
    if (btnZucche) btnZucche.addEventListener('click', () => aggiungiZucche(10000));
    if (btnReset) btnReset.addEventListener('click', resetSaldo);
    if (btnBan) btnBan.addEventListener('click', bannaUtente);
    if (btnUnban) btnUnban.addEventListener('click', sbannaUtente);
    if (btnExit) btnExit.addEventListener('click', disattivaAdmin);
  }

  // ===== VERIFICA CODICE ADMIN (chiamata da codici.js) =====
  async function verificaCodiceAdmin(codice) {
    if (codice !== CODICE_ADMIN) return false;

    if (!window.RB || !window.RB.utenteCorrente) return false;

    const p = window.RB.profiloCorrente;
    p.isAdmin = true;

    try {
      await window.RB.salvaProfilo({ isAdmin: true });
    } catch (e) {
      console.error('Errore salvataggio admin:', e);
      return false;
    }

    attivaAdmin();

    // Popup speciale hacker
    setTimeout(() => {
      window.RB.mostraPopup(
        '⚡ MODALITÀ ADMIN',
        'Accesso hacker attivato! Benvenuto Santos_Lukas',
        'vittoria'
      );
    }, 300);

    return true;
  }

  // ===== ATTIVA ADMIN (visivamente) =====
  function attivaAdmin() {
    adminAttivo = true;

    // Mostra pulsante nel menu
    const navAdmin = document.getElementById('navAdmin');
    if (navAdmin) navAdmin.style.display = 'inline-block';

    // Attiva badge admin sul profilo
    const p = window.RB.profiloCorrente;
    if (p) {
      p.isAdmin = true;
      window.RB.aggiornaNomeUI();
    }

    // Carica la lista utenti nel pannello
    caricaListaUtenti();

    // Carica la lista ban
    caricaListaBan();

    // Metti un piccolo effetto di "hacking" in console
    console.log('%c⚡ MODALITÀ ADMIN ATTIVATA ⚡', 'color: #ff0000; font-size: 20px; font-weight: bold; text-shadow: 0 0 10px #ff0000;');
    console.log('%cAccesso riservato a Santos_Lukas', 'color: #ff6060; font-size: 14px;');
  }

  // ===== DISATTIVA ADMIN =====
  async function disattivaAdmin() {
    if (!confirm('Sei sicuro di voler disattivare la modalità admin?')) return;

    adminAttivo = false;
    const p = window.RB.profiloCorrente;
    p.isAdmin = false;

    try {
      await window.RB.salvaProfilo({ isAdmin: false });
    } catch (e) {
      console.error('Errore disattivazione admin:', e);
    }

    // Nascondi pulsante menu
    const navAdmin = document.getElementById('navAdmin');
    if (navAdmin) navAdmin.style.display = 'none';

    // Torna alla home
    if (window.RB.vaiA) window.RB.vaiA('home');

    window.RB.aggiornaNomeUI();
    window.RB.mostraPopup('ADMIN OFF', 'Modalità admin disattivata', 'sconfitta');
  }

  // ===== AGGIUNGI CREDITI =====
  async function aggiungiCrediti(quantita) {
    if (!adminAttivo) return;
    window.RB.saldo += quantita;
    window.RB.aggiornaSaldo();
    try {
      await window.RB.salvaProfilo({ saldo: window.RB.saldo });
      window.RB.mostraPopup('⚡ ADMIN', '+' + quantita.toLocaleString('it-IT') + ' crediti', 'vittoria');
    } catch (e) {
      console.error(e);
    }
  }

  // ===== AGGIUNGI GEMME =====
  async function aggiungiGemme(quantita) {
    if (!adminAttivo) return;
    const p = window.RB.profiloCorrente;
    p.gemme = (p.gemme || 0) + quantita;
    p.gemmeTotali = (p.gemmeTotali || 0) + quantita;
    window.RB.aggiornaValute();
    try {
      await window.RB.salvaProfilo({
        gemme: p.gemme,
        gemmeTotali: p.gemmeTotali
      });
      window.RB.mostraPopup('⚡ ADMIN', '+' + quantita.toLocaleString('it-IT') + ' gemme', 'gemma');
    } catch (e) {
      console.error(e);
    }
  }

  // ===== AGGIUNGI ZUCche =====
  async function aggiungiZucche(quantita) {
    if (!adminAttivo) return;
    const p = window.RB.profiloCorrente;
    p.zucche = (p.zucche || 0) + quantita;
    p.zuccheTotali = (p.zuccheTotali || 0) + quantita;
    window.RB.aggiornaValute();
    try {
      await window.RB.salvaProfilo({
        zucche: p.zucche,
        zuccheTotali: p.zuccheTotali
      });
      window.RB.mostraPopup('⚡ ADMIN', '+' + quantita.toLocaleString('it-IT') + ' zucche', 'gemma');
    } catch (e) {
      console.error(e);
    }
  }

  // ===== RESET SALDO =====
  async function resetSaldo() {
    if (!adminAttivo) return;
    if (!confirm('Sei sicuro di voler AZZERARE crediti e gemme?')) return;

    const p = window.RB.profiloCorrente;
    window.RB.saldo = 0;
    p.gemme = 0;
    window.RB.aggiornaSaldo();
    window.RB.aggiornaValute();

    try {
      await window.RB.salvaProfilo({ saldo: 0, gemme: 0 });
      window.RB.mostraPopup('⚡ ADMIN', 'Saldo azzerato', 'sconfitta');
    } catch (e) {
      console.error(e);
    }
  }

  // ===== LISTA UTENTI =====
  async function caricaListaUtenti() {
    const cont = document.getElementById('adminUsers');
    if (!cont) return;

    cont.innerHTML = '<div class="admin-loading">Caricamento utenti...</div>';

    try {
      const { ref, db, get } = window.FB;
      const r = ref(db, 'utenti');
      const snap = await get(r);

      if (!snap.exists()) {
        cont.innerHTML = '<div class="admin-empty">Nessun utente registrato</div>';
        return;
      }

      const utenti = [];
      snap.forEach(child => {
        utenti.push({
          uid: child.key,
          ...child.val()
        });
      });

      // Ordina per crediti decrescenti
      utenti.sort((a, b) => (b.saldo || 0) - (a.saldo || 0));

      cont.innerHTML = '';
      utenti.forEach(u => {
        const row = document.createElement('div');
        row.className = 'admin-user-row';

        const av = document.createElement('img');
        av.className = 'admin-user-avatar';
        av.src = u.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png';
        av.onerror = () => {
          av.src = 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png';
        };

        const info = document.createElement('div');
        info.className = 'admin-user-info';

        const nome = document.createElement('div');
        nome.className = 'admin-user-nome';
        nome.textContent = (u.nome || 'Anonimo') + (u.badge ? ' ' + u.badge : '') + (u.isAdmin ? ' 👨‍💻' : '');

        const uid = document.createElement('div');
        uid.className = 'admin-user-uid';
        uid.textContent = u.uid;

        info.appendChild(nome);
        info.appendChild(uid);

        const stats = document.createElement('div');
        stats.className = 'admin-user-stats';
        stats.innerHTML =
          '<div>🪙 ' + (u.saldo || 0).toLocaleString('it-IT') + '</div>' +
          '<div>💎 ' + (u.gemmeTotali || 0) + '</div>' +
          '<div>🎃 ' + (u.zuccheTotali || 0) + '</div>';

        row.appendChild(av);
        row.appendChild(info);
        row.appendChild(stats);
        cont.appendChild(row);
      });
    } catch (e) {
      console.error('Errore lista utenti:', e);
      cont.innerHTML = '<div class="admin-empty">Errore caricamento</div>';
    }
  }

  // ===== BAN / UNBAN =====
  async function bannaUtente() {
    if (!adminAttivo) return;
    const input = document.getElementById('adminBanUid');
    const uid = input.value.trim();

    if (!uid) {
      window.RB.mostraPopup('ERRORE', 'Inserisci un UID', 'sconfitta');
      return;
    }

    if (!confirm('Bannare l\'utente ' + uid + ' dalla chat?')) return;

    try {
      const { ref, db, set } = window.FB;
      const banRef = ref(db, 'admin/ban/' + uid);
      await set(banRef, {
        motivo: 'Bannato da admin',
        timestamp: Date.now()
      });

      input.value = '';
      window.RB.mostraPopup('⚡ ADMIN', 'Utente bannato dalla chat', 'sconfitta');
      if (window.RB.ricaricaBanList) await window.RB.ricaricaBanList();
      caricaListaBan();
    } catch (e) {
      console.error('Errore ban:', e);
      window.RB.mostraPopup('ERRORE', 'Impossibile bannare', 'sconfitta');
    }
  }

  async function sbannaUtente() {
    if (!adminAttivo) return;
    const input = document.getElementById('adminBanUid');
    const uid = input.value.trim();

    if (!uid) {
      window.RB.mostraPopup('ERRORE', 'Inserisci un UID', 'sconfitta');
      return;
    }

    try {
      const { ref, db, remove } = window.FB;
      const banRef = ref(db, 'admin/ban/' + uid);
      await remove(banRef);

      input.value = '';
      window.RB.mostraPopup('⚡ ADMIN', 'Utente sbannato', 'vittoria');
      if (window.RB.ricaricaBanList) await window.RB.ricaricaBanList();
      caricaListaBan();
    } catch (e) {
      console.error('Errore unban:', e);
      window.RB.mostraPopup('ERRORE', 'Impossibile sbannare', 'sconfitta');
    }
  }

  async function caricaListaBan() {
    const cont = document.getElementById('adminBanList');
    if (!cont) return;

    try {
      const { ref, db, get } = window.FB;
      const banRef = ref(db, 'admin/ban');
      const snap = await get(banRef);

      if (!snap.exists()) {
        cont.innerHTML = '<p class="admin-empty">Nessun utente bannato</p>';
        return;
      }

      const bannati = [];
      snap.forEach(child => {
        bannati.push({
          uid: child.key,
          ...child.val()
        });
      });

      // Prendi i nomi degli utenti bannati
      const utentiRef = ref(db, 'utenti');
      const utentiSnap = await get(utentiRef);
      const nomi = {};
      if (utentiSnap.exists()) {
        utentiSnap.forEach(child => {
          const u = child.val();
          nomi[child.key] = u.nome || 'Anonimo';
        });
      }

      cont.innerHTML = '';
      bannati.forEach(b => {
        const item = document.createElement('div');
        item.className = 'admin-ban-item';

        const info = document.createElement('div');
        const nome = document.createElement('div');
        nome.className = 'admin-ban-nome';
        nome.textContent = '🚫 ' + (nomi[b.uid] || 'Sconosciuto');

        const uid = document.createElement('div');
        uid.className = 'admin-ban-uid';
        uid.textContent = b.uid;

        info.appendChild(nome);
        info.appendChild(uid);
        item.appendChild(info);

        const btnSbanna = document.createElement('button');
        btnSbanna.className = 'play-btn small';
        btnSbanna.textContent = 'SBANNA';
        btnSbanna.style.background = 'linear-gradient(145deg, #c9a74b, #8a6d1c)';
        btnSbanna.addEventListener('click', async () => {
          document.getElementById('adminBanUid').value = b.uid;
          await sbannaUtente();
        });
        item.appendChild(btnSbanna);

        cont.appendChild(item);
      });
    } catch (e) {
      console.error('Errore lista ban:', e);
      cont.innerHTML = '<p class="admin-empty">Errore caricamento</p>';
    }
  }

  // ===== VERIFICA ALL'AVVIO (se è già admin) =====
  function controllaStatoAdmin() {
    if (!window.RB || !window.RB.profiloCorrente) return;
    if (window.RB.profiloCorrente.isAdmin === true) {
      attivaAdmin();
    }
  }

  // ===== ESPOSIZIONE =====
  function attesaRB(callback) {
    if (window.RB) callback();
    else setTimeout(() => attesaRB(callback), 50);
  }

  attesaRB(() => {
    window.RB.verificaCodiceAdmin = verificaCodiceAdmin;
    window.RB.attivaAdmin = attivaAdmin;
    window.RB.disattivaAdmin = disattivaAdmin;
    window.RB.CODICE_ADMIN = CODICE_ADMIN;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAdmin);
    } else {
      initAdmin();
    }

    // Controlla all'avvio se l'utente è già admin
    // Aspetta che il profilo sia caricato
    const checkAdmin = setInterval(() => {
      if (window.RB.utenteCorrente && window.RB.profiloCorrente) {
        clearInterval(checkAdmin);
        controllaStatoAdmin();
      }
    }, 500);
  });
})();
