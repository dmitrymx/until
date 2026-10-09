import type { Lang, Parts, Unit } from './types.ts'

const copy = {
  ru: {
    tagline: 'До любого момента',
    language: 'Язык',
    theme: 'Тема',
    light: 'Светлая',
    dark: 'Тёмная',
    newWish: 'Новое ожидание',
    devices: 'Другое устройство',
    storage: 'Регистрация не нужна. Список живёт в этом браузере. Скачайте копию и откройте файл на телефоне или другом компьютере — ожидания и картинки перенесутся.',
    export: 'Скачать копию',
    import: 'Открыть копию',
    exported: 'Файл копии сохранён',
    imported: 'Копия добавлена',
    importEmpty: 'В файле не нашлось ожиданий',
    importFail: 'Этот файл не похож на копию Until',
    emptyTitle: 'Чего вы ждёте?',
    emptyText: 'Релиз, поездка, премьера, день рождения. Одна плитка, свой кадр и живой отсчёт — месяцы, дни, часы, минуты, секунды.',
    exampleGta: 'GTA VI · 19 ноября 2026',
    exampleYear: 'Новый год · 1 января 2027',
    gtaTitle: 'GTA VI',
    gtaNote: 'Выход Grand Theft Auto VI',
    yearTitle: 'Новый год',
    yearNote: 'Первая минута 2027',
    title: 'Название',
    titlePh: 'Премьера, поездка, день рождения',
    when: 'Дата и время',
    note: 'Заметка',
    notePh: 'Коротко, зачем этот отсчёт',
    picture: 'Картинка',
    pictureHint: 'Любой кадр. Он сожмётся на устройстве, чтобы страница оставалась лёгкой.',
    drop: 'Перетащите изображение или выберите файл',
    compressing: 'Сжимаю изображение…',
    removeImage: 'Убрать картинку',
    imageUrl: 'Ссылка на картинку',
    imageUrlHint: 'Необязательно. Адрес приедет вместе с общей ссылкой. Загруженный файл остаётся только на этом устройстве.',
    accent: 'Цвет цифр',
    save: 'Сохранить',
    cancel: 'Отмена',
    close: 'Закрыть',
    required: 'Добавьте название и дату',
    badDate: 'Не получилось прочитать дату',
    badImage: 'Нужен файл изображения до 25 МБ',
    badUrl: 'Ссылка должна начинаться с http:// или https://',
    back: 'Все ожидания',
    edit: 'Изменить',
    share: 'Скопировать ссылку',
    copied: 'Ссылка скопирована',
    copiedLocal: 'Ссылка скопирована. В ней название и дата — загруженная картинка остаётся на этом устройстве.',
    delete: 'Удалить',
    confirmDelete: 'Удалить это ожидание?',
    yesDelete: 'Да, удалить',
    arrived: 'Уже наступило',
    arrivedSoft: 'Этот момент уже здесь',
    saveMine: 'Оставить у себя',
    savedMine: 'Ожидание добавлено к вашим',
    sharedHint: 'Эту страницу можно открыть по ссылке без аккаунта. Сохраните ожидание — и плитка появится в вашем списке.',
    badShare: 'Ссылка повреждена или слишком длинная.',
    missing: 'Такого ожидания здесь нет.',
    storageFail: 'Браузер не дал сохранить данные на этом устройстве.',
    madeBy: 'Сделано',
    skip: 'К содержанию',
    openWish: 'Открыть отсчёт',
    convert: 'Во сколько',
    convertTitle: 'Во сколько у меня',
    convertLead: 'Для любой игры или события. Время часто пишут по США и в 12-часовом формате — здесь оно становится самарским или московским.',
    sourceZone: 'Откуда время',
    clock: 'Как написано',
    h12: '12 часов',
    h24: '24 часа',
    date: 'Дата',
    hour: 'Час',
    minute: 'Мин',
    home: 'Моё время',
    addCountdown: 'Поставить отсчёт',
    sameDay: 'тот же день',
    nextDay: 'уже следующий день',
    prevDay: 'ещё предыдущий день',
    badConvert: 'Проверь дату и час',
    convertEmpty: 'Впиши дату — посчитаю для любой игры или события.',
    eventTitle: 'Событие',
    titleEventPh: 'Любая игра или событие',
    exampleMw4: 'Пример: MW4, 9:00 PM PT',
    mw4Title: 'Call of Duty: MW4',
    mw4Wish: 'Полный выход, 9:00 PM PT',
    mw4Note: 'Полный выход. В магазине PlayStation в США указано 23 октября 2026, 04:00 UTC — это 9:00 вечера по тихоокеанскому времени 22 октября. Ранний доступ к кампании начинается 16 октября по тихоокеанскому времени, точный час Activision не опубликовала.',
  },
  en: {
    tagline: 'Until the moment you are waiting for',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    newWish: 'New countdown',
    devices: 'Another device',
    storage: 'No account. The list lives in this browser. Download a backup and open the file on a phone or another computer — countdowns and pictures come with it.',
    export: 'Download backup',
    import: 'Open backup',
    exported: 'Backup file saved',
    imported: 'Backup added',
    importEmpty: 'No countdowns found in that file',
    importFail: 'This file is not an Until backup',
    emptyTitle: 'What are you waiting for?',
    emptyText: 'A release, a trip, a premiere, a birthday. One tile, your picture, and a living countdown — months, days, hours, minutes, seconds.',
    exampleGta: 'GTA VI · 19 Nov 2026',
    exampleYear: 'New Year · 1 Jan 2027',
    gtaTitle: 'GTA VI',
    gtaNote: 'Grand Theft Auto VI release',
    yearTitle: 'New Year',
    yearNote: 'The first minute of 2027',
    title: 'Title',
    titlePh: 'A premiere, a trip, a birthday',
    when: 'Date and time',
    note: 'Note',
    notePh: 'Why this countdown matters',
    picture: 'Picture',
    pictureHint: 'Any image. It is compressed on your device so the page stays light.',
    drop: 'Drop an image or choose a file',
    compressing: 'Compressing image…',
    removeImage: 'Remove picture',
    imageUrl: 'Image link',
    imageUrlHint: 'Optional. The address travels with the share link. An uploaded file stays on this device.',
    accent: 'Number color',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    required: 'Add a title and a date',
    badDate: 'That date could not be read',
    badImage: 'Use an image file under 25 MB',
    badUrl: 'The link should start with http:// or https://',
    back: 'All countdowns',
    edit: 'Edit',
    share: 'Copy link',
    copied: 'Link copied',
    copiedLocal: 'Link copied. It carries the title and date — the uploaded picture stays on this device.',
    delete: 'Delete',
    confirmDelete: 'Delete this countdown?',
    yesDelete: 'Yes, delete',
    arrived: "It's here",
    arrivedSoft: 'This moment has arrived',
    saveMine: 'Save to my list',
    savedMine: 'Saved to your list',
    sharedHint: 'Anyone with the link can open this page. No account. Save it and the tile joins your list.',
    badShare: 'This link is damaged or too long.',
    missing: 'That countdown is not on this device.',
    storageFail: 'This browser blocked saving data on this device.',
    madeBy: 'Made by',
    skip: 'Skip to content',
    openWish: 'Open countdown',
    convert: 'My time',
    convertTitle: 'What time for me',
    convertLead: 'For any game or event. Times are often written for the US in 12-hour clock — this turns them into Samara or Moscow time.',
    sourceZone: 'Time is from',
    clock: 'Written as',
    h12: '12-hour',
    h24: '24-hour',
    date: 'Date',
    hour: 'Hour',
    minute: 'Min',
    home: 'My time',
    addCountdown: 'Make a countdown',
    sameDay: 'same day',
    nextDay: 'already the next day',
    prevDay: 'still the day before',
    badConvert: 'Check the date and hour',
    convertEmpty: 'Enter a date — this works for any game or event.',
    eventTitle: 'Event',
    titleEventPh: 'Any game or event',
    exampleMw4: 'Example: MW4, 9:00 PM PT',
    mw4Title: 'Call of Duty: MW4',
    mw4Wish: 'Full launch, 9:00 PM PT',
    mw4Note: 'Full launch. The US PlayStation Store lists 23 October 2026, 04:00 UTC — 9:00 PM Pacific on 22 October. Campaign early access starts 16 October Pacific Time; Activision has not published the exact hour.',
  },
} as const

