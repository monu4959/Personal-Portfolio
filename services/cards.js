// Service cards flip on hover via CSS. This adds tap-to-flip for touch screens and
// Enter/Space/Escape for keyboard users.
const cards = document.querySelectorAll('.tc');
const canHover = window.matchMedia('(hover: hover)').matches;

// Optional image front: <article class="tc ..." data-image="images/your-card.jpg">
// The image fills the front of the card (63:88, standard trading-card proportions) and replaces
// the built-in front design; the back still shows the description.
cards.forEach((card) => {
    const src = card.dataset.image;
    if (!src) return;
    const front = card.querySelector('.tc-front');
    const img = document.createElement('img');
    img.className = 'tc-image';
    img.src = src;
    img.alt = card.querySelector('.tc-name')?.textContent.trim() || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    // if the file is missing, fall back to the built-in front instead of a broken image
    img.addEventListener('error', () => { img.remove(); card.classList.remove('has-image'); });
    front.prepend(img);
    card.classList.add('has-image');
});

cards.forEach((card) => {
    card.addEventListener('click', (e) => {
        if (canHover || e.target.closest('a')) return; // mouse users already flip on hover
        const flip = !card.classList.contains('is-flipped');
        cards.forEach((c) => c.classList.remove('is-flipped')); // one open card at a time
        card.classList.toggle('is-flipped', flip);
    });
    card.addEventListener('keydown', (e) => {
        if (e.target !== card) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.classList.toggle('is-flipped');
        } else if (e.key === 'Escape') {
            card.classList.remove('is-flipped');
            card.blur();
        }
    });
});
