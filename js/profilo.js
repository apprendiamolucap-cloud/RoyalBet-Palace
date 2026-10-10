// ============================================================
//  PROFILO UTENTE
// ============================================================
(function() {

  function initProfilo() {
    const btnProfilo = document.getElementById('btnProfilo');
    const chiudi = document.getElementById('chiudiProfilo');
    const salva = document.getElementById('salvaProfilo');
    const modale = document.getElementById('modaleProfilo');
    if (!btnProfilo) return;

    btnProfilo.addEventListener('click', apriProfilo);
    chiudi.addEventListener('click', () => modale.classList.remove('show'));
    salva.addEventListener('click', salvaProfilo);
  }

  function apriProfilo() {
    if (!window.RB.profiloCorrente) return;
    const p = window.RB.profiloCorrente;

    document.getElementById('profiloAvatarImg').src =
      p.avatarUrl || window.RB.utenteCorrente?.photoURL || 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png';
    document.getElementById('profiloNome').value = p.nome || '';
    document.getElementById('profiloAvatarUrl').value = p.avatarUrl || '';
    document.getElementById('profiloBio').value = p.bio || '';
    document.getElementById('profiloCrediti').textContent = window.RB.saldo;

    // Renderizza selettori colore/badge
    if (window.RB.renderizzaPersonalizzazioni) window.RB.renderizzaPersonalizzazioni();

    document.getElementById('modaleProfilo').classList.add('show');
  }

  async function salvaProfilo() {
    if (!window.RB.utenteCorrente) return;
    const p = window.RB.profiloCorrente;

    p.nome = document.getElementById('profiloNome').value.trim() || 'Giocatore';
    p.avatarUrl = document.getElementById('profiloAvatarUrl').value.trim();
    p.bio = document.getElementById('profiloBio').value.trim();

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
      document.getElementById('modaleProfilo').classList.remove('show');
      if (window.RB.aggiornaClassifica) window.RB.aggiornaClassifica();
    } catch (e) {
      console.error('Errore salvataggio profilo:', e);
    }
  }

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
