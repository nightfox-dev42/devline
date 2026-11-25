'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);
const storageKey = 'devline-framework-v1';
const requestStatuses = ['Новая', 'В работе', 'На согласовании', 'Завершена', 'Архив'];
const taskStatuses = ['К выполнению', 'В работе', 'На проверке', 'Готово'];
const documentStatuses = ['На проверке', 'Утверждён', 'Черновик'];
const priorities = ['Высокий', 'Средний', 'Низкий'];
const periods = ['Неделя', 'Месяц', 'Квартал', 'Год'];
const routes = {
  dashboard: 'Dashboard', requests: 'Заявки', tasks: 'Задачи', kanban: 'Kanban',
  documents: 'Документы', analytics: 'Аналитика', team: 'Команда', settings: 'Настройки'
};
const members = [
  ['Саша Ветров', 'Операционный менеджер', 'Операции', 76, true],
  ['Лика Север', 'Продуктовый дизайнер', 'Дизайн', 64, true],
  ['Рэй Искрин', 'Frontend-разработчик', 'Разработка', 82, true],
  ['Мира Таль', 'Аналитик', 'Операции', 58, false],
  ['Ким Рощин', 'Дизайн-лид', 'Дизайн', 90, true],
  ['Ян Лазурь', 'Инженер интеграций', 'Разработка', 46, false]
];
const owners = members.map(member => member[0]);
const memberActivity = ['4 мин назад','12 мин назад','18 мин назад','Вчера, 17:40','27 мин назад','Вчера, 16:20'];
const companies = ['Точка Сбора', 'Вектор 09', 'Параллель', 'Облако 17', 'Контур Маяка', 'Орбита Данных'];
const localDay = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
};
const formatDate = (value, long = false) => new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: long ? 'long' : 'short', ...(long ? {year:'numeric'} : {})
}).format(new Date(value + 'T12:00:00'));
const seed = () => ({
  active: false, route: 'dashboard', theme: 'dark', compact: false, motion: true,
  period: 'Месяц', chart: 'Столбцы', revision: 0, nextRequest: 1090, nextTask: 210,
  filters: {requests: {query:'', status:'', priority:'', sort:'Сначала новые'}, tasks: {owner:'', status:''}, documents: {query:'', status:''}, team: {department:''}},
  requests: ['Настройка панели отчётов','Интеграция каталога','Аудит операционных процессов','Веб-приложение для команды','Аналитика обращений','Настройка доступа'].map((service,i) => ({
    id: 1088 - i, client: ['Тая Парус', 'Эрик Маяк', 'Мика Луч', 'Ника Вьюга', 'Лев Кварц', 'Ада Полюс'][i],
    company: companies[i], service, owner: owners[i], status: requestStatuses[[0,1,2,3,1,4][i]], date:localDay(-i),
    due:localDay(i+4), priority:priorities[i%3], effort:[16,24,12,40,20,8][i], description:'Уточнить требования команды и согласовать состав первого этапа.', notes:[]
  })),
  tasks: ['Согласовать поля формы заявки','Обновить схему интеграции','Подготовить еженедельный отчёт','Проверить доступы команды','Собрать требования к каталогу','Проверить расчёт конверсии','Обновить гайд по статусам','Сверить список документов'].map((title,i) => ({
    id: 201+i, title, owner:owners[i%6], status:taskStatuses[i%4], priority:priorities[i%3], due: localDay(i-2),
    description:'Согласовать детали с ответственным и проверить результат перед передачей команде.'
  })),
  documents: ['Регламент обработки заявок','Отчёт команды за месяц','Карта интеграций','Матрица ответственности','Чек-лист передачи проекта'].map((title,i) => ({
    id: i+1, title, type: ['PDF','XLSX','PDF','DOCX','PDF'][i], size: [428,182,736,94,256][i] + ' КБ', owner:owners[i],
    date:localDay(-i), status:documentStatuses[i%3]
  })),
  notifications: [
    ['inbox','Новая заявка','Точка Сбора · Настройка панели отчётов','5 мин назад'],
    ['kanban','Статус изменён','Интеграция каталога → В работе','23 мин назад'],
    ['message','Новый комментарий','Лика Север уточнила требования к каталогу','42 мин назад'],
    ['clock','Просроченная задача','Согласовать поля формы заявки','1 ч назад'],
    ['file','Новый документ','Регламент обработки заявок','2 ч назад']
  ].map(([icon,title,body,time], i) => ({id: i+1, icon,title,body,time,read: i>2}))
});
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved ? {...seed(), ...saved} : seed();
  } catch {
    return seed();
  }
}
let state = loadState();
function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    toast('Хранилище недоступно. Изменения действуют до перезагрузки.');
  }
}
const isRoute = (key) => Object.hasOwn(routes, key);
let route = isRoute(location.hash.slice(1)) ? location.hash.slice(1) : isRoute(state.route) ? state.route : 'dashboard';

const iconPaths = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  inbox:'<path d="M4 4h16l2 11v5H2v-5zM2 15h6l2 2h4l2-2h6"/>',
  tasks:'<path d="M9 6h11M9 12h11M9 18h11M3 6l1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/>',
  kanban:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m6-16v16M6 8v5m6-5v3m6-3v7"/>',
  file:'<path d="M5 3h9l5 5v13H5zM14 3v6h5M8 13h8m-8 4h8"/>',
  chart:'<path d="M3 3v18h18M7 15l4-5 4 2 6-7"/>',
  team:'<circle cx="9" cy="8" r="3"/><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 4 5v2"/>',
  settings:'<path d="m10 3-1 3-3 1-3 3 2 2-1 4 3 2 3-1 2 4 3-1 1-3 4-1 1-4-3-2V6l-4-2-2 2z"/><circle cx="12" cy="12" r="3"/>',
  bell:'<path d="M5 17h14l-2-3V9a5 5 0 1 0-10 0v5zm5 3a2 2 0 0 0 4 0"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  refresh:'<path d="M20 8a8 8 0 0 0-14-2L3 9m0-5v5h5m-4 7a8 8 0 0 0 14 2l3-3m0 5v-5h-5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  external:'<path d="M7 17 17 7M7 7h10v10"/>', search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>', clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check:'<path d="m4 12 5 5L20 6"/>', message:'<path d="M3 4h18v12H9l-6 5zM7 8h10m-10 4h7"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', chevron:'<path d="m9 6 6 6-6 6"/>',
  bars:'<path d="M4 20h17M7 16v-5m5 5V5m5 11V8"/>', moon:'<path d="M20 15A8 8 0 0 1 9 4a9 9 0 1 0 11 11z"/>'
};
const icon = (name, size = 18) => '<svg aria-hidden="true" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">' + (iconPaths[name] || '') + '</svg>';
const routeIcons = {dashboard:'grid',requests:'inbox',tasks:'tasks',kanban:'kanban',documents:'file',analytics:'chart',team:'team',settings:'settings'};
const logo = '<svg aria-hidden="true" viewBox="0 0 40 40" width="40" height="40"><rect width="40" height="40" rx="14" fill="#e9b29b"/><path d="m9 16 11-6 11 6-11 6zm0 5 11 6 11-6m-22 5 11 6 11-6" fill="none" stroke="#49382f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const button = (label, action, {glyph='', style='', id='', extra=''} = {}) =>
  `<button type="button" class="button ${style}" data-action="${action}" ${id ? `data-id="${id}"` : ''} ${extra}>${glyph ? icon(glyph) : ''}${label}</button>`;
