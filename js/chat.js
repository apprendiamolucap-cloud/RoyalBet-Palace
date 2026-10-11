// ============================================================
//  CHAT GLOBALE — v1
//  Chat in tempo reale con Firebase Realtime Database
//  Supporta: menzioni @nome, cancellazione propri messaggi
// ============================================================
(function() {

  let chatInizializzata = false;
  let ultimoInvio = 0;
  const COOLDOWN_INVIO = 1500; // 1.5 secondi
  let unsubscribeMessages = null;
  let unsubscribeOnline = null;
  let utentiBannati = {};

  // ===== INIZIALIZZAZIONE =====
  function initChat() {
    if (chatInizializzata) return;
    chatInizializzata = true;

    const input = document.getElementById('chatInput');
    const btn = document.getElementById('chatSendBtn');

    if (!input || !btn) return;

    // Invio con pulsante
    btn.addEventListener('click', inviaMessaggio);

    // Invio con tasto Invio
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        inviaMessaggio();
      }
    });

    // Rileva quando l'utente è sulla pagina chat
    // (carica i messaggi solo quando serve)
  }

  // ===== AVVIA LA CHAT =====
  async function avviaChat() {
    if (!window.RB || !window.RB.utenteCorrente) return;

    const messagesEl = document.getElementById('chatMessages');
    if (!messagesEl) return;

    // Prima volta: mostra caricamento
    if (!messagesEl.dataset.caricato) {
      messagesEl.innerHTML = '<div class="chat-loading">Caricamento messaggi...</div>';
    }

    // Carica lista ban (per tutti, così sappiamo chi filtrare)
    await caricaBanList();

    // Ascolta i messaggi in tempo reale (ultimi 50)
    if (unsubscribeMessages) unsubscribeMessages();

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

    // Aggiorna stato "online" (contatore semplice)
    aggiornaContatoreOnline();
  }

  // ===== RENDER MESSAGGI =====
  function renderMessaggi(messaggi) {
    const messagesEl = document.getElementById('chatMessages');
    if (!messagesEl) return;

    const utenteCorrente = window.RB.utenteCorrente;
    const p = window.RB.profiloCorrente || {};
    const isAdmin = p.isAdmin === true;

    if (messaggi.length === 0) {
      messagesEl.innerHTML = '<div class="chat-empty">💬 Nessun messaggio ancora. Scrivi tu il primo!</div>';
      return;
    }

    // Ordina per timestamp crescente (i più vecchi in alto)
    messaggi.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    // Era già scrollato in fondo?
    const eraInFondo = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 100;

    messagesEl.innerHTML = '';

    messaggi.forEach(msg => {
      // Salta i messaggi di utenti bannati (solo se non sei admin)
      if (!isAdmin && utentiBannati[msg.uid]) {
        return;
      }

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

      // Contenuto
      const content = document.createElement('div');
      content.className = 'chat-msg-content';

      // Header (nome + badge + ora)
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
      if (msg.coloreNome && msg.coloreNome !== 'rainbow') {
        nome.style.color = msg.coloreNome;
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

      // Testo con menzioni evidenziate
      const testo = document.createElement('div');
      testo.className = 'chat-msg-testo';
      testo.innerHTML = evidenziaMenzioni(msg.testo || '');
      content.appendChild(testo);

      div.appendChild(content);

      // Pulsante cancella
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

      messagesEl.appendChild(div);
    });

    // Scroll in fondo se era già in fondo o se è il primo caricamento
    if (eraInFondo || !messagesEl.dataset.scrollato) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
      messagesEl.dataset.scrollato = '1';
    }
  }

  // ===== FORMATTA ORA =====
  function formattaOra(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const ore = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return ore + ':' + min;
  }

  // ===== EVIDENZIA MENZIONI @nome =====
  function evidenziaMenzioni(testo) {
    // Prima escape HTML per sicurezza
    const esc = testo
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Evidenzia @nome
    return esc.replace(/@([a-zA-Z0-9_]{2,20})/g, '<span class="menzione">@$1</span>');
  }

  // ===== INVIA MESSAGGIO =====
  async function inviaMessaggio() {
    if (!window.RB || !window.RB.utenteCorrente) return;

    const input = document.getElementById('chatInput');
    const btn = document.getElementById('chatSendBtn');
    if (!input || !btn) return;

    const testo = input.value.trim();
    if (!testo) return;

    // Cooldown anti-spam
    const ora = Date.now();
    if (ora - ultimoInvio < COOLDOWN_INVIO) {
      const rimasti = ((COOLDOWN_INVIO - (ora - ultimoInvio)) / 1000).toFixed(1);
      window.RB.mostraPopup('ASPETTA', 'Puoi inviare un altro messaggio tra ' + rimasti + 's', 'sconfitta');
      return;
    }

    // Controlla se sei bannato
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

  // ===== CANCELLA MESSAGGIO =====
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

  // ===== CARICA LISTA BAN =====
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
      // Se non c'è il nodo ban, non è un errore
      utentiBannati = {};
    }
  }

  // ===== CONTATORE ONLINE =====
  function aggiornaContatoreOnline() {
    const contatore = document.getElementById('chatOnlineCount');
    if (!contatore) return;

    // Semplice: mostra un numero casuale tra 1 e 5 per ora
    // (in futuro si può implementare con Firebase presence)
    const num = 1 + Math.floor(Math.random() * 4);
    contatore.textContent = num;
  }

  // ===== AGGIORNA QUANDO L'UTENTE CAMBIA PAGINA =====
  window.RB_quandoEntraInChat = function() {
    // Piccolo delay per assicurarsi che il DOM sia pronto
    setTimeout(avviaChat, 100);
  };

  // ===== ESPOSIZIONE GLOBALE =====
  function attesaRB(callback) {
    if (window.RB) callback();
    else setTimeout(() => attesaRB(callback), 50);
  }

  attesaRB(() => {
    window.RB.initChat = initChat;
    window.RB.avviaChat = avviaChat;
    window.RB.ricaricaBanList = caricaBanList;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initChat);
    } else {
      initChat();
    }

    // Avvia la chat quando l'utente è loggato
    const controlla = setInterval(() => {
      if (window.RB.utenteCorrente) {
        clearInterval(controlla);
        // Aspetta che il DOM della chat sia caricato
        setTimeout(() => {
          // Ascolta quando la pagina chat diventa attiva
          const observer = setInterval(() => {
            const pageChat = document.getElementById('page-chat');
            if (pageChat && pageChat.classList.contains('active')) {
              avviaChat();
            }
          }, 500);
        }, 500);
      }
    }, 500);
  });
})();
