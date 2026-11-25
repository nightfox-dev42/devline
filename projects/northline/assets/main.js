const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('#navigation');
const mobile = matchMedia('(max-width: 900px)');
const header = document.querySelector('.header');

function updateHeader() {
  header.classList.toggle('scrolled', scrollY > 20);
}

addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.querySelector('span').textContent = open ? 'Закрыть' : 'Меню';
  navigation.classList.toggle('open', open);
  navigation.inert = mobile.matches && !open;
}

setMenu(false);
mobile.addEventListener('change', () => setMenu(false));
menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') === 'false');
});
navigation.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link || !mobile.matches) return;

  setMenu(false);
  const destination = document.querySelector(link.hash);
  destination.tabIndex = -1;
  destination.focus({ preventScroll: true });
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.header')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !navigation.classList.contains('open')) return;
  setMenu(false);
  menuButton.focus();
});

const details = {
  pines: 'Дом опирается на скальный уступ, сохраняя рельеф и деревья у подножия. Вход спрятан с верхней стороны участка. За ним пространство раскрывается в гостиную со стеклянным фасадом, откуда видны только кроны и небо.',
  light: 'Дубовая обшивка объединяет гостиную и встроенные системы хранения. Панорамное окно открывает сад, а светлая поверхность травертина отражает дневной свет в глубину комнаты. Вечером скрытая подсветка оставляет видимыми фактуры дерева и камня.',
  ridge: 'Глухая каменная стена защищает дом со стороны ветра. Жилые комнаты раскрыты в сторону долины и выходят на общую террасу. В фасаде соединены тёмный базальт и дерево, которым предстоит меняться вместе с ландшафтом.'
};
const dialog = document.querySelector('.project-dialog');
const dialogImage = dialog.querySelector('.dialog-image');
let projectTrigger;

document.querySelectorAll('[data-project]').forEach((button) => {
  button.addEventListener('click', () => {
    const project = button.closest('.project');
    const image = project.querySelector('img');
    dialogImage.src = image.getAttribute('src');
    dialogImage.alt = image.alt;
    dialog.querySelector('.dialog-type').textContent = project.querySelector('figcaption').textContent;
    dialog.querySelector('#dialog-title').textContent = project.querySelector('h3').textContent;
    dialog.querySelector('.dialog-description').textContent = details[button.dataset.project];
    projectTrigger = button;
    dialog.showModal();
    dialog.scrollTop = 0;
  });
});
dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
let pressedOnBackdrop = false;
dialog.addEventListener('pointerdown', (event) => {
  pressedOnBackdrop = event.target === dialog;
});
dialog.addEventListener('click', (event) => {
  if (pressedOnBackdrop && event.target === dialog) dialog.close();
  pressedOnBackdrop = false;
});
dialog.addEventListener('close', () => projectTrigger?.focus({ preventScroll: true }));

const questions = [...document.querySelectorAll('.faq button')];
function setQuestion(button, expanded) {
  button.setAttribute('aria-expanded', String(expanded));
  document.getElementById(button.getAttribute('aria-controls')).hidden = !expanded;
}
questions.forEach((button, index) => {
  button.addEventListener('click', () => {
    const opening = button.getAttribute('aria-expanded') === 'false';
    questions.forEach((item) => setQuestion(item, item === button && opening));
  });
  button.addEventListener('keydown', (event) => {
    const destinations = {
      ArrowDown: (index + 1) % questions.length,
      ArrowUp: (index - 1 + questions.length) % questions.length,
      Home: 0,
      End: questions.length - 1
    };
    const next = destinations[event.key];
    if (typeof next !== 'number') return;
    event.preventDefault();
    questions[next].focus();
  });
});

const form = document.querySelector('.form');
const fields = [...form.querySelectorAll('input, select, textarea')];
const feedback = form.querySelector('.feedback');
const projectType = form.querySelector('#type');
const missing = {
  name: 'Укажите ваше имя.',
  reach: 'Оставьте почту, телефон или имя пользователя в Telegram.',
  type: 'Выберите тип проекта.',
  message: 'Расскажите немного о проекте.'
};

function validate(field) {
  const value = field.value.trim();
  let message = value ? '' : missing[field.id];

  if (value && field.id === 'reach') {
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
    const telegram = /^@?[a-z\d_]{5,32}$/i.test(value) && /[a-z]/i.test(value);
    const digits = value.replace(/\D/g, '').length;
    const phone = /^\+?[\d\s().-]+$/.test(value) && digits >= 7 && digits <= 15;
    if (!email && !telegram && !phone) message = 'Проверьте формат контакта.';
  }

  const hint = document.getElementById(field.id + '-error');
  hint.textContent = message;
  hint.hidden = !message;
  if (message) {
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', hint.id);
  } else {
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  }
  return !message;
}

form.noValidate = true;
form.addEventListener('submit', (event) => {
  event.preventDefault();
  feedback.replaceChildren();
  const invalid = fields.filter((field) => !validate(field));
  if (invalid.length) {
    invalid[0].focus();
    return;
  }

  form.reset();
  const heading = document.createElement('strong');
  heading.textContent = 'Готово. Запрос проверен.';
  feedback.append(heading, 'Это демонстрация. Введённые данные удалены из формы.');
});
fields.forEach((field) => {
  const eventName = field === projectType ? 'change' : 'input';
  field.addEventListener(eventName, () => {
    feedback.replaceChildren();
    if (field.hasAttribute('aria-invalid')) validate(field);
  });
});
document.querySelectorAll('[data-service]').forEach((link) => {
  link.addEventListener('click', () => {
    projectType.value = link.dataset.service;
    projectType.dispatchEvent(new Event('change'));
  });
});
form.querySelector('button[type="submit"]').disabled = false;

const motion = matchMedia('(prefers-reduced-motion: reduce)');
const steps = document.querySelectorAll('.steps li');
const stepObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    if (!motion.matches) entry.target.classList.add('revealed');
    stepObserver.unobserve(entry.target);
  });
}, { threshold: 0.22 });
steps.forEach((step) => stepObserver.observe(step));

const statement = document.querySelector('.statement');
let frame;
function updateStatement() {
  frame = undefined;
  if (motion.matches) return;
  const bounds = statement.getBoundingClientRect();
  if (bounds.bottom < 0 || bounds.top > innerHeight) return;
  const progress = (innerHeight - bounds.top) / (innerHeight + bounds.height);
  statement.style.setProperty('--shift', ((progress - 0.5) * bounds.height * 0.105).toFixed(1) + 'px');
}
function requestShift() {
  if (!motion.matches && frame === undefined) frame = requestAnimationFrame(updateStatement);
}
addEventListener('scroll', requestShift, { passive: true });
addEventListener('resize', requestShift);
motion.addEventListener('change', requestShift);
requestShift();