const options = (values, selected, placeholder) => (placeholder ? `<option value="">${placeholder}</option>` : '') +
  values.map(value => `<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('');
const select = (name, label, values, selected, placeholder='', extra='') =>
  `<select name="${name}" aria-label="${label}" ${extra}>${options(values,selected,placeholder)}</select>`;
const badge = (status) => {
  const color = {'Новая':'blue','В работе':'blue','На согласовании':'amber','Завершена':'green','Готово':'green','Утверждён':'green','На проверке':'amber','Просрочено':'urgent','Архив':'neutral','Черновик':'neutral','К выполнению':'neutral'}[status] || 'neutral';
  return `<span class="badge ${color}"><i></i>${status}</span>`;
};
const priorityLabel = (value) => `<span class="priority p${priorities.indexOf(value)}"><span aria-hidden="true">${['↑','−','↓'][priorities.indexOf(value)]}</span> ${value}</span>`;
const initials = (name) => name.split(' ').map(part => part[0]).slice(0,2).join('');
const avatar = (name) => `<span class="avatar avatar-${owners.indexOf(name)%6}" aria-hidden="true">${escapeHtml(initials(name))}</span>`;
const person = (name) => `<span class="person">${avatar(name)}${escapeHtml(name)}</span>`;
const brand = () => `<div class="brand">${logo}<b>FRAMEWORK</b></div>`;
const navLink = (key, label = routes[key]) => `<a href="#${key}" ${key === route ? 'aria-current="page"' : ''}>${icon(routeIcons[key])}<span>${label}</span></a>`;
const heading = (title, desc, actions='') => `<div class="page-heading"><div class="heading-copy"><h1>${title}</h1>${desc ? `<p>${desc}</p>` : ''}</div><div class="heading-actions">${actions}</div></div>`;
const table = (headers, rows, label) => `<div class="table-scroll" tabindex="0" role="region" aria-label="${label}"><table><thead><tr>${headers.map(header => `<th scope="col">${header}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}" class="empty">По выбранным условиям ничего нет.</td></tr>`}</tbody></table></div>`;
const row = (...cells) => `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
const itemLink = (label, action, id) => button(escapeHtml(label),action,{id,style:'text-button'});
const progress = (value) => `<progress max="100" value="${value}" aria-label="Прогресс: ${value}%"></progress>`;
const taskProgress = (item) => [0,45,80,100][taskStatuses.indexOf(item.status)];
const teamLoad = (member) => {
  const active = state.tasks.filter(task => task.owner === member[0] && task.status !== 'Готово').length;
  return Math.min(100,member[3] + (active - ([2,1,1,0,1,1][owners.indexOf(member[0])])) * 5);
};
function toast(message) {
  const notice = $('#notice');
  notice.textContent = message;
  notice.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => notice.classList.remove('visible'), 3000);
}
const devlineLinks = () => `<div class="devline-links"><a href="https://nightfox-dev42.github.io/devline/">DEVLINE ${icon('external',13)}</a><a href="https://t.me/devline_ru">Telegram ${icon('external',13)}</a></div>`;
function renderLogin() {
  $('#login').innerHTML = `<div class="login-layout"><section class="login-intro">
    ${brand()}<div><h1>Работа команды<br>в одном пространстве</h1>
    <p>Заявки, задачи, документы и аналитика.</p></div>
    <div class="login-graphic" aria-hidden="true"><i></i><i></i><i></i></div>
    ${devlineLinks()}
    </section><section class="login-form-wrap"><form class="panel login-form" data-form="login">
      <h2>Вход в FRAMEWORK</h2><p>Откройте демо или используйте тестовые данные для входа.</p>
      <label>Email<input name="email" type="email" autocomplete="off" placeholder="demo@example.test" required></label>
      <label>Пароль<input name="password" type="password" autocomplete="off" placeholder="Любой тестовый пароль" minlength="4" required></label>
      <button class="button primary" type="submit">Войти ${icon('arrow')}</button>
      ${button('Посмотреть демо','demo')}
      <small>Все данные на странице являются демонстрационными.</small>
    </form></section></div>`;
}
function updateChrome() {
  const unread = state.notifications.filter(item => !item.read).length;
  const opened = $('#overlay').open;
  $('#rail').innerHTML = `${brand()}<nav class="main-nav command-nav" aria-label="Разделы">${Object.keys(routes).map(key=>navLink(key,key==='dashboard'?'Обзор':routes[key])).join('')}</nav>${devlineLinks()}`;
  $('#topbar').innerHTML = `<div class="command-line"><div class="mobile-brand">${brand()}</div><div class="workspace-name">${icon('grid',15)} Рабочее пространство ${icon('chevron',12)} <b>${route==='dashboard'?'Обзор':routes[route]}</b></div>
    <div class="top-actions"><span class="header-date">${icon('calendar',16)} ${formatDate(localDay())}</span>
    ${button(unread ? `<span class="bell-dot" aria-hidden="true">${unread > 99 ? '99+' : unread}</span>`:'','notifications',{glyph:'bell',style:'icon-button',extra:`aria-label="Уведомления${unread ? ', непрочитанных: '+unread : ''}" aria-controls="overlay" aria-expanded="${opened && overlayKind === 'notifications'}"`})}
    <a class="profile-link" href="#settings" aria-label="Настройки профиля">${avatar(owners[0])}</a></div></div>`;
  $('#bottom-nav').innerHTML = ['dashboard','requests','tasks','kanban'].map(key=>navLink(key,key==='dashboard' ? 'Обзор' : routes[key])).join('') +
    `<button type="button" data-action="menu" aria-controls="overlay" ${['dashboard','requests','tasks','kanban'].includes(route) ? '' : 'aria-current="true"'} aria-expanded="${opened && overlayKind === 'menu'}">${icon('menu')}<span>Ещё</span></button>`;
}
function applySettings() {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.dataset.motion = state.motion ? 'on' : 'off';
  document.documentElement.classList.toggle('compact',state.compact);
  $('meta[name="theme-color"]').content = state.theme === 'dark' ? '#29312d' : '#e9eee7';
}
const periodControl = (segmented = false) => segmented
  ? `<div class="segmented" role="group" aria-label="Период аналитики">${periods.map(period => button(period,'period',{extra:`data-value="${period}" aria-pressed="${state.period===period}"`})).join('')}</div>`
  : `<label class="period-select">${icon('calendar',16)}${select('period','Период аналитики',periods,state.period,'','data-setting="period"')}</label>`;
const chartSeries = {
  'Неделя': {labels:['Пн','Вт','Ср','Чт','Пт','Сб','Вс'], values:[21,35,28,50,44,64,60]},
  'Месяц': {labels:['1','4','7','10','13','16','19','22','25','28'], values:[28,52,43,68,56,88,76,109,102,128]},
  'Квартал': {labels:['1 нед.','3 нед.','5 нед.','7 нед.','9 нед.','11 нед.','13 нед.'], values:[60,104,123,105,146,172,195]},
  'Год': {labels:['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'], values:[72,88,84,115,108,163,157,190,185,212,238,251]}
};
function chart(title, type, series, variant='') {
  const maximum = Math.ceil((Math.max(...series.values)*1.13)/20)*20;
  const bars = type === 'Столбцы';
  const step = 90 / (series.values.length - 1);
  const points = series.values.map((value,i) => [5+i*step,100-value/maximum*100]);
  const path = points.map(([x,y])=>x+','+y).join(' ');
  return `<div class="chart ${variant}" role="group" aria-label="${title}"><div class="axis-y" aria-hidden="true">${[1,.75,.5,.25,0].map(part=>`<span>${Math.round(maximum*part)}</span>`).join('')}</div>
    <div class="plot-wrap"><div class="plot ${bars ? 'bar-plot' : ''}">
      ${bars ? '' : `<svg class="chart-art" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${path}" fill="none" stroke="currentColor" stroke-width="1.75" vector-effect="non-scaling-stroke"/></svg>`}
      ${points.map(([x,y],i)=>`<button type="button" class="chart-point ${bars?'bar':''} ${i===points.length-1?'latest':''}" style="--x:${x}%;--y:${y}%;--bar-width:${Math.min(step*.65,10)}%" data-action="chart-point" aria-pressed="false" aria-label="${series.labels[i]}: ${series.values[i]}"><span class="point-tip" aria-hidden="true">${series.labels[i]} <b>${series.values[i]}</b></span></button>`).join('')}
    </div><div class="axis-x" aria-hidden="true">${series.labels.map((label,i)=>`<span style="left:${points[i][0]}%">${label}</span>`).join('')}</div></div></div>`;
}
function sparkline(values) {
  const max=Math.max(...values);
  const points=values.map((value,i)=>`${i*80/(values.length-1)},${21-value*19/max}`).join(' ');
  return `<svg class="sparkline" viewBox="0 0 80 24" width="63" height="21" aria-hidden="true"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
}
const effortLabel = item => {
  const hours = item.effort ?? [16,24,12,40,20,8][1088-item.id];
  return hours ? escapeHtml(hours)+' ч' : '—';
};
function requestTable(items, short = false) {
  return table(short ? ['Заявка','Услуга','Статус','Приоритет','Ответственный','Создана'] :
    ['Заявка','Клиент','Компания','Услуга','Ответственный','Статус','Приоритет','Дата','Оценка','Описание'],
  items.map(item => {
    const identifier=itemLink('FW-'+item.id,'request',item.id);
    const service=escapeHtml(item.service);
    const status=badge(item.status);
    const priority=priorityLabel(item.priority);
    const owner=person(item.owner);
    const date=formatDate(item.date);
    return short ? row(identifier,service,status,priority,owner,date) :
      row(identifier,escapeHtml(item.client),escapeHtml(item.company),service,owner,status,priority,date,effortLabel(item),`<span class="request-summary">${escapeHtml((item.description || '').slice(0,100)) || '—'}</span>`);
  }).join(''),short ? 'Последние заявки' : 'Список заявок');
}
function requestSeries() {
  const series = chartSeries[state.period];
  return {...series,values:series.values.map((value,i)=>value+state.revision%10*(i%4)+Math.max(0,state.requests.length-6))};
}
const isOverdue = task => task.status!=='Готово' && task.due<localDay();
const taskDeadline = task => `<span class="${isOverdue(task)?'overdue':''}">${formatDate(task.due)}</span>`;
const taskIndex = task => `<span class="record-index">TS-${task.id}</span>`;
function dashboard() {
  const revision = state.revision%11;
  const ongoing = state.tasks.filter(task=>task.status!=='Готово');
  const done = state.tasks.length-ongoing.length;
  const overdue = ongoing.filter(isOverdue);
  const urgent = state.requests.filter(item=>item.priority==='Высокий' && !['Завершена','Архив'].includes(item.status));
  const active = ongoing.length + state.requests.filter(item=>!['Завершена','Архив'].includes(item.status)).length;
  const completion = Math.min(100,84+done+revision);
  const metrics = [
    ['inbox','Новые заявки',128+revision+state.requests.filter(item=>item.status==='Новая').length-1,'+14% за месяц','sand'],
    ['tasks','Активные задачи',41+revision+ongoing.length,'+6 к прошлому периоду','sage'],
    ['file','Документы на проверке',10+state.documents.filter(doc=>doc.status==='На проверке').length,'12 проектов завершено','mist']
  ];
  const review = state.tasks.filter(item=>item.status==='На проверке').length;
  return `${heading('Состояние команды','Добрый день, Саша! · '+formatDate(localDay(),true),
    button('<span class="refresh-full">Обновить данные</span><span class="refresh-short">Обновить</span>','refresh',{glyph:'refresh',style:'refresh-button',extra:'aria-label="Обновить данные"'})+button('Новая заявка','new-request',{glyph:'plus',style:'primary'}))}
    <div class="report-grid">
      <section class="panel team-hero"><div class="hero-copy">
        <span class="hero-state"><i></i> ${active} активных процессов</span>
        <h2>Задачи выполнены</h2><strong data-metric="${completion}%">${completion}%</strong>
        ${progress(completion)}<p><b>+18%</b> эффективности за месяц</p>
      </div><div class="hero-art"><img src="assets/team-form.webp" alt="" width="952" height="720" fetchpriority="high" decoding="async"></div></section>
      <section class="panel attention"><div class="panel-head"><h2>Требует внимания</h2><span class="attention-count">${overdue.length+urgent.length}</span></div>
        <div class="attention-rows"><a href="#tasks" data-queue="overdue"><span>Просроченные задачи</span><b>${overdue.length}</b>${icon('chevron',15)}</a>
        <a href="#requests" data-queue="urgent"><span>Срочные заявки</span><b>${urgent.length}</b>${icon('chevron',15)}</a></div>
        <div class="insight"><div>${icon('check',16)}<b>Рекомендация</b></div><p>${review ? 'Начните с задач на проверке, чтобы освободить очередь.' : 'Очередь на проверке пуста. Сверьте ближайшие дедлайны.'}</p>
        <a class="text-link" href="${review?'#kanban':'#tasks'}">${review?'Открыть Kanban':'Открыть задачи'} ${icon('arrow',15)}</a></div>
      </section>
      <div class="stats" aria-label="Ключевые показатели">${metrics.map(([glyph,label,value,note,tone],i)=>`<article class="panel stat ${tone}" style="--order:${i}"><div class="stat-label"><span>${icon(glyph,17)}</span>${label}</div>
        <div class="stat-value"><strong data-metric="${value}">${value}</strong>${i===0?sparkline(requestSeries().values):''}</div><small>${note}</small></article>`).join('')}</div>
      <section class="panel chart-panel report-chart"><div class="panel-head"><div><h2>Динамика заявок</h2><p>Входящий поток по выбранному периоду</p></div>${periodControl()}</div>
        ${chart('Динамика заявок','Столбцы',requestSeries(),'dashboard-chart')}<div class="chart-bottom"><span>Заявки · ${state.period.toLowerCase()}</span><strong>+${18+revision}% за период</strong></div></section>
      <section class="panel activity"><div class="panel-head"><div><h2>Последние действия</h2><p>Журнал команды</p></div>${icon('clock',17)}</div>
        <ul>${state.notifications.slice(0,5).map(item=>`<li><div class="activity-icon">${icon(item.icon,15)}</div><div><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.body)}</small></div><time>${escapeHtml(item.time)}</time></li>`).join('') || '<li>Пока нет событий</li>'}</ul>
        ${button('Все уведомления','notifications',{glyph:'arrow',style:'text-button'})}</section>
      <section class="panel recent"><div class="panel-head"><h2>Задачи и сроки</h2><a class="text-link" href="#tasks">Все задачи ${icon('arrow',16)}</a></div>
        ${table(['Номер','Задача','Срок','Статус','Ответственный'],ongoing.sort((a,b)=>a.due.localeCompare(b.due)).slice(0,5).map(task=>row(taskIndex(task),itemLink(task.title,'task',task.id),taskDeadline(task),badge(isOverdue(task)?'Просрочено':task.status),person(task.owner))).join(''),'Задачи и сроки')}</section>
      <section class="panel team-load"><div class="panel-head"><h2>Загрузка команды</h2><a class="text-link" href="#team">Команда ${icon('arrow',16)}</a></div>${loadRows(members.slice(0,3))}</section>
      <section class="panel recent report-recent"><div class="panel-head"><h2>Последние заявки</h2><a class="text-link" href="#requests">Все заявки ${icon('arrow',16)}</a></div>${requestTable(state.requests.slice(0,4),true)}</section>
    </div>`;
}
function loadRows(list) {
  return `<div class="load-list">${list.map(member => `<div><span>${person(member[0])}<b>${teamLoad(member)}%</b></span>${progress(teamLoad(member))}</div>`).join('')}</div>`;
}
function filteredRequests() {
  const {query,status,priority,sort,activeOnly} = state.filters.requests;
  const order = sort === 'Приоритет' ? (a,b)=>priorities.indexOf(a.priority)-priorities.indexOf(b.priority) || b.id-a.id :
    sort === 'Сначала старые' ? (a,b)=>a.date.localeCompare(b.date) || a.id-b.id : (a,b)=>b.date.localeCompare(a.date) || b.id-a.id;
  return state.requests.filter(item => (!activeOnly || !['Завершена','Архив'].includes(item.status)) && (!status || item.status===status) && (!priority || item.priority===priority) &&
    [item.client,item.company,item.service,'FW-'+item.id].some(value=>value.toLowerCase().includes(query.trim().toLowerCase()))).sort(order);
}
function searchBox(placeholder,value) {
  return `<label class="search-box">${icon('search',17)}<input type="search" placeholder="${placeholder}" aria-label="${placeholder}" name="query" value="${escapeHtml(value)}" data-filter></label>`;
}
function requests() {
  const {query,status,priority,sort} = state.filters.requests;
  return heading('Заявки','Поиск и обработка входящих заявок команды.',button('Новая заявка','new-request',{glyph:'plus',style:'primary'})) +
    `<section class="panel listing"><div class="filters">${searchBox('Поиск по клиенту, компании или услуге',query)}
      ${select('status','Статус заявки',requestStatuses,status,'Все статусы','data-filter')}
      ${select('priority','Приоритет',priorities,priority,'Все приоритеты','data-filter')}
      ${select('sort','Сортировка',['Сначала новые','Сначала старые','Приоритет'],sort === 'recent' ? 'Сначала новые' : sort,'','data-filter')}</div>
      ${state.filters.requests.activeOnly ? button('Показать также завершённые и архивные','clear-active-requests',{style:'queue-reset'}) : ''}<div id="results">${requestResults()}</div></section>`;
}
function requestResults() {
  const items = filteredRequests();
  return `<p class="result-count" aria-live="polite">Заявок: ${items.length}</p>${requestTable(items)}`;
}
function tasks() {
  const {owner,status} = state.filters.tasks;
  const items = state.tasks.filter(item=>(!owner || item.owner===owner) && (!status || (status==='Просрочено' ? isOverdue(item) : item.status===status)));
  return heading('Задачи','Планы, сроки и ответственность команды.',button('Создать задачу','new-task',{glyph:'plus',style:'primary'})+
    `<a class="button" href="#kanban">${icon('kanban')} Kanban</a>`) +
    `<section class="panel listing"><div class="filters">${select('owner','Ответственный',owners,owner,'Все сотрудники','data-filter')}${select('status','Статус задачи',[...taskStatuses,'Просрочено'],status,'Все статусы','data-filter')}</div><p class="result-count">Задач: ${items.length}</p>
    ${table(['Задача','Статус','Приоритет','Срок','Ответственный','Прогресс','Действие'],items.map(item=>row(
      taskIndex(item)+' '+itemLink(item.title,'task',item.id),badge(item.status),priorityLabel(item.priority),
      `<span class="${item.due<localDay() && item.status!=='Готово' ? 'overdue' : ''}">${formatDate(item.due)}</span>`,person(item.owner),
      `<div class="table-progress">${progress(taskProgress(item))}${taskProgress(item)}%</div>`, item.status==='Готово' ? icon('check') :
      button('Выполнить','complete-task',{id:item.id,glyph:'check',style:'small-button'}))).join(''),'Список задач')}</section>`;
}
function kanban() {
  return heading('Kanban','Перетащите карточку или смените статус в списке на карточке.',
    button('Создать задачу','new-task',{glyph:'plus',style:'primary'})) + `<div class="kanban-grid">${taskStatuses.map((status,i)=>{
      const items=state.tasks.filter(item=>item.status===status);
      return `<section class="kanban-lane lane-${i}" data-lane="${i}"><h2><i></i>${status} <span>${items.length}</span></h2>
      ${items.map(item=>`<article class="task-card" draggable="true" data-task="${item.id}">
        ${taskIndex(item)}${itemLink(item.title,'task',item.id)}
        <div class="task-meta">${priorityLabel(item.priority)}${taskDeadline(item)}</div>
        <div class="task-owner">${person(item.owner)}</div>
        <div class="task-meta">${select('move',escapeHtml('Переместить задачу '+item.title),taskStatuses,status,'',`data-move="${item.id}"`)}</div>
      </article>`).join('') || '<p class="empty">В этой колонке пока нет задач.</p>'}</section>`;
    }).join('')}</div>`;
}
function documentResults() {
  const {query,status}=state.filters.documents;
  const items=state.documents.filter(item=>(!status || item.status===status) && [item.title,item.type,item.owner].some(value=>value.toLowerCase().includes(query.trim().toLowerCase())));
  return `<p class="result-count" aria-live="polite">Документов: ${items.length}</p><div class="document-grid">${items.map(item=>`<article class="panel doc-card">
    <div class="doc-card-head"><span class="doc-icon">${icon('file',22)}</span>${badge(item.status)}</div>
    <h2>${itemLink(item.title,'document',item.id)}</h2>
    <div class="doc-meta"><span>${item.type} · ${item.size}</span><time datetime="${item.date}">${formatDate(item.date)}</time></div>
    <div class="doc-card-foot">${person(item.owner)}${button('Просмотр','preview',{id:item.id,style:'small-button'})}</div>
    </article>`).join('') || '<p class="empty">По выбранным условиям ничего нет.</p>'}</div>`;
}
function documents() {
  const {query,status}=state.filters.documents;
  return heading('Документы','Регламенты, отчёты и материалы команды.') +
    `<section class="document-listing"><div class="filters">${searchBox('Поиск по названию, типу или автору',query)}${select('status','Статус документа',documentStatuses,status,'Все статусы','data-filter')}</div>
    <div id="results">${documentResults()}</div></section>`;
}


