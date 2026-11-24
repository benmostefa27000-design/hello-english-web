/* Mode guidé : un seul gros bouton, Bloop enchaîne les activités du jour dans l'ordre.
   Activé par le parent (Réglages). Le reste de l'appli est caché pendant ce temps. */
'use strict';

const Guided = {
  META: { lesson: ['🎯', 'Leçon'], review: ['☀️', 'Révision'], challenge: ['⭐', 'Défi'], fun: ['🎵', 'Cadeau'] },
  on: () => !!Store.settings().guided,
  kinds() {
    const n = Store.settings().guidedN || 4;
    return n <= 3 ? ['lesson', 'review', 'fun'] : n === 4 ? ['lesson', 'review', 'lesson', 'fun'] : ['lesson', 'review', 'lesson', 'challenge', 'fun'];
  },
  index: () => Store.guided().i,
  finished() { return this.index() >= this.kinds().length; },
  active: false, // vrai pendant une activité lancée par le mode guidé

  /* lance l'activité suivante (replace : depuis l'écran de récompense) */
  start(replace) {
    const kind = this.kinds()[this.index()];
    if (!kind) return Nav.home();
    this.active = true;
    const go = replace ? Nav.replace : Nav.go;
    const day = Math.floor(Date.now() / 864e5);
    if (kind === 'fun') {
      if (day % 2 === 0 && SONGS.length) return go('song', { id: SONGS[day % SONGS.length].id });
      const s = STORIES.find(x => !Store.done('stories', x.id)) || STORIES[day % STORIES.length];
      return go('story', { id: s.id });
    }
    let l = null;
    if (kind === 'review' && Object.keys(ITEM).some(k => Store.level(k) > 0)) l = dailyReview();
    if (kind === 'challenge') l = dailyChallenge();
    if (!l) l = nextLesson() || dailyChallenge();
    openLesson(l, replace);
  },

  /* appelé à la fin de chaque activité */
  complete() {
    if (!this.active) return false;
    this.active = false;
    Store.guidedStep(this.kinds().length);
    return true;
  },

  /* bloc de l'accueil : les étapes du jour + le gros bouton */
  card(name) {
    this.active = false;
    const kinds = this.kinds(), i = this.index(), done = i >= kinds.length;
    const steps = h('div', { class: 'g-steps' }, kinds.map((k, j) =>
      h('div', { class: 'g-step' + (j < i ? ' ok' : j === i ? ' now' : '') },
        h('span', null, j < i ? '✅' : this.META[k][0]), h('small', null, this.META[k][1]))));
    return h('div', { class: 'guided' + (done ? ' done' : '') }, steps,
      done ? h('div', { class: 'g-done' }, h('b', null, `Bravo ${name} ! C’est fini pour aujourd’hui 🎉`), h('small', null, 'À demain !'))
        : h('button', { class: 'btn big go g-start', onclick: () => Guided.start() }, i ? 'On continue ! ▶' : 'On commence ! ▶'));
  },
};
