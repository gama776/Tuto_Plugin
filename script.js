/* ============================================================
   SCRIPT.JS — Interactive logic for both pages
   ============================================================ */

// ─── Navbar scroll effect ───────────────────────────────────
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ─── Hamburger menu ─────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  // Close on link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// ─── Progress bar (index.html only) ─────────────────────────
const progressFill = document.getElementById('progress-fill');
const psteps = document.querySelectorAll('.pstep');
const sections = ['intro', 'create', 'java', 'structure', 'test'];

if (progressFill) {
  const updateProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressFill.style.width = pct + '%';

    // Active step
    let activeIdx = 0;
    sections.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.5) activeIdx = i;
      }
    });
    psteps.forEach((ps, i) => ps.classList.toggle('active', i === activeIdx));
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

// ─── Navbar active link highlight ───────────────────────────
const navLinkEls = document.querySelectorAll('.nav-link');
if (navLinkEls.length > 0) {
  const highlightNav = () => {
    let active = null;
    document.querySelectorAll('.tuto-section').forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.4) active = sec.id;
    });
    navLinkEls.forEach(a => {
      const href = a.getAttribute('href');
      a.classList.toggle('active', href === '#' + active);
    });
  };
  window.addEventListener('scroll', highlightNav, { passive: true });
}

// ─── Scroll reveal ──────────────────────────────────────────
const revealEls = document.querySelectorAll(
  '.info-card, .step-item, .concept-card, .file-card, .ep-card, ' +
  '.sys-card, .display-option, .compare-card, .xml-field, ' +
  '.callout, .tree-container, .code-block-wrapper, .psi-tree-visual, ' +
  '.sandbox-diagram, .debug-card, .toc-wrapper'
);

revealEls.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

revealEls.forEach(el => revealObserver.observe(el));

// ─── Copy button logic ───────────────────────────────────────
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const target = document.getElementById(targetId);
    if (!target) return;
    const text = target.innerText || target.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.textContent;
      btn.textContent = '✅ Copié!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove('copied');
      }, 2000);
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      btn.textContent = '✅ Copié!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '📋 Copier';
        btn.classList.remove('copied');
      }, 2000);
    });
  });
});

// ─── Interactive file tree ────────────────────────────────────
const fileDescriptions = {
  'readme':         { title: '📄 README.md', text: "Généré avec le projet. Non technique : le plugin fonctionne sans lui. Sert de point de départ avec les premières étapes et contient des liens vers la documentation officielle JetBrains." },
  'build-gradle':   { title: '⚙️ build.gradle.kts', text: "Le fichier le plus important côté build. Déclare les plugins Gradle utilisés, la version d'IntelliJ ciblée (dans le bloc intellijPlatform), les dépendances, et la version de Java." },
  'settings-gradle':{ title: '⚙️ settings.gradle.kts', text: "Contient simplement le nom du projet Gradle. Rarement modifié manuellement." },
  'gradle-props':   { title: '⚙️ gradle.properties', text: "Propriétés globales du projet : version du plugin, version de la plateforme IntelliJ ciblée, options de la JVM… Selon le modèle choisi." },
  'gradlew':        { title: '🔧 gradlew / gradlew.bat', text: "Le wrapper Gradle. Permet de compiler le projet sans installer Gradle soi-même sur la machine, avec exactement la bonne version. gradlew pour Linux/Mac, gradlew.bat pour Windows." },
  'src-java':       { title: '☕ src/main/java/', text: "C'est ici que vous écrivez le code du plugin : actions, services, inspections, etc. Rangé dans des packages comme n'importe quel projet Java. C'est le dossier créé à l'étape 2." },
  'src-resources':  { title: '🎨 src/main/resources/', text: "Contient tout ce qui n'est pas du code Java : le plugin.xml, l'icône du plugin, les fichiers .properties pour les libellés, ou des icônes utilisées par vos actions." },
  'plugin-xml':     { title: '🗝️ META-INF/plugin.xml', text: "La carte d'identité du plugin. L'IDE le lit au démarrage pour savoir ce que votre plugin apporte. Sans lui (ou s'il est mal rempli), le plugin n'est pas chargé." },
  'src-test':       { title: '🧪 src/test/', text: "Accueille les tests automatisés du plugin. Même organisation en packages que src/main. Utiliser BasePlatformTestCase pour les tests qui dépendent de la plateforme IntelliJ." },
};

document.querySelectorAll('.interactive[data-desc]').forEach(node => {
  node.addEventListener('click', () => {
    const key = node.dataset.desc;
    const desc = fileDescriptions[key];
    if (!desc) return;

    document.querySelectorAll('.interactive').forEach(n => n.classList.remove('selected'));
    node.classList.add('selected');

    const panel = document.getElementById('file-desc-panel');
    const placeholder = panel ? panel.querySelector('.file-desc-placeholder') : null;
    const content = document.getElementById('file-desc-content');
    const title = document.getElementById('file-desc-title');
    const text = document.getElementById('file-desc-text');

    if (placeholder) placeholder.style.display = 'none';
    if (content) content.style.display = 'block';
    if (title) title.textContent = desc.title;
    if (text) text.textContent = desc.text;
  });
});

// ─── Smooth anchor scroll with offset ───────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const offset = 80 + 48; // nav + progress bar
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ─── Step items stagger animation ───────────────────────────
document.querySelectorAll('.steps-list').forEach(list => {
  list.querySelectorAll('.step-item').forEach((item, i) => {
    item.style.animationDelay = (i * 0.07) + 's';
  });
});

// ─── Back-to-top on hero logo click ─────────────────────────
const navBrand = document.querySelector('.nav-brand');
if (navBrand) {
  navBrand.style.cursor = 'pointer';
  navBrand.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

console.log('%c IntelliJ Plugin Tutorial — SAE A3-S5', 'color: #818cf8; font-weight: bold; font-size: 14px;');
console.log('%c Saksouk Mahdi & Aubert Florian', 'color: #34d399; font-size: 12px;');
