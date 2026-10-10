// ============================================================
//  CLASSIFICA GLOBALE — v3 con tab Crediti/Gemme
// ============================================================
(function() {

  let tabAttiva = 'crediti';

  function initClassifica() {
    document.querySelectorAll('.classifica-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        tabAttiva = tab.dataset.tab;
        document.querySelectorAll('.classifica-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        aggiornaClassifica();
      });
    });
  }

  async function aggiornaClassifica() {
    if (!window.RB || !window.RB.utenteCorrente) return;
    const cont = document.getElementById('classificaList');
    if (!cont) return;

    try {
      const r = window.RB.ref(window.RB.db, 'utenti');
      const snapshot = await window.RB.get(r);
      if (!snapshot.exists()) {
        cont.innerHTML = '<div class="classifica-vuota">Nessun giocatore ancora</div>';
        return;
      }

      const utenti = [];
      snapshot.forEach(child => {
        const u = child.val();
        utenti.push({
          uid: child.key,
          nome: u.nome || 'Anonimo',
          bio: u.bio || '',
          avatarUrl: u.avatarUrl || '',
          saldo: u.saldo || 0,
          gemme: u.gemme || 0,
          gemmeTotali: u.gemmeTotali || 0,
          coloreNome: u.coloreNome || '#ffd966',
          badge: u.badge || ''
        });
      });

      // Ordina in base alla tab
      if (tabAttiva === 'gemme') {
        utenti.sort((a, b) => b.gemmeTotali - a.gemmeTotali);
      } else {
        utenti.sort((a, b) => b.saldo - a.saldo);
      }

      cont.innerHTML = '';
      utenti.slice(0, 100).forEach((u, i) => {
        const row = document.createElement('div');
        row.className = 'classifica-row';
        if (i === 0) row.classList.add('top1');
        if (i === 1) row.classList.add('top2');
        if (i === 2) row.classList.add('top3');
        if (u.uid === window.RB.utenteCorrente.uid) row.classList.add('tu');

        const pos = document.createElement('div');
        pos.className = 'classifica-pos';
        pos.textContent = '#' + (i + 1);

        const av = document.createElement('img');
        av.className = 'classifica-avatar';
        av.src = u.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png';
        av.alt = u.nome;

        const info = document.createElement('div');
        info.className = 'classifica-info';

        const nome = document.createElement('div');
        nome.className = 'classifica-nome';
        if (u.coloreNome === 'rainbow') {
          nome.classList.add('rainbow');
        } else {
          nome.style.color = u.coloreNome;
        }
        nome.textContent = u.nome + (u.badge ? ' ' + u.badge : '') + (u.uid === window.RB.utenteCorrente.uid ? ' (tu)' : '');
        info.appendChild(nome);

        if (u.bio) {
          const bio = document.createElement('div');
          bio.className = 'classifica-bio';
          bio.textContent = u.bio;
          info.appendChild(bio);
        }

        const crediti = document.createElement('div');
        crediti.className = 'classifica-crediti';

        if (tabAttiva === 'gemme') {
          crediti.textContent = '💎 ' + u.gemmeTotali;
          crediti.style.color = '#d0a0ff';
        } else {
          crediti.textContent = u.saldo + ' cr.';
        }

        row.appendChild(pos);
        row.appendChild(av);
        row.appendChild(info);
        row.appendChild(crediti);
        cont.appendChild(row);
      });
    } catch (e) {
      console.error('Errore classifica:', e);
      cont.innerHTML = '<div class="classifica-vuota">Errore caricamento</div>';
    }
  }

  function attesaRB(callback) {
    if (window.RB) callback();
    else setTimeout(() => attesaRB(callback), 50);
  }

  attesaRB(() => {
    window.RB.aggiornaClassifica = aggiornaClassifica;
    window.RB.initClassifica = initClassifica;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initClassifica);
    } else {
      initClassifica();
    }
  });
})();