function donut(counts) {
  const total=counts.reduce((sum,value)=>sum+value,0);
  let offset=0;
  const segments=counts.map((value,i)=>{
    const percent=100*value/Math.max(1,total);
    const part=`<circle class="lane-${i}" cx="64" cy="64" r="51" pathLength="100" stroke-dasharray="${Math.max(0,percent-1.3)} 100" stroke-dashoffset="${-offset}"/>`;
    offset+=percent;
    return value ? part : '';
  }).join('');
  return `<div class="donut" aria-hidden="true"><svg viewBox="0 0 128 128"><circle class="donut-base" cx="64" cy="64" r="51"/>${segments}</svg><strong>${total}<small>задач</small></strong></div>`;
}
function analytics() {
  const series=requestSeries();
  const tasks=series.values.map((value,i)=>Math.round(value*.56+i+state.tasks.filter(item=>item.status==='Готово').length));
  const counts=taskStatuses.map(status=>state.tasks.filter(item=>item.status===status).length);
  const requestCounts=requestStatuses.slice(0,4).reverse().map((status,i)=>state.requests.filter(item=>requestStatuses.indexOf(item.status)>=3-i && item.status!=='Архив').length).reverse();
  const scale=Math.max(1,requestCounts[0]);
  const chartControl=select('chart','Тип графика заявок',['Линия','Столбцы'],state.chart,'','data-setting="chart"');
  const sum=values=>values.reduce((total,value)=>total+value,0);
  const previous=series.values.map((value,i)=>Math.round(value*(.83+(i%3)*.035)));
  const change=Math.round((sum(series.values)/Math.max(1,sum(previous))-1)*100);
  return heading('Аналитика','Динамика заявок, выполнение задач и загрузка команды.',periodControl(true)+chartControl) +
    `<div class="analytics-grid">
    <div class="analytics-summary"><div><span>Заявки · ${state.period.toLowerCase()}</span><strong>${sum(series.values)}</strong></div><div><span>Прошлый период</span><strong>${sum(previous)}</strong></div><div><span>Изменение</span><strong>+${change}% ${sparkline(series.values)}</strong></div></div>
    <section class="panel chart-panel"><div class="panel-head"><h2>График заявок</h2><span class="legend"><i></i> Заявки</span></div>${chart('График заявок',state.chart,series,'requests-chart')}</section>
    <section class="panel chart-panel"><div class="panel-head"><h2>Выполнение задач</h2><span class="legend"><i></i> Выполнено</span></div>${chart('Выполнение задач',state.chart==='Столбцы'?'Линия':'Столбцы',{labels:series.labels,values:tasks},'tasks-chart')}</section>
    <section class="panel"><div class="panel-head"><h2>Загрузка команды</h2></div>${loadRows(members)}</section>
    <section class="panel"><div class="panel-head"><h2>Распределение по статусам</h2></div><div class="distribution-layout">${donut(counts)}<ul class="distribution-key">${taskStatuses.map((status,i)=>`<li>${badge(status)}<b>${counts[i]}</b></li>`).join('')}</ul></div></section>
    <section class="panel"><div class="panel-head"><h2>Конверсия по этапам</h2></div><div class="load-list">${['Получено','Начата работа','Согласование','Завершено'].map((label,i)=>`<div><span>${label}<b>${Math.round(requestCounts[i]/scale*100)}%</b></span>${progress(Math.round(requestCounts[i]/scale*100))}</div>`).join('')}</div></section></div>`;
}
function team() {
  const department=state.filters.team.department;
  return heading('Команда','Участники рабочего пространства и их загрузка.',select('department','Отдел',['Операции','Дизайн','Разработка'],department,'Все отделы','data-filter')) +
    `<div class="member-grid">${members.filter(member=>!department || department===member[2]).map(member=>{
      const [name,role,dept,,online]=member;
      const active=state.tasks.filter(item=>item.owner===name && item.status!=='Готово').length;
      return `<article class="panel member"><div class="member-top">${avatar(name)}<span class="badge ${online?'green':'neutral'}"><i></i>${online?'Онлайн':'Оффлайн'}</span></div>
      <h2>${itemLink(name,'member',owners.indexOf(name))}</h2><p>${role} · ${dept}</p><div class="member-numbers"><span>Активных задач</span><strong>${active}</strong></div>
      <div class="member-numbers"><span>Загрузка</span><strong>${teamLoad(member)}%</strong></div>${progress(teamLoad(member))}<div class="member-activity"><span>Последняя активность</span><time>${memberActivity[owners.indexOf(name)]}</time></div></article>`;
    }).join('')}</div>`;
}
const toggle = (key,title,description,checked) => `<label class="setting-row"><span><b>${title}</b><small>${description}</small></span>
  <input type="checkbox" role="switch" name="${key}" data-setting="${key}" ${checked?'checked':''}></label>`;
