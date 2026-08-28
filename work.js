// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('daize-theme', next);
  });
}

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
revealEls.forEach((el) => io.observe(el));

// Custom cursor
const cursorDot = document.getElementById('cursorDot');
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (canHover && cursorDot) {
  window.addEventListener('mousemove', (e) => {
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('a, button').forEach((el) => {
    el.addEventListener('mouseenter', () => cursorDot.classList.add('grow'));
    el.addEventListener('mouseleave', () => cursorDot.classList.remove('grow'));
  });
  document.querySelectorAll('.wcard').forEach((item) => {
    item.addEventListener('mouseenter', () => cursorDot.classList.add('view'));
    item.addEventListener('mouseleave', () => cursorDot.classList.remove('view'));
  });
}

// Category filters
const filterButtons = document.querySelectorAll('.wf');
const cards = document.querySelectorAll('.wcard');
filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
    btn.setAttribute('aria-pressed', 'true');
    const filter = btn.dataset.filter;
    cards.forEach((card) => {
      const match = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('is-hidden', !match);
    });
  });
});