export type CopyKey = keyof typeof copy.ru

export function t(lang: Lang, key: CopyKey): string {
  return copy[lang][key]
}

function pluralRu(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return many
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}

export function unitWord(lang: Lang, unit: Unit, n: number, short: boolean): string {
  if (lang === 'en') {
    if (short) return { months: 'mo', days: 'd', hours: 'hr', minutes: 'min', seconds: 'sec' }[unit]
    if (n === 1) return { months: 'month', days: 'day', hours: 'hour', minutes: 'minute', seconds: 'second' }[unit]
    return { months: 'months', days: 'days', hours: 'hours', minutes: 'minutes', seconds: 'seconds' }[unit]
  }
  if (short) return { months: 'мес', days: 'дн', hours: 'ч', minutes: 'мин', seconds: 'сек' }[unit]
  const forms = {
    months: ['месяц', 'месяца', 'месяцев'],
    days: ['день', 'дня', 'дней'],
    hours: ['час', 'часа', 'часов'],
    minutes: ['минута', 'минуты', 'минут'],
    seconds: ['секунда', 'секунды', 'секунд'],
  } as const
  const [one, few, many] = forms[unit]
  return pluralRu(n, one, few, many)
}

export function countdownLabel(parts: Parts, lang: Lang): string {
  if (parts.done) return t(lang, 'arrived')
  const units: Unit[] = ['months', 'days', 'hours', 'minutes', 'seconds']
  return units.map((unit) => `${parts[unit]} ${unitWord(lang, unit, parts[unit], false)}`).join(', ')
}

export function tabLeft(parts: Parts, lang: Lang): string {
  if (parts.done) return t(lang, 'arrived')
  const bits: string[] = []
  if (parts.months) bits.push(`${parts.months} ${unitWord(lang, 'months', parts.months, true)}`)
  bits.push(`${parts.days} ${unitWord(lang, 'days', parts.days, true)}`)
  if (!parts.months) bits.push(`${parts.hours} ${unitWord(lang, 'hours', parts.hours, true)}`)
  return bits.slice(0, 2).join(' ')
}
