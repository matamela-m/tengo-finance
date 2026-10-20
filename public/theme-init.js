// Sets the theme and the chosen language before first paint, so the wrong theme never flashes.
// An external file, not inline, so the Content Security Policy needs no inline script.
// <html lang> stays "en" here; Preferences sets it to the language of the text actually shown.
(function () {
  var root = document.documentElement;
  var theme = 'dark';
  try {
    var s = JSON.parse(localStorage.getItem('tengo.session.v1') || '{}').state || {};
    theme = s.theme || 'dark';
    if (s.language) root.setAttribute('data-ui-language', s.language);
  } catch (e) {}
  if (theme === 'system') theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  root.setAttribute('data-theme', theme);
})();
