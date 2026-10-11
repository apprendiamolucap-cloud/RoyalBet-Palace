// ============================================================
//  CHAT GLOBALE — v3 definitiva
//  Fix flicker + rainbow + admin + ban
// ============================================================
(function() {

  let chatInizializzata = false;
  let chatAttiva = false;
  let ultimoInvio = 0;
  const COOLDOWN_INVIO = 1500;
  let unsubscribeMessages = null;
  let utentiBannati = {};

  // ===== INIT =====
  function initChat() {
    if (chatInizializzata) return;
    chatInizializzata = true;

    const input = document.getElementById('chatInput');
    const btn = document.getElementById('chatSendBtn');
    if (!input || !btn) return;

    btn.addEventListener('click', inviaMessaggio);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        inviaMessaggio();
      }
    });
  }

  // ===== ATTIVA CHAT (una sola volta) =====
  async function attivaChat() {
    if (chatAttiva) return;
    if (!window.RB || !window.RB.utenteCorrente) return;
    chatAttiva = true;

    const messagesEl = document.getElementById('chatMessages');
    if (!messagesEl) return;

    if (!messagesEl.dataset.caricato) {
      messagesEl.innerHTML = '<div class="chat-loading">Caricamento messaggi...</div>';
    }

    await caricaBanList();

    if (unsubscribeMessages) {
      unsubscribeMessages();
      unsubscribeMessages = null;
    }

    const { ref, db, query, limitToLast, onValue } = window.FB;
    const messaggiRef = ref(db, 'chat/messaggi');
    const q = query(messaggiRef, limitToLast(50));

    unsubscribeMessages = onValue(q, (snapshot) => {
      const messaggi = [];
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          messaggi.push({
            id: child.key,
            ...child.val()
          });
        });
      }
      renderMessaggi(messaggi);
      messagesEl.dataset.caricato = '1';
    }, (error) => {
      console.error('Errore lettura chat:', error);
      messagesEl.innerHTML = '<div class="chat-empty">Errore caricamento messaggi</div>';
    });

    aggiornaContatoreOnline();
  }

  // ===== RENDER =====
  function renderMessaggi(messaggi) {
    const messagesEl = document.getElementById('chatMessages');
    if (!messagesEl) return;

    const utenteCorrente = window.RB.utenteCorrente;
    const p = window.RB.profiloCorrente || {};
    const isAdmin = p.isAdmin === true;

    if (messaggi.length === 0) {
      if (messagesEl.querySelector('.chat-empty')) return;
      messagesEl.innerHTML = '<div class="chat-empty">💬 Nessun messaggio ancora. Scrivi tu il primo!</div>';
      return;
    }

    messaggi.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    const eraInFondo = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 120;

    const fragment = document.createDocumentFragment();

    messaggi.forEach(msg => {
      if (!isAdmin && utentiBannati[msg.uid]) return;
      fragment.appendChild(creaMessaggioElement(msg, utenteCorrente, isAdmin));
    });

    messagesEl.innerHTML = '';
    messagesEl.appendChild(fragment);

    if (eraInFondo || !messagesEl.dataset.scrollato) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
      messagesEl.dataset.scrollato = '1';
    }
  }

  // ===== CREA MESSAGGIO =====
  function creaMessaggioElement(msg, utenteCorrente, isAdmin) {
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.dataset.id = msg.id;

    const isMio = msg.uid === utenteCorrente.uid;
    const isMsgAdmin = msg.isAdmin === true;

    if (isMio) div.classList.add('mio');
    if (isMsgAdmin) div.classList.add('admin');

    // Avatar
    const avatar = document.createElement('img');
    avatar.className = 'chat-msg-avatar';
    avatar.src = msg.avatar || 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png';
    avatar.alt = msg.nome;
    avatar.onerror = () => {
      avatar.src = 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png';
    };
    div.appendChild(avatar);

    // Content
    const content = document.createElement('div');
    content.className = 'chat-msg-content';

    // Header
    const header = document.createElement('div');
    header.className = 'chat-msg-header';

    if (isMsgAdmin) {
      const adminTag = document.createElement('span');
      adminTag.className = 'chat-msg.admin-tag';
      adminTag.textContent = 'ADMIN';
      header.appendChild(adminTag);
    }

    const nome = document.createElement('span');
    nome.className = 'chat-msg-nome';

    // FIX RAINBOW (usa classe CSS)
    if (isMsgAdmin) {
      nome.classList.add('rainbow');
    } else if (msg.coloreNome === 'rainbow') {
      nome.classList.add('rainbow');
    } else if (msg.coloreNome) {
      nome.style.color = msg.coloreNome;
    } else {
      nome.style.color = '#ffd966';
    }

    nome.textContent = msg.nome || 'Anonimo';
    header.appendChild(nome);

    if (msg.badge) {
      const badge = document.createElement('span');
      badge.className = 'chat-msg-badge';
      badge.textContent = msg.badge;
      header.appendChild(badge);
    }

    const time = document.createElement('span');
    time.className = 'chat-msg-time';
    time.textContent = formattaOra(msg.timestamp);
    header.appendChild(time);

    content.appendChild(header);

    // Testo
    const testo = document.createElement('div');
    testo.className = 'chat-msg-testo';
    testo.innerHTML = evidenziaMenzioni(msg.testo || '');
    content.appendChild(testo);

    div.appendChild(content);

    // Cancella
    const puoCancellare = isMio || isAdmin;
    if (puoCancellare) {
      const btnDel = document.createElement('button');
      btnDel.className = 'chat-msg-delete';
      btnDel.textContent = '×';
      btnDel.title = 'Cancella messaggio';
      btnDel.addEventListener('click', (e) => {
        e.stopPropagation();
        cancellaMessaggio(msg.id);
      });
      div.appendChild(btnDel);
    }

    return div;
  }

  // ===== FORMATTA ORA =====
  function formattaOra(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const ore = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return ore + ':' + min;
  }

  // ===== MENZIONI =====
  function evidenziaMenzioni(testo) {
    const esc = testo
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return esc.replace(/@([a-zA-Z0-9_]{2,20})/g, '<span class="menzione">@$1</span>');
  }

  // ===== INVIA =====
  async function inviaMessaggio() {
    if (!window.RB || !window.RB.utenteCorrente) return;
    if (!chatAttiva) return;

    const input = document.getElementById('chatInput');
    const btn = document.getElementById('chatSendBtn');
    if (!input || !btn) return;

    const testo = input.value.trim();
    if (!testo) return;

    const ora = Date.now();
    if (ora - ultimoInvio < COOLDOWN_INVIO) {
      const rimasti = ((COOLDOWN_INVIO - (ora - ultimoInvio)) / 1000).toFixed(1);
      window.RB.mostraPopup('ASPETTA', 'Puoi inviare un altro messaggio tra ' + rimasti + 's', 'sconfitta');
      return;
    }

    const uid = window.RB.utenteCorrente.uid;
    if (utentiBannati[uid]) {
      window.RB.mostraPopup('BANNATO', 'Sei stato bannato dalla chat', 'sconfitta');
      return;
    }

    if (testo.length > 200) {
      window.RB.mostraPopup('TROPPO LUNGO', 'Massimo 200 caratteri', 'sconfitta');
      return;
    }

    ultimoInvio = ora;
    input.disabled = true;
    btn.disabled = true;

    const p = window.RB.profiloCorrente || {};
    const { ref, db, push, set } = window.FB;

    const messaggiRef = ref(db, 'chat/messaggi');
    const nuovoRef = push(messaggiRef);

    const messaggio = {
      uid: uid,
      nome: p.nome || window.RB.utenteCorrente.displayName || 'Anonimo',
      badge: p.badge || '',
      coloreNome: p.coloreNome || '#ffd966',
      avatar: p.avatarUrl || window.RB.utenteCorrente.photoURL || '',
      testo: testo,
      isAdmin: p.isAdmin === true,
      timestamp: Date.now()
    };

    try {
      await set(nuovoRef, messaggio);
      input.value = '';
    } catch (e) {
      console.error('Errore invio messaggio:', e);
      window.RB.mostraPopup('ERRORE', 'Impossibile inviare il messaggio', 'sconfitta');
    } finally {
      input.disabled = false;
      btn.disabled = false;
      input.focus();
    }
  }

  // ===== CANCELLA =====
  async function cancellaMessaggio(id) {
    if (!id) return;
    if (!confirm('Cancellare questo messaggio?')) return;

    const { ref, db, remove } = window.FB;
    const msgRef = ref(db, 'chat/messaggi/' + id);

    try {
      await remove(msgRef);
    } catch (e) {
      console.error('Errore cancellazione:', e);
      window.RB.mostraPopup('ERRORE', 'Non puoi cancellare questo messaggio', 'sconfitta');
    }
  }

  // ===== BAN LIST =====
  async function caricaBanList() {
    const { ref, db, get } = window.FB;
    try {
      const banRef = ref(db, 'admin/ban');
      const snap = await get(banRef);
      utentiBannati = {};
      if (snap.exists()) {
        snap.forEach(child => {
          utentiBannati[child.key] = child.val();
        });
      }
    } catch (e) {
      utentiBannati = {};
    }
  }

  // ===== CONTATORE ONLINE =====
  function aggiornaContatoreOnline() {
    const contatore = document.getElementById('chatOnlineCount');
    if (!contatore) return;
    const num = 1 + Math.floor(Math.random() * 4);
    contatore.textContent = num;
  }

  // ===== ESPOSIZIONE =====
  function attesaRB(callback) {
    if (window.RB) callback();
    else setTimeout(() => attesaRB(callback), 50);
  }

  attesaRB(() => {
    window.RB.initChat = initChat;
    window.RB.avviaChat = attivaChat;
    window.RB.ricaricaBanList = caricaBanList;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initChat);
    } else {
      initChat();
    }
  });
})();
