// ============================================================
//  PROFILO UTENTE — fix attesa window.RB
// ============================================================
(function() {

  function initProfilo() {
    const btnProfilo = document.getElementById('btnProfilo');
    const chiudi = document.getElementById('chiudiProfilo');
    const salva = document.getElementById('salvaProfilo');
    const modale = document.getElementById('modaleProfilo');
    if (!btnProfilo) return;

    btnProfilo.addEventListener('click', apriProfilo);
    if (chiudi) chiudi.addEventListener('click', () => modale.classList.remove('show'));
    if (salva) salva.addEventListener('click', salvaProfilo);
  }

  function apriProfilo() {
    if (!window.RB.profiloCorrente) return;
    const p = window.RB.profiloCorrente;

    const avatarImg = document.getElementById('profiloAvatarImg');
    if (avatarImg) {
      avatarImg.src = p.avatarUrl || (window.RB.utenteCorrente && window.RB.utenteCorrente.photoURL) ||
        'https://cdn-icons-png.flaticon.com/512/1077/1077114.png';
    }
    const nomeInput = document.getElementById('profiloNome');
    if (nomeInput) nomeInput.value = p.nome || '';
    const avatarInput = document.getElementById('profiloAvatarUrl');
    if (avatarInput) avatarInput.value = p.avatarUrl || '';
    const bioInput = document.getElementById('profiloBio');
    if (bioInput) bioInput.value = p.bio || '';
    const creditiDiv = document.getElementById('profiloCrediti');
    if (creditiDiv) creditiDiv.textContent = window.RB.saldo;

    // Renderizza selettori colore/badge
    if (window.RB.renderizzaPersonalizzazioni) {
      window.RB.renderizzaPersonalizzazioni();
    }

    const modale = document.getElementById('modaleProfilo');
    if (modale) modale.classList.add('show');
  }

  async function salvaProfilo() {
    if (!window.RB.utenteCorrente) return;
    const p = window.RB.profiloCorrente;

    const nomeInput = document.getElementById('profiloNome');
    const avatarInput = document.getElementById('profiloAvatarUrl');
    const bioInput = document.getElementById('profiloBio');

    p.nome = (nomeInput && nomeInput.value.trim()) || 'Giocatore';
    p.avatarUrl = (avatarInput && avatarInput.value.trim()) || '';
    p.bio = (bioInput && bioInput.value.trim()) || '';

    try {
      const r = window.RB.ref(window.RB.db, 'utenti/' + window.RB.utenteCorrente.uid);
      await window.RB.update(r, {
        nome: p.nome,
        avatarUrl: p.avatarUrl,
        bio: p.bio,
        coloreNome: p.coloreNome || '#ffd966',
        badge: p.badge || ''
      });

      window.RB.aggiornaNomeUI();
      window.RB.mostraPopup('PROFILO SALVATO', 'Le tue modifiche sono online', 'vittoria');

      const modale = document.getElementById('modaleProfilo');
      if (modale) modale.classList.remove('show');

      if (window.RB.aggiornaClassifica) window.RB.aggiornaClassifica();
    } catch (e) {
      console.error('Errore salvataggio profilo:', e);
    }
  }

  // Aspetta che window.RB esista
  function attesaRB(callback) {
    if (window.RB) callback();
    else setTimeout(() => attesaRB(callback), 50);
  }

  attesaRB(() => {
    window.RB.initProfilo = initProfilo;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initProfilo);
    } else {
      initProfilo();
    }
  });
})();
