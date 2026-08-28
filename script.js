// Preloader
(function () {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;
  const countEl = document.getElementById('preloaderCount');
  const barFill = document.getElementById('preloaderBarFill');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function finish() {
    preloader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    document.body.classList.add('is-loaded');
    setTimeout(() => preloader.remove(), 1000);
  }

  if (reduced) {
    finish();
    return;
  }

  const duration = 1300;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const val = Math.round(progress * 100);
    countEl.textContent = val;
    barFill.style.width = `${val}%`;
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      finish();
    }
  }
  requestAnimationFrame(tick);
})();

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;
themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  root.setAttribute('data-theme', next);
  localStorage.setItem('daize-theme', next);
});

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach((el) => io.observe(el));

// Fullscreen nav menu toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navToggleLabel = navToggle.querySelector('.nav__toggle-label');
function closeNavMenu() {
  navMenu.classList.remove('open');
  navToggle.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
  navToggleLabel.textContent = 'Menu';
}
navToggle.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  document.body.classList.toggle('menu-open', isOpen);
  navToggleLabel.textContent = isOpen ? 'Close' : 'Menu';
});
navMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeNavMenu);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navMenu.classList.contains('open')) closeNavMenu();
});

// Navbar scroll state + scroll progress indicator
const navEl = document.querySelector('.nav');
const navProgress = document.getElementById('navProgress');
function updateNavOnScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  navEl.classList.toggle('nav--scrolled', scrollTop > 40);
  navProgress.style.width = docHeight > 0 ? `${(scrollTop / docHeight) * 100}%` : '0%';
}
window.addEventListener('scroll', updateNavOnScroll, { passive: true });
updateNavOnScroll();

// Custom cursor
const cursorDot = document.getElementById('cursorDot');
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


if (canHover) {
  window.addEventListener('mousemove', (e) => {
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('a, button').forEach((el) => {
    el.addEventListener('mouseenter', () => cursorDot.classList.add('grow'));
    el.addEventListener('mouseleave', () => cursorDot.classList.remove('grow'));
  });
  document.querySelectorAll('.work__item').forEach((item) => {
    item.addEventListener('mouseenter', () => cursorDot.classList.add('view'));
    item.addEventListener('mouseleave', () => cursorDot.classList.remove('view'));
  });
}

// Magnetic buttons
if (canHover && !prefersReducedMotion) {
  function magnetic(el, strength) {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate(${(x * strength).toFixed(2)}px, ${(y * strength).toFixed(2)}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0, 0)';
    });
  }
  document.querySelectorAll('.theme-toggle, .nav__toggle').forEach((el) => magnetic(el, 0.35));
  const contactEmail = document.querySelector('.contact__email');
  if (contactEmail) magnetic(contactEmail, 0.2);
}

// Text scramble on hover
if (canHover && !prefersReducedMotion) {
  const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function scrambleText(el) {
    if (!el.dataset.text) el.dataset.text = el.textContent;
    const original = el.dataset.text;
    let frame = 0;
    clearInterval(el._scrambleInterval);
    el._scrambleInterval = setInterval(() => {
      let output = '';
      for (let i = 0; i < original.length; i++) {
        if (original[i] === ' ') output += ' ';
        else if (frame / 2 > i) output += original[i];
        else output += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
      }
      el.textContent = output;
      frame++;
      if (frame / 2 > original.length) {
        clearInterval(el._scrambleInterval);
        el.textContent = original;
      }
    }, 35);
  }
  document.querySelectorAll('.nav__link-text, .work__meta h3').forEach((el) => {
    el.addEventListener('mouseenter', () => scrambleText(el));
  });
}

// Watermark parallax
const watermarkEls = document.querySelectorAll('[data-watermark]');
if (watermarkEls.length && !prefersReducedMotion) {
  let wmTicking = false;
  function updateWatermarkParallax() {
    watermarkEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.setProperty('--wm-shift', `${(center * -0.06).toFixed(1)}px`);
    });
    wmTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!wmTicking) {
      requestAnimationFrame(updateWatermarkParallax);
      wmTicking = true;
    }
  }, { passive: true });
  updateWatermarkParallax();
}

// Hero exit parallax
const heroParallaxEl = document.querySelector('.hero');
const heroLogoEl = document.getElementById('heroLogo');
if (heroParallaxEl && heroLogoEl && !prefersReducedMotion) {
  let heroTicking = false;
  function updateHeroParallax() {
    const rect = heroParallaxEl.getBoundingClientRect();
    const progress = Math.min(Math.max(-rect.top / rect.height, 0), 1);
    heroLogoEl.style.transform = `translate(-50%, calc(-50% + ${(progress * 60).toFixed(1)}px)) scale(${(1 - progress * 0.15).toFixed(3)})`;
    heroLogoEl.style.opacity = `${(1 - progress).toFixed(2)}`;
    heroTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!heroTicking) {
      requestAnimationFrame(updateHeroParallax);
      heroTicking = true;
    }
  }, { passive: true });
  updateHeroParallax();
}

// Animated stat counters
const statEls = document.querySelectorAll('.about__stats span[data-count]');
function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1600;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
if (statEls.length) {
  const statIo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        statIo.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  statEls.forEach((el) => statIo.observe(el));
}

// 3D tilt on work cards
if (canHover && !prefersReducedMotion) {
  document.querySelectorAll('.work__item').forEach((card) => {
    const media = card.querySelector('.work__media');
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      media.style.transform = `rotateX(${py * -8}deg) rotateY(${px * 8}deg) scale(1.03)`;
    });
    card.addEventListener('mouseleave', () => {
      media.style.transform = 'rotateX(0) rotateY(0) scale(1)';
    });
  });
}
