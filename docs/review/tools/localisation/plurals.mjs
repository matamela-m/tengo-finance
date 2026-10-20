// What Intl.PluralRules and i18next resolve for each Tengo language.
import i18next from 'i18next';
const codes = ['en','af','nr','xh','zu','nso','st','tn','ss','ve','ts'];
console.log('node', process.version, 'ICU', process.versions.icu, 'CLDR', process.versions.cldr, 'default locale', new Intl.NumberFormat().resolvedOptions().locale);
for (const c of codes) {
  const pr = new Intl.PluralRules(c);
  const o = pr.resolvedOptions();
  const dt = new Intl.DateTimeFormat(c, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 9, 27)));
  const dtLocale = new Intl.DateTimeFormat(c).resolvedOptions().locale;
  const supported = Intl.PluralRules.supportedLocalesOf([c]).join(',') || 'NOT SUPPORTED';
  console.log(`${c}\tplural supported=${supported}\tresolved=${o.locale}\tcategories=${o.pluralCategories.join('/')}\t1=>${pr.select(1)}\t0=>${pr.select(0)}\tdate(${dtLocale})=${dt}`);
}
const res = Object.fromEntries(codes.map((c) => [c, { translation: { d_one: '{{count}} day', d_other: '{{count}} days' } }]));
await i18next.init({ resources: res, lng: 'en', fallbackLng: 'en' });
for (const c of codes) { const t = i18next.getFixedT(c); console.log(`i18next ${c}: count=1 -> "${t('d', { count: 1 })}", count=0 -> "${t('d', { count: 0 })}"`); }
console.log('en-ZA number', new Intl.NumberFormat('en-ZA').format(1250.5), '| en-ZA currency', new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(1250.5));
console.log('af-ZA date', new Intl.DateTimeFormat('af-ZA',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2026,9,27))));
console.log('zu-ZA date', new Intl.DateTimeFormat('zu-ZA',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2026,9,27))));
