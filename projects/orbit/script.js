const app = document.querySelector('#app');
const modal = document.querySelector('#modal');
const modalContent = document.querySelector('#modal-content');
const toast = document.querySelector('#toast');
const storageKey = 'devline.orbit.v1';
const screens = {
  home: ['Главная', 'home'], analytics: ['Аналитика', 'chart'],
  goals: ['Цели', 'target'], insights: ['Рекомендации', 'spark'], profile: ['Профиль', 'user'],
};
const paths = {
  logo: '<ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-40 12 12)"/><circle cx="12" cy="12" r="6"/><circle cx="19" cy="6" r="1.7" fill="currentColor"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
  chart: '<path d="M3 3v18h18M7 15l4-5 4 2 5-7"/><path d="M16 5h4v4"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  spark: '<path d="M12 2c0 6-4 10-10 10 6 0 10 4 10 10 0-6 4-10 10-10-6 0-10-4-10-10zM19 3v4m-2-2h4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8m-8 12a2 2 0 0 0 4 0"/>',
  refresh: '<path d="M20 7a9 9 0 1 0 1 9M20 3v5h-5"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  flame: '<path d="M12 22c-4 0-7-3-7-7 0-3 2-6 4-8 0 3 2 4 2 4 3-3 3-6 3-9 3 3 5 8 5 13 0 4-3 7-7 7z"/>',
  plus: '<path d="M12 5v14m-7-7h14"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
};
const icon = (name, size = 20) => `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
const categories = ['Все', 'Движение', 'Фокус', 'Ритм'];
const periods = {
  week: { label: 'Неделя', ticks: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'], values: [26, 41, 35, 62, 51, 79, 72], prior: 61 },
  month: { label: 'Месяц', ticks: ['1–5', '6–10', '11–15', '16–20', '21–25', '26–31'], values: [36, 45, 59, 48, 69, 77], prior: 65 },
  year: { label: 'Год', ticks: ['Янв', 'Мар', 'Май', 'Июл', 'Сен', 'Ноя'], values: [21, 34, 42, 61, 56, 83], prior: 58 },
};
const advice = [
  { id: 'rhythm', title: 'Выбери лёгкий ритм', priority: 'Высокий', text: 'Сегодня лучше сосредоточиться на восстановлении и короткой тренировке.', detail: 'В демо-журнале три активных дня подряд. Попробуй запланировать короткую прогулку или оставить вечер свободным и посмотри, как это отразится на серии.' },
  { id: 'focus', title: 'Выдели время для фокуса', priority: 'Средний', text: 'Поставь одну важную задачу в начало рабочего дня.', detail: 'В демо-истории утренние сессии отмечены чаще остальных. Выдели 25 минут на одну задачу и запиши результат в своих целях.' },
  { id: 'goal', title: 'Сделай следующий шаг', priority: 'Низкий', text: 'До недельной цели осталось две отметки.', detail: 'Разбей остаток на два небольших действия и запланируй по одному на разные дни.' },
];
const fresh = () => ({
  screen: 'welcome', updates: 0, hidden: [], dark: true, motion: true, notifications: true, read: [],
  goals: [
    { id: 'movement', title: '10 активных отметок за неделю', category: 'Движение', progress: 80, due: '', done: false },
    { id: 'attention', title: 'Пять сессий глубокого фокуса', category: 'Фокус', progress: 60, due: '', done: false },
    { id: 'notes', title: 'Подвести итоги недели', category: 'Ритм', progress: 100, due: '', done: true },
  ],
  events: [],
});
function readState() {
  try { return { ...fresh(), ...JSON.parse(localStorage.getItem(storageKey)) }; }
  catch { return fresh(); }
}
let state = readState();
let period = 'week';
let category = 0;
let goalFilter = 'all';
let loading = false;
let refreshTimer;
let toastTimer;
let demoStep = -1;
let completedGoal = '';
const save = () => {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* In-memory session remains usable. */ }
};
const escape = (value) => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const devline = '<div class="footer-links"><a href="../../index.html">Портфолио DEVLINE ↗</a><a href="https://t.me/devline_ru">Telegram DEVLINE ↗</a></div>';
const logo = `<span class="logo-mark">${icon('logo', 23)}</span><span>ORBIT<small>MINI APP</small></span>`;
const avatar = '<span class="avatar" aria-hidden="true">А</span>';
const score = () => 72 + [0, 2, 3, 1][state.updates % 4];
const weekDelta = () => Math.round((score() / periods.week.prior - 1) * 100);
const goalCount = () => state.goals.filter(goal => goal.done).length;
const activityGoal = () => state.goals.find(goal => goal.id === 'movement');
const notifications = () => [
  ...state.events.map(event => ({ ...event, icon: 'check' })),
  { id: 'ai', icon: 'spark', title: 'Новая рекомендация', text: 'Подобрали спокойный план на сегодня.' },
  { id: 'progress', icon: 'chart', title: 'Прогресс обновлён', text: `Текущий результат за неделю — ${score()}%.` },
  { id: 'achievement', icon: 'check', title: 'Цель достигнута', text: 'Ты подвёл итоги недели.' },
  { id: 'reminder', icon: 'bell', title: 'Напоминание', text: 'Загляни в цели и отметь следующий шаг.' },
];
function route() {
  const hash = location.hash.slice(1);
  if (hash === 'welcome' || Object.hasOwn(screens, hash)) return hash;
  return state.screen === 'welcome' || Object.hasOwn(screens, state.screen) ? state.screen : 'welcome';
}
function go(screen) {
  if (location.hash === `#${screen}`) return;
  location.hash = screen;
}
function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
}
function showDialog(title, content, wide = false) {
  modal.classList.toggle('wide', wide);
  modalContent.innerHTML = `<div class="modal-head"><h2 id="modal-title">${title}</h2><button class="icon-button" data-action="close" aria-label="Закрыть">${icon('close')}</button></div>${content}`;
  if (!modal.open) modal.showModal();
}
function heading(title, subtitle, actions = '') {
  return `<header class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div>${actions}</header>`;
}
function button(label, action, { symbol, style = '', attrs = '' } = {}) {
  return `<button type="button" class="button ${style}" data-action="${action}" ${attrs}>${symbol ? icon(symbol, 17) : ''}${label}</button>`;
}
function tabs(items, current, action, title) {
  return `<div class="tabs" role="group" aria-label="${title}">${items.map(([id, label]) => `<button type="button" data-action="${action}" data-value="${id}" aria-pressed="${id === current}">${label}</button>`).join('')}</div>`;
}
function bar(value) {
  return `<div class="bar" role="progressbar" aria-label="Прогресс цели" aria-valuenow="${value}"><span style="--fill:${value}%"></span></div>`;
}
function gauge(value) {
  return `<svg class="gauge" viewBox="0 0 260 260" aria-hidden="true">
    <defs><linearGradient id="orbit-gradient" x1="0%" x2="100%" y1="10%" y2="90%"><stop stop-color="#a789ff"/><stop offset=".54" stop-color="#7759ff"/><stop offset="1" stop-color="#77f5f2"/></linearGradient></defs>
    <circle class="gauge-guide" cx="130" cy="130" r="118"/>
    <circle class="gauge-ticks" cx="130" cy="130" r="104" pathLength="120"/>
    <circle class="gauge-track" cx="130" cy="130" r="88"/>
    <circle class="gauge-value" cx="130" cy="130" r="88" pathLength="100" style="--arc:${value}" transform="rotate(-90 130 130)"/>
    <circle class="gauge-guide" cx="130" cy="130" r="74"/>
    <ellipse cx="130" cy="130" rx="63" ry="25" transform="rotate(-37 130 130)" fill="none" stroke="#9a7aff" stroke-opacity=".26"/>
    <circle cx="177" cy="91" r="4" fill="#81f5ed" class="orbital-dot"/>
    <path d="M130 111c0 12-7 19-19 19 12 0 19 7 19 19 0-12 7-19 19-19-12 0-19-7-19-19z" fill="#d4c7ff"/>
  </svg>`;
}
function welcome() {
  return `<main class="welcome"><header><span class="brand">${logo}</span><span class="demo-label"><i></i> Демо-приложение</span></header>
    <div class="welcome-grid"><div class="welcome-copy"><p class="greeting">Привет, Алекс!</p><h1>Держи курс<br>на свои цели.</h1><p class="welcome-sub">Отслеживай прогресс, управляй целями и получай персональные рекомендации.</p>
    <div class="actions">${button('Начать', 'start', { symbol: 'arrow', style: 'primary' })}${button('Посмотреть демо', 'demo')}</div></div>
    <div class="welcome-orbit">${gauge(72)}</div></div>
    <footer>${devline}<span>Все данные в демо вымышлены</span></footer></main>`;
}
function chartData(selectedPeriod, selectedCategory) {
  const source = periods[selectedPeriod];
  const modifiers = [0, 0, -8, -15];
  const baseline = modifiers[selectedCategory];
  const values = source.values.map((value, index) =>
    Math.min(100, value + baseline + (selectedCategory ? (index * 3 + selectedCategory) % 8 : 0)
      + (selectedPeriod === 'week' && index === source.values.length - 1 ? score() - 72 : 0)));
  return { ...source, values, prior: source.prior + baseline };
}
function chart(selectedPeriod = 'week', selectedCategory = 0) {
  const { ticks, values } = chartData(selectedPeriod, selectedCategory);
  const points = values.map((value, index) => [44 + index * (530 / (values.length - 1)), 157 - value * 1.35]);
  const line = points.slice(1).reduce((path, [x, y], index) => {
    const [prevX, prevY] = points[index];
    const middle = (x + prevX) / 2;
    return `${path} C${middle},${prevY} ${middle},${y} ${x},${y}`;
  }, `M${points[0].join(',')}`);
  return `<div class="chart">
    <svg viewBox="0 0 600 184" role="img" aria-label="График прогресса от 0 до 100 процентов">
      <defs><linearGradient id="chart-gradient" x2="0" y2="100%"><stop stop-color="#9973ff" stop-opacity=".35"/><stop offset="1" stop-color="#9973ff" stop-opacity="0"/></linearGradient></defs>
      ${[100, 75, 50, 25, 0].map(value => {
        const y = 157 - value * 1.35;
        return `<path d="M44 ${y}H574" class="gridline"/><text x="30" y="${y + 4}" text-anchor="end">${value}</text>`;
      }).join('')}
      <path fill="url(#chart-gradient)" d="${line} L574 157H44Z"/>
      <path class="chart-line" pathLength="100" d="${line}"/>
      ${points.map(([x, y], index) => `<circle class="plot-point" cx="${x}" cy="${y}" r="${index === points.length - 1 ? 5 : 3}"/><text x="${x}" y="180" text-anchor="middle">${ticks[index]}</text>`).join('')}
    </svg>
    ${points.map(([x, y], index) => `<button type="button" class="chart-hit" style="--x:${x / 6}%;--y:${y / 1.84}%" aria-label="${ticks[index]}, ${values[index]}%" aria-pressed="false" data-action="plot"><span class="tooltip" aria-hidden="true">${ticks[index]} · ${values[index]}%</span></button>`).join('')}
  </div>`;
}
function actionRows() {
  const rows = [
    ...state.events.map(event => ['check', event.title, event.text, 'Сегодня']),
    ['target', 'Обновлён прогресс цели', '10 активных отметок за неделю', 'Сегодня'],
    ['flame', 'Серия достигла 12 дней', 'Ежедневная активность', 'Вчера'],
    ['spark', 'Добавлена рекомендация', 'Выбери лёгкий ритм', 'Вчера'],
  ].slice(0, 4);
  return rows.map(([symbol, title, detail, date]) => `<div class="activity-row"><span class="tile-icon">${icon(symbol, 18)}</span><div><strong>${escape(title)}</strong><small>${escape(detail)}</small></div><time>${date}</time></div>`).join('');
}
function home() {
  const suggestion = advice.find(item => !state.hidden.includes(item.id));
  const progress = activityGoal().progress;
  const delta = weekDelta();
  return `${heading('Привет, Алекс!', 'Твой прогресс и планы на сегодня.', button(loading ? 'Обновляем…' : 'Обновить данные', 'refresh', { symbol: 'refresh', attrs: loading ? 'disabled' : '' }))}
    <div class="dashboard-grid ${loading ? 'loading' : ''}" aria-busy="${loading}">
      <section class="panel progress-panel" id="demo-progress"><div class="progress-copy"><h2>Прогресс недели</h2><div class="score">${score()}<span>%</span></div><span class="trend">↗ +${delta}% <span>к прошлой неделе</span></span></div><div class="progress-orbit">${gauge(score())}</div></section>
      <section class="panel today"><h2>Сегодня</h2><div class="today-stat"><span class="tile-icon">${icon('target')}</span><div><strong>${progress / 10} <small>из 10</small></strong><span>Активные отметки</span></div></div>${bar(progress)}<div class="today-stat streak"><span class="tile-icon cyan">${icon('flame')}</span><div><strong>12 <small>дней</small></strong><span>Активная серия</span></div></div></section>
      <section class="panel chart-panel"><div class="panel-head"><div><h2>График активности</h2><p>Индекс активности за неделю</p></div><a class="text-link" href="#analytics">Аналитика ${icon('arrow', 15)}</a></div>${chart()}</section>
      <section class="panel insight-panel"><span class="tile-icon cyan">${icon('spark')}</span><h2>Рекомендация AI</h2><p>${suggestion ? suggestion.text : 'Все рекомендации скрыты.'}</p>${suggestion ? button('Подробнее', 'advice', { attrs: `data-value="${suggestion.id}"`, symbol: 'arrow' }) : '<a class="text-link" href="#insights">Управлять рекомендациями</a>'}</section>
      <section class="panel activities"><h2>Последние действия</h2>${actionRows()}</section>
    </div>`;
}
function analytics() {
  const { values, prior, label } = chartData(period, category);
  const latest = values.at(-1);
  const change = Math.round((latest / prior - 1) * 100);
  return `${heading('Аналитика', 'Динамика активности по периодам и категориям.')}
    <div class="metrics"><div class="panel metric"><span>Текущий индекс</span><strong>${latest}%</strong></div><div class="panel metric"><span>Прошлый период</span><strong>${prior}%</strong></div><div class="panel metric"><span>Изменение</span><strong class="positive">${change >= 0 ? '+' : ''}${change}%</strong></div></div>
    <section class="panel analytics-panel" id="demo-analytics"><div class="panel-head"><div><h2>График прогресса</h2><p>${label} · ${categories[category]}</p></div>${tabs(Object.entries(periods).map(([id, data]) => [id, data.label]), period, 'period', 'Период')}</div>
    ${tabs(categories.map((name, index) => [index, name]), category, 'category', 'Категория')}${chart(period, category)}</section>`;
}
function dateLabel(due) {
  return due ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${due}T12:00:00`)) : 'Без срока';
}
function goals() {
  const items = state.goals.filter(goal => goalFilter === 'all' || goal.done === (goalFilter === 'done'));
  return `${heading('Цели', 'Планируй действия и отмечай результат.', button('Добавить цель', 'add', { style: 'primary', symbol: 'plus' }))}
    ${tabs([['all', 'Все'], ['active', 'В процессе'], ['done', 'Выполнены']], goalFilter, 'goal-filter', 'Статус цели')}
    <div class="card-list" id="demo-goals">${items.length ? items.map(goal => `<article class="panel goal-card ${goal.id === completedGoal ? 'celebrate' : ''}"><div class="panel-head"><span class="chip">${escape(goal.category)}</span><span class="muted">${dateLabel(goal.due)}</span></div>
      <h2>${escape(goal.title)}</h2><div class="goal-progress">${bar(goal.progress)}<strong>${goal.progress}%</strong></div>
      ${goal.done ? `<div class="positive done">${icon('check', 18)} Выполнено</div>` : button('Отметить выполненной', 'complete', { symbol: 'check', attrs: `data-value="${escape(goal.id)}"` })}</article>`).join('') : '<div class="panel empty">В этом списке пока нет целей.</div>'}</div>`;
}
function insights() {
  const shown = advice.filter(item => !state.hidden.includes(item.id));
  return `${heading('Персональные рекомендации', 'Демонстрационные советы на основе вымышленной активности.', state.hidden.length ? button(`Вернуть скрытые (${state.hidden.length})`, 'restore') : '')}
    <div class="card-list">${shown.length ? shown.map(item => `<article class="panel advice-card"><div class="panel-head"><span class="tile-icon cyan">${icon('spark')}</span><span class="chip">Приоритет · ${item.priority.toLowerCase()}</span></div><h2>${item.title}</h2><p>${item.text}</p>
    <div class="actions">${button('Подробнее', 'advice', { symbol: 'arrow', attrs: `data-value="${item.id}"` })}${button('Скрыть', 'hide', { style: 'subtle', attrs: `data-value="${item.id}"` })}</div></article>`).join('') : '<div class="panel empty">Все рекомендации скрыты. Их можно вернуть в список.</div>'}</div>`;
}
function profile() {
  const settings = [['notifications', 'Уведомления', 'Показывать индикатор новых событий'], ['dark', 'Тёмная тема', 'Использовать тёмное оформление'], ['motion', 'Анимации', 'Добавлять движение при переходах']];
  return `${heading('Профиль', 'Личный кабинет и настройки приложения.')}
    <section class="panel profile-card">${avatar}<div><h2>Алекс</h2><p>Уровень ${2 + Math.floor(goalCount() / 2)}</p></div></section>
    <div class="metrics profile-metrics"><div class="panel metric"><span>Завершённые цели</span><strong>${goalCount()}</strong></div><div class="panel metric"><span>Дней подряд</span><strong>12</strong></div></div>
    <section class="panel settings"><h2>Настройки</h2>${settings.map(([key, label, description]) => `<label class="setting"><span><strong>${label}</strong><small>${description}</small></span><input type="checkbox" role="switch" data-setting="${key}" ${state[key] ? 'checked' : ''}></label>`).join('')}
    ${button('Сбросить демо-данные', 'reset', { style: 'danger' })}</section>`;
}
const views = { home, analytics, goals, insights, profile };
function applyTheme() {
  document.documentElement.dataset.theme = state.dark ? 'dark' : 'light';
  document.documentElement.dataset.motion = state.motion ? 'on' : 'off';
  document.querySelector('meta[name="theme-color"]').content = state.dark ? '#0c0e18' : '#f0f1fa';
}
function render(preserveFocus = false) {
  const focused = document.activeElement?.dataset;
  const active = route();
  state.screen = active;
  save();
  applyTheme();
  if (active === 'welcome') {
    app.innerHTML = welcome();
    return;
  }
  const unread = state.notifications && notifications().some(item => !state.read.includes(item.id));
  app.innerHTML = `<div class="shell">
    <aside class="sidebar"><a class="brand" href="#welcome" aria-label="ORBIT, стартовый экран">${logo}</a>
    <nav aria-label="Основная навигация">${Object.entries(screens).map(([id, [label, symbol]]) => `<a href="#${id}" ${id === active ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${label}</span></a>`).join('')}</nav>
    <a href="#profile" class="account">${avatar}<span><strong>Алекс</strong><small>Личный кабинет</small></span></a></aside>
    <div class="workspace"><div class="topbar"><a class="brand mobile-brand" href="#welcome" aria-label="ORBIT, стартовый экран">${logo}</a><span class="top-label">Личный кабинет</span><div class="top-actions"><span class="demo-label"><i></i> Демо-приложение</span><button class="icon-button bell" type="button" data-action="notifications" aria-label="${unread ? 'Новые уведомления' : 'Уведомления'}">${icon('bell')}${unread ? '<i></i>' : ''}</button></div></div>
    <main class="page" id="main">${views[active]()}</main>
    <footer>${devline}<span>Все данные в демо вымышлены</span></footer></div></div>`;
  if (preserveFocus && focused?.action) {
    [...app.querySelectorAll('[data-action]')].find(control =>
      control.dataset.action === focused.action && control.dataset.value === focused.value)?.focus({ preventScroll: true });
  }
}
function showNotifications() {
  showDialog('Уведомления', `<div class="notice-list">${notifications().map(item => `<article class="activity-row ${state.read.includes(item.id) ? '' : 'unread'}"><span class="tile-icon">${icon(item.icon, 18)}</span><div><strong>${escape(item.title)}</strong><small>${escape(item.text)}</small></div></article>`).join('')}</div><div class="actions">${button('Прочитать всё', 'read', { style: 'primary', attrs: notifications().every(item => state.read.includes(item.id)) ? 'disabled' : '' })}${button('Закрыть', 'close')}</div>`);
}
function showGoalForm() {
  showDialog('Новая цель', `<form id="new-goal"><label>Название цели<input name="title" maxlength="100" required autofocus placeholder="Например, читать каждый день"></label><label>Категория<select name="category">${categories.slice(1).map(item => `<option value="${item}">${item}</option>`).join('')}</select></label><label>Срок<input type="date" name="due" required></label><div class="actions"><button type="submit" class="button primary">Сохранить</button>${button('Отмена', 'close')}</div></form>`);
}
const demo = [
  ['home', 'demo-progress', 'Прогресс недели', 'Здесь виден текущий индекс активности и изменение за неделю.'],
  ['analytics', 'demo-analytics', 'Аналитика', 'Меняй период и категорию. Нажми на точку графика, чтобы узнать значение.'],
  ['goals', 'demo-goals', 'Цели', 'Здесь можно создать цель и отметить её выполненной.'],
];
function showTour() {
  document.querySelector('.tour-focus')?.classList.remove('tour-focus');
  const [, target, title, message] = demo[demoStep];
  document.getElementById(target)?.classList.add('tour-focus');
  modal.classList.add('tour');
  showDialog(title, `<p class="tour-step">Шаг ${demoStep + 1} из ${demo.length}</p><p>${message}</p><div class="actions">${button(demoStep === demo.length - 1 ? 'К главной' : 'Далее', 'demo-next', { style: 'primary', symbol: 'arrow' })}${button('Закрыть демо', 'close')}</div>`);
}
function beginDemo() {
  demoStep = 0;
  goalFilter = 'all';
  go(demo[0][0]);
}
function nextDemo() {
  demoStep += 1;
  if (demoStep === demo.length) {
    modal.close();
    go('home');
    return;
  }
  go(demo[demoStep][0]);
}
function refresh() {
  loading = true;
  render();
  refreshTimer = setTimeout(() => {
    state.updates += 1;
    state.read = state.read.filter(id => id !== 'progress');
    loading = false;
    render();
    if (route() === 'home') app.querySelector('[data-action="refresh"]').focus({ preventScroll: true });
    notify('Демо-данные обновлены');
  }, 620);
}
function complete(id) {
  const goal = state.goals.find(item => item.id === id);
  if (!goal || goal.done) return;
  goal.done = true;
  goal.progress = 100;
  completedGoal = id;
  state.events.unshift({ id: `done-${id}`, title: 'Цель выполнена', text: goal.title });
  if (goalFilter === 'active') goalFilter = 'all';
  render();
  app.querySelector('.celebrate h2')?.setAttribute('tabindex', '-1');
  app.querySelector('.celebrate h2')?.focus({ preventScroll: true });
  completedGoal = '';
  notify('Цель выполнена!');
}
function reset() {
  clearTimeout(refreshTimer);
  loading = false;
  state = fresh();
  period = 'week';
  category = 0;
  goalFilter = 'all';
  modal.close();
  history.replaceState(null, '', '#welcome');
  render();
  notify('Демо-данные сброшены');
}
const actions = {
  start: () => go('home'),
  demo: beginDemo,
  'demo-next': nextDemo,
  close: () => modal.close(),
  refresh,
  period: value => { period = value; render(true); },
  category: value => { category = Number(value); render(true); },
  'goal-filter': value => { goalFilter = value; render(true); },
  plot: (value, control) => {
    const pressed = control.getAttribute('aria-pressed') === 'true';
    app.querySelectorAll('.chart-hit').forEach(point => point.setAttribute('aria-pressed', 'false'));
    control.setAttribute('aria-pressed', String(!pressed));
  },
  add: showGoalForm,
  complete,
  advice: value => {
    const item = advice.find(entry => entry.id === value);
    showDialog(item.title, `<p>${item.detail}</p><p class="muted">Демонстрационная рекомендация</p><div class="actions">${button('Закрыть', 'close')}</div>`);
  },
  hide: value => { state.hidden.push(value); render(); notify('Рекомендация скрыта'); },
  restore: () => { state.hidden = []; render(); notify('Рекомендации возвращены'); },
  notifications: showNotifications,
  read: () => {
    state.read = notifications().map(item => item.id);
    save();
    app.querySelector('.bell i')?.remove();
    app.querySelector('.bell').setAttribute('aria-label', 'Уведомления');
    showNotifications();
    modal.querySelector('[data-action="close"]').focus();
  },
  reset: () => showDialog('Сбросить демо-данные?', `<p>Добавленные цели и настройки будут удалены. Приложение вернётся к стартовому экрану.</p><div class="actions">${button('Сбросить', 'confirm-reset', { style: 'danger' })}${button('Отмена', 'close', { attrs: 'autofocus' })}</div>`),
  'confirm-reset': reset,
};
document.addEventListener('click', event => {
  const control = event.target.closest('[data-action]');
  if (control && !control.disabled) actions[control.dataset.action](control.dataset.value, control);
});
document.addEventListener('change', event => {
  const key = event.target.dataset.setting;
  if (!key) return;
  state[key] = event.target.checked;
  save();
  applyTheme();
  if (key === 'notifications') {
    const bell = app.querySelector('.bell');
    const unread = state.notifications && notifications().some(item => !state.read.includes(item.id));
    bell.setAttribute('aria-label', unread ? 'Новые уведомления' : 'Уведомления');
    bell.innerHTML = icon('bell') + (unread ? '<i></i>' : '');
  }
});
modal.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const title = data.get('title').trim();
  if (!title) {
    form.elements.title.setCustomValidity(document.documentElement.lang === 'en' ? 'Enter a goal name.' : 'Введи название цели.');
    form.elements.title.reportValidity();
    form.elements.title.addEventListener('input', () => form.elements.title.setCustomValidity(''), { once: true });
    return;
  }
  const id = globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36);
  state.goals.unshift({ id, title, category: data.get('category'), due: data.get('due'), done: false, progress: 0 });
  goalFilter = 'all';
  modal.close();
  render();
  app.querySelector('[data-action="add"]')?.focus();
  notify('Цель добавлена');
});
let backdropDown = false;
modal.addEventListener('pointerdown', event => { backdropDown = event.target === modal; });
modal.addEventListener('click', event => {
  if (backdropDown && event.target === modal) modal.close();
  backdropDown = false;
});
modal.addEventListener('close', () => {
  demoStep = -1;
  modal.classList.remove('tour');
  document.querySelector('.tour-focus')?.classList.remove('tour-focus');
});
window.addEventListener('hashchange', () => {
  const atTourStep = demo[demoStep]?.[0] === route();
  if (modal.open && !atTourStep) modal.close();
  render();
  window.scrollTo(0, 0);
  if (atTourStep) showTour();
  else {
    const headline = app.querySelector('h1');
    headline?.setAttribute('tabindex', '-1');
    headline?.focus({ preventScroll: true });
  }
});
if (!location.hash) history.replaceState(null, '', `#${route()}`);
render();
