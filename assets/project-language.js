window.initProjectLanguage = (catalog, options = {}) => {
  const key = 'devline-language';
  const translations = new Map(catalog.trim().split('\n').map((line) => line.split('|')));
  const original = new WeakMap();
  const attributes = ['alt', 'aria-label', 'title', 'placeholder', 'content'];
  let language;
  let queued = false;
  const control = document.createElement('div');
  control.className = 'devline-language';
  control.setAttribute('role', 'group');
  for (const code of ['ru', 'en']) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = code.toUpperCase();
    button.lang = code;
    button.addEventListener('click', () => {
      try { localStorage.setItem(key, code); } catch { /* Optional storage. */ }
      apply(code);
    });
    control.append(button);
  }
  document.body.prepend(control);

  const months = 'января февраля марта апреля мая июня июля августа сентября октября ноября декабря'.split(' ');
  const convert = (value) => {
    const text = value.trim().replace(/\s+/g, ' ');
    let translated = translations.get(text);
    if (translated === undefined) {
      const numbers = text.match(/\d+/g);
      translated = numbers && translations.get(text.replace(/\d+/g, '#'));
      if (translated) {
        let index = 0;
        translated = translated.replace(/#/g, () => numbers[index++]);
      }
    }
    if (translated == null && / · | → /.test(text)) {
      translated = text.split(/( · | → )/).map(convert).join('');
    }
    if (translated == null) {
      const point = text.match(/^(.+), (\d+%)$/);
      if (point && translations.has(point[1])) translated = `${translations.get(point[1])}, ${point[2]}`;
    }
    if (translated == null) {
      const date = text.match(/^(\d{1,2}) ([а-яё.]+)(?: (\d{4})(?: г\.)?)?$/i);
      const month = date && months.findIndex((name) => name.startsWith(date[2].toLowerCase().replace(/\.$/, '')));
      if (date && month >= 0) {
        const format = { month: date[3] ? 'long' : 'short', day: 'numeric' };
        if (date[3]) format.year = 'numeric';
        translated = new Intl.DateTimeFormat('en-GB', format).format(new Date(Number(date[3] || 2024), month, Number(date[1])));
      }
    }
    if (translated == null) {
      const prefix = ['Срок ', 'Оценка: ', 'Последняя активность: ', 'Переместить задачу '].find((part) => text.startsWith(part));
      if (prefix && translations.has(prefix.trim())) translated = translations.get(prefix.trim()) + ' ' + convert(text.slice(prefix.length));
    }
    return translated == null ? value : value.replace(/\S[\s\S]*\S|\S/, () => translated);
  };

  const update = (node, attribute) => {
    const current = attribute ? node.getAttribute(attribute) : node.data;
    if (!current) return;
    const properties = original.get(node) || {};
    const record = properties[attribute];
    const ru = record && record.last === current ? record.ru : current;
    const last = language === 'en' ? convert(ru) : ru;
    properties[attribute] = { ru, last };
    original.set(node, properties);
    if (current === last) return;
    if (attribute) node.setAttribute(attribute, last);
    else node.data = last;
  };

  const refresh = () => {
    const text = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => node.parentElement.closest('script, style, template, .devline-language')
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    while (text.nextNode()) update(text.currentNode, null);
    for (const attribute of attributes) {
      for (const node of document.querySelectorAll(`[${attribute}]`)) {
        if (!node.closest('.devline-language')) update(node, attribute);
      }
    }
  };
  const observer = new MutationObserver((records) => {
    if (queued || language !== 'en' || !records.some((record) => {
      if (record.type === 'attributes') return /[а-яё]/i.test(record.target.getAttribute(record.attributeName) || '');
      if (record.type === 'characterData') return /[а-яё]/i.test(record.target.data);
      return [...record.addedNodes].some((node) => /[а-яё]/i.test(node.textContent || '') || node.nodeType === 1);
    })) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      refresh();
    });
  });
  const preferred = () => {
    let saved;
    try { saved = localStorage.getItem(key); } catch { /* Optional storage. */ }
    return ['ru', 'en'].includes(saved) ? saved : new URLSearchParams(location.search).get('lang');
  };
  function apply(code) {
    language = code === 'en' ? 'en' : 'ru';
    document.documentElement.lang = language;
    control.setAttribute('aria-label', language === 'en' ? 'Website language' : 'Язык сайта');
    for (const button of control.children) {
      button.setAttribute('aria-pressed', String(button.lang === language));
      button.setAttribute('aria-label', language === 'en'
        ? (button.lang === 'en' ? 'English' : 'Russian')
        : (button.lang === 'en' ? 'Английский' : 'Русский'));
    }
    options.onChange?.(language);
    refresh();
  }
  apply(preferred());
  window.devlineProjectLanguage = {
    source(node) {
      return original.get(node)?.[null]?.ru ?? node?.textContent ?? '';
    },
  };
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });
  window.addEventListener('pageshow', (event) => { if (event.persisted) apply(preferred()); });
  window.addEventListener('storage', (event) => { if (event.key === key) apply(preferred()); });
};