function settings() {
  return heading('Настройки','Персональные параметры этого рабочего пространства.')+
    `<div class="settings-grid"><section class="panel"><div class="panel-head"><h2>Внешний вид</h2>${icon('moon')}</div>
    ${toggle('theme','Тёмная тема','Переключение между светлым и тёмным оформлением.',state.theme==='dark')}
    ${toggle('compact','Компактный режим','Меньше отступы в таблицах и карточках.',state.compact)}
    ${toggle('motion','Анимации','Плавные переходы и построение графиков.',state.motion)}
    </section><section class="panel"><div class="panel-head"><h2>Демо-аккаунт</h2></div>
    <div class="account">${person(owners[0])}<div class="account-actions">${button('Сбросить демо-данные','reset',{style:'danger'})}
    ${button('Выйти из демо','logout',{glyph:'external'})}</div></div></section></div>`;
}
const views = {dashboard,requests,tasks,kanban,documents,analytics,team,settings};
const overlay = $('#overlay');
let overlayKind = '';
let overlayTrigger;
let overlayTriggerSelector;
let refreshPending = false;
let renderCount = 0;
const reduced = () => !state.motion || matchMedia('(prefers-reduced-motion: reduce)').matches;
function animateMetrics() {
  if (reduced()) return;
  const metrics = $$('[data-metric]').map(el=>[el,parseInt(el.dataset.metric,10),el.dataset.metric.endsWith('%') ? '%' : '']);
  if (!metrics.length) return;
  const start = performance.now();
  const version = renderCount;
  function update(now) {
    if (renderCount !== version || reduced()) {
      metrics.forEach(([el])=>{el.textContent=el.dataset.metric;});
      return;
    }
    const part = Math.min(1,(now-start)/420);
    metrics.forEach(([el,value,suffix])=>{el.textContent=Math.round(value*(.75+.25*(1-(1-part)**3)))+suffix;});
    if (part<1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
function render({animate=false} = {}) {
  renderCount++;
  applySettings();
  $('#login').hidden=state.active;
  $('#workspace').hidden=!state.active;
  $('.skip').hidden=!state.active;
  if (!state.active) {
    renderLogin();
    return;
  }
  updateChrome();
  const main = $('#content');
  main.classList.remove('enter');
  main.innerHTML=views[route]();
  if (refreshPending) markRefreshing();
  if (animate) {
    void main.offsetWidth;
    main.classList.add('enter');
    animateMetrics();
  }
  document.title = routes[route] + ' · FRAMEWORK';
}
function openOverlay(title, html, kind='', size='') {
  if (!overlay.open) {
    overlayTrigger = document.activeElement;
    const action = overlayTrigger?.dataset.action;
    const id = overlayTrigger?.dataset.id;
    overlayTriggerSelector = action ? `[data-action="${action}"]${id ? `[data-id="${id}"]` : ''}` : '';
  }
  overlayKind=kind;
  overlay.className=size;
  $('#overlay-body').innerHTML=`<div class="dialog-head"><h2 id="dialog-title">${title}</h2>${button('','close',{glyph:'close',style:'icon-button',extra:'aria-label="Закрыть" autofocus'})}</div>${html}`;
  if (!overlay.open) overlay.showModal();
  else $('[data-action="close"]',overlay).focus();
  syncExpanded();
}
function syncExpanded() {
  $$('[aria-controls="overlay"]').forEach(el=>el.setAttribute('aria-expanded',String(overlay.open && overlayKind===el.dataset.action)));
}
overlay.addEventListener('close',()=>{
  overlayKind='';
  syncExpanded();
  if (!state.active) {
    $('[data-action="demo"]')?.focus();
  } else if (overlayTrigger?.isConnected) {
    overlayTrigger.focus();
  } else {
    const target = (overlayTriggerSelector && $(overlayTriggerSelector)) || $('#content');
    target.focus({preventScroll:true});
  }
});
overlay.addEventListener('click',event=>{
  if (event.target===overlay) overlay.close();
});
const field = (name,label,{value='',type='text',required=true,max=120}={}) =>
  `<label>${label}<input type="${type}" name="${name}" value="${escapeHtml(value)}" ${required?'required':''} ${type==='text'?`maxlength="${max}" pattern=".*\\S.*"`:''}></label>`;
const selectField=(name,label,values,current)=>`<label>${label}${select(name,label,values,current,'','required')}</label>`;
const textarea=(name,label,value='')=>`<label>${label}<textarea name="${name}" rows="3" maxlength="1200">${escapeHtml(value)}</textarea></label>`;
const controls=(label,extra='')=>`<div class="dialog-actions">${extra}${button('Отмена','close')}<button type="submit" class="button primary">${label}</button></div>`;
function createItem(kind) {
  const task=kind==='task';
  const core=task?field('title','Название задачи'):[field('client','Имя клиента'),field('company','Компания'),field('service','Услуга')].join('');
  openOverlay(task?'Создать задачу':'Новая заявка',`<form data-form="new-${kind}"><div class="form-grid">${core}
    ${selectField('priority','Приоритет',priorities,'Средний')}${selectField('owner','Ответственный',owners,owners[0])}
    ${field('due','Срок',{type:'date',value:localDay(7)})}${task?'':`<label>Оценка, ч<input name="effort" type="number" min="1" max="10000" step="1" inputmode="numeric" placeholder="Например, 16"></label>`}</div>${textarea('description','Описание')}${controls('Сохранить')}</form>`);
}
function requestDetails(item) {
  openOverlay('Заявка FW-'+item.id,`<div class="dialog-content"><h3>${escapeHtml(item.service)}</h3>
    <p>${escapeHtml(item.client)} · ${escapeHtml(item.company)}</p>
    <div class="details-meta">${badge(item.status)} ${priorityLabel(item.priority)} <span>Срок ${formatDate(item.due)}</span><span>Оценка: ${effortLabel(item)}</span></div>
    <p class="detail-copy">${escapeHtml(item.description || 'Описание отсутствует.')}</p>
    <form data-form="save-request" data-id="${item.id}"><div class="form-grid">
      ${selectField('status','Статус',requestStatuses,item.status)}${selectField('owner','Ответственный',owners,item.owner)}</div>
      ${controls('Сохранить',button('Закрыть заявку','finish-request',{id:item.id,style:'danger'}))}</form>
    <section class="notes"><h3>Комментарии и заметки</h3>
    ${item.notes.map(note=>`<div class="note"><b>${note.kind}</b><p>${escapeHtml(note.text)}</p></div>`).join('') || '<p>Записей пока нет.</p>'}
    <form data-form="add-note" data-id="${item.id}"><label>Запись<textarea name="note" rows="2" maxlength="1200" required></textarea></label>
      <div class="dialog-actions"><button class="button" type="submit" name="kind" value="Заметка">Добавить заметку</button><button class="button primary" type="submit" name="kind" value="Комментарий">Добавить комментарий</button></div></form></section></div>`,'','drawer');
}
function taskDetails(item) {
  openOverlay('Задача TS-'+item.id,`<h3>${escapeHtml(item.title)}</h3>
    <div class="details-meta">${person(item.owner)} ${priorityLabel(item.priority)} <span>Срок ${formatDate(item.due)}</span></div>
    <p class="detail-copy">${escapeHtml(item.description || 'Описание отсутствует.')}</p>
    ${progress(taskProgress(item))}
    <form data-form="save-task" data-id="${item.id}">${selectField('status','Статус',taskStatuses,item.status)}
    ${controls('Сохранить',button('Удалить задачу','delete-task',{id:item.id,style:'danger'})+(item.status==='Готово'?'':button('Выполнить','complete-task',{id:item.id,glyph:'check'})))}</form>`);
}
function documentDetails(item,preview=false) {
  openOverlay(preview?'Просмотр документа':'Сведения о документе',`<h3>${escapeHtml(item.title)}</h3>
    <div class="details-meta"><span>${item.type} · ${item.size}</span> ${person(item.owner)} <span>${formatDate(item.date)}</span></div>
    ${preview?`<article class="document-preview"><small>FRAMEWORK / Демонстрационный документ</small><h3>${escapeHtml(item.title)}</h3>
      <p>Материалы рабочего пространства команды продукта.</p><ol><li>Согласовать состав работ с ответственным.</li><li>Обновить статус и приложить результат к заявке.</li><li>Передать материалы на проверку.</li></ol></article>`:''}
    <form data-form="save-document" data-id="${item.id}">${selectField('status','Статус',documentStatuses,item.status)}
    ${controls('Сохранить',button(preview?'Подробности':'Открыть просмотр',preview?'document':'preview',{id:item.id,glyph:'file'}))}</form>`);
}
function memberDetails(index) {
  const member=members[index];
  const [name,role,dept,,online]=member;
  const assigned=state.tasks.filter(item=>item.owner===name && item.status!=='Готово');
  openOverlay(escapeHtml(name),`<div class="details-meta">${avatar(name)} ${role} · ${dept} · ${online?'Онлайн':'Оффлайн'} <span>Последняя активность: ${memberActivity[index]}</span></div>
    ${loadRows([member])}<h3>Активные задачи</h3>${assigned.length?`<ul class="assigned">${assigned.map(item=>`<li>${itemLink(item.title,'task',item.id)}</li>`).join('')}</ul>`:'<p>Активных задач нет.</p>'}`);
}
function notificationPanel() {
  openOverlay('Уведомления',`<div class="notification-actions">${button('Прочитать всё','read-all',{glyph:'check',extra:state.notifications.some(item=>!item.read)?'':'disabled'})}</div>
    <ul class="notification-list">${state.notifications.map(item=>`<li class="${item.read?'':'unread'}">
      <div class="notification-icon">${icon(item.icon)}</div><div><b>${escapeHtml(item.title)}</b>
      <p>${escapeHtml(item.body)}</p><small>${escapeHtml(item.time)}</small>
      <div class="notification-actions">${item.read?'':button('Прочитать','read',{id:item.id,style:'small-button'})}${button('Удалить','delete-notification',{id:item.id,style:'small-button'})}</div></div>
      </li>`).join('') || '<li>Уведомлений пока нет.</li>'}</ul>`,'notifications','drawer');
}
function addEvent(iconName,title,body) {
  state.notifications.unshift({id:Math.max(0,...state.notifications.map(item=>item.id))+1,icon:iconName,title,body,time:new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit'}).format(new Date()),read:false});
}
function navigate(key) {
  if (!isRoute(key)) return;
  route=key;
  if (overlay.open) overlay.close();
  if (!state.active) return;
  state.route=key;
  save();
  render({animate:true});
  window.scrollTo(0,0);
  $('#content').focus({preventScroll:true});
}
function enter() {
  state.active=true;
  state.route=route;
  if (location.hash!=='#'+route) history.replaceState(null,'','#'+route);
  save();
  render({animate:true});
  $('#content').focus({preventScroll:true});
}
function updated(message,{close=true,animate=false}={}) {
  if (close && overlay.open) overlay.close();
  save();
  render({animate});
  toast(message);
}
function moveTask(item,status) {
  if (!taskStatuses.includes(status) || !item || item.status===status) return;
  item.status=status;
  addEvent(status==='Готово'?'check':'kanban',status==='Готово'?'Задача выполнена':'Статус задачи изменён',item.title+' → '+status);
  updated(status==='Готово'?'Задача выполнена':'Статус задачи обновлён');
  const card=$('[data-task="'+item.id+'"]');
  if (card) {
    card.classList.add('moved');
    $('select',card).focus({preventScroll:true});
  } else {
    $('[data-action="task"][data-id="'+item.id+'"]')?.focus({preventScroll:true});
  }
}
function markRefreshing() {
  const target=$('[data-action="refresh"]');
  if (target) {
    target.disabled=true;
    target.setAttribute('aria-busy','true');
    target.innerHTML=icon('refresh')+'Обновляем…';
  }
}
let refreshTimer;
function refreshData() {
  if (refreshPending) return;
  refreshPending=true;
  markRefreshing();
  refreshTimer=setTimeout(()=>{
    refreshPending=false;
    state.revision++;
    updated('Данные обновлены',{close:false,animate:route==='dashboard'});
    if (route==='dashboard' && !overlay.open) $('[data-action="refresh"]')?.focus({preventScroll:true});
  },600);
}
function reset() {
  clearTimeout(refreshTimer);
  refreshPending=false;
  state=seed();
  state.active=true;
  route='dashboard';
  history.replaceState(null,'','#dashboard');
  updated('Начальные данные восстановлены',{animate:true});
}
const itemById=(key,id)=>state[key].find(item=>item.id===id);
const actions={
  demo:enter, close:()=>overlay.close(), refresh:refreshData,
  'clear-active-requests':()=>{
    state.filters.requests.activeOnly=false;
    updatedView();
    $('[name="query"]')?.focus();
  },
  'new-request':()=>createItem('request'), 'new-task':()=>createItem('task'),
  request:id=>requestDetails(itemById('requests',id)),
  task:id=>taskDetails(itemById('tasks',id)),
  document:id=>documentDetails(itemById('documents',id)),
  preview:id=>documentDetails(itemById('documents',id),true),
  member:memberDetails,
  notifications:notificationPanel,
  menu:()=>openOverlay('Разделы',`<nav class="main-nav" aria-label="Все разделы">${Object.keys(routes).map(key=>navLink(key)).join('')}</nav>`,'menu','menu-dialog'),
  'finish-request':id=>{
    const item=itemById('requests',id);
    item.status='Завершена';
    addEvent('check','Заявка закрыта','FW-'+item.id+' · '+item.service);
    updated('Заявка завершена');
    highlightRow('request',id);
  },
  'complete-task':id=>moveTask(itemById('tasks',id),'Готово'),
  'delete-task':id=>openOverlay('Удалить задачу?',`<p>${escapeHtml(itemById('tasks',id).title)}</p><div class="dialog-actions">${button('Отмена','task',{id})}${button('Удалить','confirm-delete',{id,style:'danger'})}</div>`),
  'confirm-delete':id=>{
    state.tasks=state.tasks.filter(item=>item.id!==id);
    updated('Задача удалена');
  },
  'chart-point':(_,target)=>{
    const pressed=target.getAttribute('aria-pressed')==='true';
    $$('.chart-point',target.closest('.plot')).forEach(point=>point.setAttribute('aria-pressed','false'));
    target.setAttribute('aria-pressed',String(!pressed));
  },
  period:(_,target)=>{
    state.period=target.dataset.value;
    save();
    render();
    $('[data-action="period"][aria-pressed="true"]')?.focus();
  },
  read:id=>{itemById('notifications',id).read=true; refreshNotifications();},
  'read-all':()=>{state.notifications.forEach(item=>{item.read=true;}); refreshNotifications();},
  'delete-notification':id=>{state.notifications=state.notifications.filter(item=>item.id!==id); refreshNotifications();},
  reset:()=>openOverlay('Сбросить демо-данные?',`<p>Заявки, задачи и настройки вернутся к исходному состоянию.</p>
    <div class="dialog-actions">${button('Отмена','close')}${button('Сбросить','confirm-reset',{style:'danger'})}</div>`),
  'confirm-reset':reset,
  logout:()=>{
    state.active=false;
    updated('Вы вышли из демо');
    $('[data-action="demo"]')?.focus();
  }
};
function refreshNotifications() {
  save();
  render();
  notificationPanel();
}
document.addEventListener('click',event=>{
  if (overlayKind==='menu' && event.target.closest('dialog a[href^="#"]')) overlay.close();
  const queue=event.target.closest('[data-queue]')?.dataset.queue;
  if (queue==='overdue') {
    state.filters.tasks={owner:'',status:'Просрочено'};
    save();
  }
  if (queue==='urgent') {
    state.filters.requests={...seed().filters.requests,priority:'Высокий',activeOnly:true};
    save();
  }
  const target=event.target.closest('[data-action]');
  if (!target || target.disabled) return;
  actions[target.dataset.action]?.(Number(target.dataset.id),target);
});
document.addEventListener('submit',event=>{
  const form=event.target;
  const kind=form.dataset.form;
  if (!kind) return;
  event.preventDefault();
  if (kind==='login') {
    enter();
    return;
  }
  const data=Object.fromEntries([...new FormData(form,event.submitter)].map(([key,value])=>[key,value.trim()]));
  const id=Number(form.dataset.id);
  if (kind==='new-request') {
    const item={...data,effort:Number(data.effort)||null,id:state.nextRequest++,status:'Новая',date:localDay(),notes:[]};
    state.requests.unshift(item);
    addEvent('inbox','Новая заявка',item.company+' · '+item.service);
    state.filters.requests=seed().filters.requests;
    overlay.close();
    toast('Заявка FW-'+item.id+' создана');
    save();
    if (route==='requests') render();
    else location.hash='requests';
    return;
  }
  if (kind==='new-task') {
    state.tasks.unshift({...data,id:state.nextTask++,status:taskStatuses[0]});
    state.filters.tasks=seed().filters.tasks;
    updated('Задача создана');
    return;
  }
  if (kind==='save-request') {
    const item=itemById('requests',id);
    if (item.status!==data.status) addEvent('kanban','Статус заявки изменён','FW-'+id+' → '+data.status);
    Object.assign(item,data);
    updated('Заявка сохранена');
    highlightRow('request',id);
    return;
  }
  if (kind==='add-note') {
    if (!data.note) {
      $('textarea',form).focus();
      toast('Введите текст записи');
      return;
    }
    const item=itemById('requests',id);
    item.notes.push({kind:data.kind,text:data.note});
    addEvent('message',data.kind==='Заметка'?'Добавлена заметка':'Новый комментарий','FW-'+id+' · '+data.note.slice(0,65));
    updated('Запись добавлена',{close:false});
    requestDetails(item);
    return;
  }
  if (kind==='save-task') {
    const item=itemById('tasks',id);
    if (item.status===data.status) overlay.close();
    else moveTask(item,data.status);
    return;
  }
  if (kind==='save-document') {
    const item=itemById('documents',id);
    if (item.status!==data.status) addEvent('file','Статус документа изменён',item.title+' → '+data.status);
    item.status=data.status;
    item.date=localDay();
    updated('Документ обновлён');
    $('[data-action="document"][data-id="'+id+'"]')?.closest('article')?.classList.add('status-changed');
  }
});
function highlightRow(action,id) {
  $('[data-action="'+action+'"][data-id="'+id+'"]')?.closest('tr')?.classList.add('status-changed');
}
function updatedView() {
  save();
  render();
}
document.addEventListener('input',event=>{
  const input=event.target;
  if (!input.matches('input[data-filter]')) return;
  state.filters[route][input.name]=input.value;
  save();
  $('#results').innerHTML=route==='requests'?requestResults():documentResults();
});
document.addEventListener('change',event=>{
  const input=event.target;
  if (input.matches('select[data-filter]')) {
    const name=input.name;
    state.filters[route][name]=input.value;
    updatedView();
    $('[data-filter][name="'+name+'"]')?.focus({preventScroll:true});
  }
  if (input.dataset.move) moveTask(itemById('tasks',Number(input.dataset.move)),input.value);
  const setting=input.dataset.setting;
  if (!setting) return;
  state[setting]=setting==='theme' ? (input.checked?'dark':'light') : input.type==='checkbox' ? input.checked : input.value;
  updatedView();
  $('[data-setting="'+setting+'"]')?.focus({preventScroll:true});
});
let draggedId;
document.addEventListener('dragstart',event=>{
  const card=event.target.closest('[data-task]');
  if (!card) return;
  draggedId=Number(card.dataset.task);
  event.dataTransfer.setData('text/plain',String(draggedId));
  event.dataTransfer.effectAllowed='move';
  card.classList.add('dragging');
});
document.addEventListener('dragover',event=>{
  const lane=event.target.closest('[data-lane]');
  if (!lane || !draggedId) return;
  event.preventDefault();
  event.dataTransfer.dropEffect='move';
  $$('.kanban-lane').forEach(item=>item.classList.toggle('drop-target',item===lane));
});
document.addEventListener('dragend',()=>{
  draggedId=undefined;
  $$('.dragging,.drop-target').forEach(el=>el.classList.remove('dragging','drop-target'));
});
document.addEventListener('drop',event=>{
  const lane=event.target.closest('[data-lane]');
  if (!lane || !draggedId) return;
  event.preventDefault();
  const item=itemById('tasks',draggedId);
  draggedId=undefined;
  $$('.dragging,.drop-target').forEach(el=>el.classList.remove('dragging','drop-target'));
  moveTask(item,taskStatuses[Number(lane.dataset.lane)]);
});
window.addEventListener('hashchange',()=>{
  const key=location.hash.slice(1);
  if (!key) navigate('dashboard');
  else if (isRoute(key)) navigate(key);
});
if (state.active && !location.hash) history.replaceState(null,'','#'+route);
render({animate:true});

