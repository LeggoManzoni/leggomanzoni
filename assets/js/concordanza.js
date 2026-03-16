/**
 * Concordanza — client-side search and KWIC rendering
 * Lazy-loads the concordance index and provides word/lemma/idiom search.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  let INDEX = null;
  let NORM_LEMMAS = null; // normalised lemma → Set of word forms
  let MODE = 'word'; // 'word' | 'idiom'
  let SEARCH_TYPE = 'lemma'; // 'lemma' | 'exact'
  let CURRENT_RESULTS = [];
  let CURRENT_SORT = 'chapter';
  let CURRENT_PAGE = 0;
  const PAGE_SIZE = 100;

  const CHAPTER_ORDER = [
    'intro', 'cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'cap6', 'cap7',
    'cap8', 'cap9', 'cap10', 'cap11', 'cap12', 'cap13', 'cap14', 'cap15',
    'cap16', 'cap17', 'cap18', 'cap19', 'cap20', 'cap21', 'cap22', 'cap23',
    'cap24', 'cap25', 'cap26', 'cap27', 'cap28', 'cap29', 'cap30', 'cap31',
    'cap32', 'cap33', 'cap34', 'cap35', 'cap36', 'cap37', 'cap38'
  ];

  // Italian stopwords to hide from default word list
  const STOPWORDS = new Set([
    // articles, prepositions, conjunctions
    'di', 'e', 'il', 'la', 'che', 'in', 'a', 'non', 'per', 'un', 'si',
    'del', 'da', 'al', 'lo', 'le', 'dei', 'con', 'più', 'gli',
    'come', 'ma', 'su', 'se', 'ci', 'ne', 'una', 'mi', 'ha', 'io',
    'o', 'poi', 'li', 'no', 'vi', 'tra', 'col', 'fra', 'me',
    'dove', 'dopo', 'quando', 'chi', 'lui', 'lei', 'loro',
    'ben', 'senza', 'già', 'ancora', 'qui', 'nel', 'alla',
    'dello', 'della', 'delle', 'degli', 'nelle', 'nella', 'ai', 'allo',
    'alle', 'sul', 'sulla', 'sulle', 'sugli', 'dai', 'dalla', 'dallo',
    'dalle', 'i',
    // pronouns, demonstratives, possessives
    'questo', 'quello', 'questa', 'quella', 'questi', 'quelli',
    'suo', 'sua', 'suoi', 'sue', 'mio', 'mia', 'tuo', 'tua',
    'nostro', 'vostro', 'noi', 'voi',
    // common verbs / auxiliaries (as lemmas or surface forms)
    'essere', 'avere', 'fare', 'era', 'fu', 'sono', 'è', 'aveva',
    'ero', 'erare', 'stato', 'stata', 'ho', 'eran', 'fosse',
    // single-letter artifacts from apostrophe normalisation
    'l', 'c', 'd', 's', 'n', 'v',
    // Stanza artifacts and verb forms already under a lemma
    'nnon', 'allare', 'allo', 'altrio', 'andò', 'ancare',
    // More function words / preposition forms
    'coi', 'nello', 'quel', 'ale', 'co', 'de', 'dal', 'dall',
    'é', 'sì', 'dalli', 'dagli', 'avevo', 'disse', 'fatto', 'oro',
    // Stanza misattributions (inflated by wrong form grouping)
    'manina',
    // quantifiers, adverbs
    'altro', 'altra', 'altri', 'altre', 'molto', 'molta', 'poco',
    'tutto', 'tutta', 'tutti', 'tutte', 'tanto', 'quanto',
    'uno', 'due', 'tre', 'primo', 'ogni', 'stesso', 'stessa',
    'così', 'ora', 'mai', 'proprio', 'pure', 'quasi', 'nulla',
    'anche', 'cui', 'quale', 'quali'
  ]);

  // ---------------------------------------------------------------------------
  // Normalise — must match Python normalise() exactly
  // ---------------------------------------------------------------------------
  function normalise(surface) {
    let s = surface.toLowerCase();
    s = s.replace(/^[\u00ab\u00bb\u2014\u2013\u2019\u2018"',.;:!?()\[\]{}*]+/, '');
    s = s.replace(/[\u00ab\u00bb\u2014\u2013\u2019\u2018"',.;:!?()\[\]{}*]+$/, '');
    s = s.replace(/\u2019/g, "'").replace(/\u2018/g, "'");
    if (s.includes("'")) {
      var parts = s.split("'");
      var right = parts[parts.length - 1].trim();
      var left = parts[0].trim();
      var candidate = right.length >= 2 ? right : left;
      return candidate.length >= 1 ? candidate : null;
    }
    return s.length >= 1 ? s : null;
  }

  // ---------------------------------------------------------------------------
  // Chapter formatting
  // ---------------------------------------------------------------------------
  function formatChapter(ch) {
    if (ch === 'intro') return 'Intr.';
    return ch.replace('cap', 'Cap. ');
  }

  function chapterIndex(ch) {
    var idx = CHAPTER_ORDER.indexOf(ch);
    return idx >= 0 ? idx : 999;
  }

  // Map chapter name to reader URL parameter
  function chapterToReaderParam(ch) {
    if (ch === 'intro') return 'intro';
    return ch; // cap1, cap2, etc. — matches /get-chapter/:chapterName
  }

  // ---------------------------------------------------------------------------
  // Load index
  // ---------------------------------------------------------------------------
  async function loadIndex() {
    if (INDEX) return;
    var res = await fetch('/concordanza/data');
    INDEX = await res.json();
    // Build normalised lemma map — merges raw lemma keys by normalised form
    // Reject lemma keys with internal punctuation (Stanza artifacts)
    var cleanLemmaRe = /^[a-zà-öø-ÿ']+$/;
    NORM_LEMMAS = {};
    var rawKeys = Object.keys(INDEX.lemmas);
    for (var i = 0; i < rawKeys.length; i++) {
      var norm = normalise(rawKeys[i]);
      if (!norm || !cleanLemmaRe.test(norm)) continue;
      var forms = INDEX.lemmas[rawKeys[i]];
      if (!NORM_LEMMAS[norm]) NORM_LEMMAS[norm] = {};
      for (var j = 0; j < forms.length; j++) {
        NORM_LEMMAS[norm][forms[j]] = true;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Word search
  // ---------------------------------------------------------------------------
  function searchExact(query) {
    var key = normalise(query);
    if (!key) return [];
    return INDEX.words[key] || [];
  }

  function searchLemma(query) {
    var key = normalise(query);
    if (!key) return [];

    // Try normalised lemma map first
    var formSet = NORM_LEMMAS[key];
    if (formSet) {
      var results = [];
      var formKeys = Object.keys(formSet);
      for (var i = 0; i < formKeys.length; i++) {
        var entries = INDEX.words[formKeys[i]];
        if (entries) results = results.concat(entries);
      }
      if (results.length > 0) return results;
    }

    // Fallback: user typed an inflected form — find its lemma via a sample entry
    var directHits = INDEX.words[key] || [];
    if (directHits.length > 0 && directHits[0].lemma) {
      var lemma = normalise(directHits[0].lemma);
      if (lemma && NORM_LEMMAS[lemma]) {
        var results = [];
        var formKeys = Object.keys(NORM_LEMMAS[lemma]);
        for (var i = 0; i < formKeys.length; i++) {
          var entries = INDEX.words[formKeys[i]];
          if (entries) results = results.concat(entries);
        }
        if (results.length > 0) return results;
      }
    }

    return directHits;
  }

  function getLemmaForms(query) {
    var key = normalise(query);
    if (!key) return null;

    var formSet = NORM_LEMMAS[key];
    if (formSet) return { lemma: key, forms: Object.keys(formSet).sort() };

    var directHits = INDEX.words[key] || [];
    if (directHits.length > 0 && directHits[0].lemma) {
      var lemma = normalise(directHits[0].lemma);
      if (lemma && NORM_LEMMAS[lemma]) {
        return { lemma: lemma, forms: Object.keys(NORM_LEMMAS[lemma]).sort() };
      }
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Idiom search
  // ---------------------------------------------------------------------------
  function getIdiomList() {
    var list = [];
    var keys = Object.keys(INDEX.idioms);
    for (var i = 0; i < keys.length; i++) {
      var obj = INDEX.idioms[keys[i]];
      list.push({
        id: keys[i],
        label: obj.label,
        tipologia: obj.tipologia,
        parola_chiave: obj.parola_chiave,
        count: obj.occurrences.length
      });
    }
    return list;
  }

  function searchIdiom(idiomId) {
    return INDEX.idioms[idiomId] || null;
  }

  // ---------------------------------------------------------------------------
  // Sorting
  // ---------------------------------------------------------------------------
  function sortResults(results, mode) {
    var sorted = results.slice();
    if (mode === 'chapter') {
      sorted.sort(function (a, b) {
        var ca = chapterIndex(a.chapter);
        var cb = chapterIndex(b.chapter);
        return ca !== cb ? ca - cb : 0;
      });
    } else if (mode === 'left') {
      sorted.sort(function (a, b) {
        var la = (a.left || []).join(' ').toLowerCase();
        var lb = (b.left || []).join(' ').toLowerCase();
        return la.localeCompare(lb, 'it');
      });
    } else if (mode === 'right') {
      sorted.sort(function (a, b) {
        var ra = (a.right || []).join(' ').toLowerCase();
        var rb = (b.right || []).join(' ').toLowerCase();
        return ra.localeCompare(rb, 'it');
      });
    }
    return sorted;
  }

  // ---------------------------------------------------------------------------
  // KWIC rendering
  // ---------------------------------------------------------------------------
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderKwicTable(results, isIdiom) {
    if (results.length === 0) {
      return '<div class="conc-empty">Nessun risultato trovato</div>';
    }

    var start = CURRENT_PAGE * PAGE_SIZE;
    var page = results.slice(start, start + PAGE_SIZE);

    var html = '<table class="kwic-table"><tbody>';
    for (var i = 0; i < page.length; i++) {
      var hit = page[i];
      var ch = formatChapter(hit.chapter);
      var left = escapeHtml((hit.left || []).join(' '));
      var kw = isIdiom
        ? escapeHtml((hit.span_surface || []).join(' '))
        : escapeHtml(hit.surface);
      var right = escapeHtml((hit.right || []).join(' '));

      var dataId = hit.id ? hit.id.replace(/\D/g, '') : '';
      var readerParam = chapterToReaderParam(hit.chapter);
      var href = './confronta?cap=' + readerParam + '&word=' + (hit.id || hit.start_id || '');

      var kwClass = isIdiom ? 'kwic-kw idiom' : 'kwic-kw';
      var registerNote = hit.register === 'seicento'
        ? ' <span class="conc-register-note" title="Testo del manoscritto seicentesco">[600]</span>'
        : '';

      html += '<tr class="kwic-row">'
        + '<td class="kwic-ch">' + ch + '</td>'
        + '<td class="kwic-left">' + left + '</td>'
        + '<td class="' + kwClass + '">' + kw + registerNote + '</td>'
        + '<td class="kwic-right">' + right + '</td>'
        + '<td class="kwic-link"><a href="' + href + '" title="Vai al testo">\u2197</a></td>'
        + '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  function renderPagination(total) {
    var pages = Math.ceil(total / PAGE_SIZE);
    if (pages <= 1) {
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    var html = '';
    html += '<button ' + (CURRENT_PAGE === 0 ? 'disabled' : '') + ' data-page="' + (CURRENT_PAGE - 1) + '">&laquo;</button>';

    var startPage = Math.max(0, CURRENT_PAGE - 3);
    var endPage = Math.min(pages - 1, CURRENT_PAGE + 3);

    for (var p = startPage; p <= endPage; p++) {
      html += '<button class="' + (p === CURRENT_PAGE ? 'active' : '') + '" data-page="' + p + '">' + (p + 1) + '</button>';
    }

    html += '<button ' + (CURRENT_PAGE >= pages - 1 ? 'disabled' : '') + ' data-page="' + (CURRENT_PAGE + 1) + '">&raquo;</button>';

    var el = document.getElementById('pagination');
    el.innerHTML = html;
    el.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!btn.disabled) {
          CURRENT_PAGE = parseInt(btn.dataset.page);
          displayResults();
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Display results
  // ---------------------------------------------------------------------------
  function displayResults() {
    var sorted = sortResults(CURRENT_RESULTS, CURRENT_SORT);
    var isIdiom = MODE === 'idiom';
    document.getElementById('results-body').innerHTML = renderKwicTable(sorted, isIdiom);
    document.getElementById('result-count').textContent =
      CURRENT_RESULTS.length + ' occorrenz' + (CURRENT_RESULTS.length === 1 ? 'a' : 'e');
    renderPagination(sorted.length);
  }

  // ---------------------------------------------------------------------------
  // Word search execution
  // ---------------------------------------------------------------------------
  function executeWordSearch(query) {
    if (!query || !query.trim()) return;

    var results;
    if (SEARCH_TYPE === 'lemma') {
      results = searchLemma(query);
      var info = getLemmaForms(query);
      var lemmaEl = document.getElementById('lemma-info');
      if (info && info.forms.length > 1) {
        var formsHtml = 'Lemma <strong>' + escapeHtml(info.lemma) + '</strong> — forme trovate: ';
        for (var i = 0; i < info.forms.length; i++) {
          formsHtml += ' <span data-form="' + escapeHtml(info.forms[i]) + '">'
            + escapeHtml(info.forms[i]) + '</span>';
        }
        lemmaEl.innerHTML = formsHtml;
        lemmaEl.style.display = 'block';
        // Click on a form to search exact
        lemmaEl.querySelectorAll('span[data-form]').forEach(function (sp) {
          sp.addEventListener('click', function () {
            document.getElementById('search-input').value = sp.dataset.form;
            document.getElementById('mode-exact-check').checked = true;
            SEARCH_TYPE = 'exact';
            executeWordSearch(sp.dataset.form);
          });
        });
      } else {
        lemmaEl.style.display = 'none';
      }
    } else {
      results = searchExact(query);
      document.getElementById('lemma-info').style.display = 'none';
    }

    CURRENT_RESULTS = results;
    CURRENT_PAGE = 0;
    displayResults();
    updateUrl({ q: query, mode: 'word' });
  }

  // ---------------------------------------------------------------------------
  // Idiom display
  // ---------------------------------------------------------------------------
  function executeIdiomSearch(idiomId) {
    var idiom = searchIdiom(idiomId);
    if (!idiom) return;

    CURRENT_RESULTS = idiom.occurrences;
    CURRENT_PAGE = 0;
    document.getElementById('lemma-info').style.display = 'none';
    displayResults();
    updateUrl({ mode: 'idiom', id: idiomId });
  }

  function executeIdiomWordSearch(query) {
    if (!query || !query.trim()) return;
    var ft = query.toLowerCase().trim();
    var keys = Object.keys(INDEX.idioms);
    var results = [];

    for (var i = 0; i < keys.length; i++) {
      var idiom = INDEX.idioms[keys[i]];
      var pk = (idiom.parola_chiave || '').toLowerCase();
      var words = idiom.label.toLowerCase().split(/\s+/);
      var match = pk.includes(ft);
      if (!match) {
        for (var w = 0; w < words.length; w++) {
          if (words[w].includes(ft)) { match = true; break; }
        }
      }
      if (match) {
        results = results.concat(idiom.occurrences);
      }
    }

    CURRENT_RESULTS = results;
    CURRENT_PAGE = 0;
    document.getElementById('lemma-info').style.display = 'none';
    displayResults();
    updateUrl({ mode: 'idiom', q: query });
  }

  // ---------------------------------------------------------------------------
  // Sidebar
  // ---------------------------------------------------------------------------
  function buildWordSidebar() {
    // Use the prebuilt NORM_LEMMAS map for consistent counts.
    // Only show lemmas that exist as actual words in the text
    // (filters out Stanza garbage like "doverare", "cobere", etc.)
    // Also skip forms that are already grouped under a larger lemma.

    // Build reverse map: form → set of lemma keys that contain it
    var formOwners = {};
    var normKeys = Object.keys(NORM_LEMMAS);
    for (var i = 0; i < normKeys.length; i++) {
      var formKeys = Object.keys(NORM_LEMMAS[normKeys[i]]);
      for (var j = 0; j < formKeys.length; j++) {
        if (!formOwners[formKeys[j]]) formOwners[formKeys[j]] = [];
        formOwners[formKeys[j]].push(normKeys[i]);
      }
    }

    var lemmaFreq = [];
    for (var i = 0; i < normKeys.length; i++) {
      var lemma = normKeys[i];
      if (!INDEX.words[lemma]) continue; // lemma must be a real word in the text
      var formKeys = Object.keys(NORM_LEMMAS[lemma]);
      var total = 0;
      for (var j = 0; j < formKeys.length; j++) {
        var entries = INDEX.words[formKeys[j]];
        if (entries) total += entries.length;
      }

      // Skip if this lemma is a form under another lemma with more occurrences
      var dominated = false;
      var owners = formOwners[lemma];
      if (owners) {
        for (var k = 0; k < owners.length; k++) {
          if (owners[k] === lemma) continue;
          // Check if the other lemma has more forms (is a bigger group)
          var otherForms = Object.keys(NORM_LEMMAS[owners[k]]);
          if (otherForms.length > 1) {
            dominated = true;
            break;
          }
        }
      }
      if (dominated) continue;

      lemmaFreq.push({ lemma: lemma, count: total });
    }

    // Sort by frequency desc
    lemmaFreq.sort(function (a, b) { return b.count - a.count; });

    // Filter stopwords and take top 200
    var filtered = [];
    for (var i = 0; i < lemmaFreq.length && filtered.length < 200; i++) {
      if (!STOPWORDS.has(lemmaFreq[i].lemma)) {
        filtered.push(lemmaFreq[i]);
      }
    }

    // Sort alphabetically for display
    filtered.sort(function (a, b) { return a.lemma.localeCompare(b.lemma, 'it'); });

    var html = '<div style="font-weight:600;margin-bottom:8px;">Lemmi frequenti</div>';
    var currentLetter = '';
    for (var i = 0; i < filtered.length; i++) {
      var item = filtered[i];
      var letter = item.lemma.charAt(0).toUpperCase();
      if (letter !== currentLetter) {
        currentLetter = letter;
        html += '<div class="word-list-letter">' + letter + '</div>';
      }
      html += '<div class="word-list-item" data-word="' + escapeHtml(item.lemma) + '">'
        + '<span>' + escapeHtml(item.lemma) + '</span>'
        + '<span class="count">' + item.count + '</span>'
        + '</div>';
    }

    var el = document.getElementById('sidebar-content');
    el.innerHTML = html;
    el.querySelectorAll('.word-list-item').forEach(function (item) {
      item.addEventListener('click', function () {
        document.getElementById('search-input').value = item.dataset.word;
        executeWordSearch(item.dataset.word);
      });
    });
  }

  function buildIdiomSidebar(filterText, filterTipo) {
    var idioms = getIdiomList();

    // Filter by tipologia
    if (filterTipo) {
      idioms = idioms.filter(function (id) { return id.tipologia === filterTipo; });
    }

    // Filter by search text — match any word in the idiom phrase or parola_chiave
    if (filterText) {
      var ft = filterText.toLowerCase().trim();
      idioms = idioms.filter(function (id) {
        // Match parola_chiave
        if (id.parola_chiave && id.parola_chiave.toLowerCase().includes(ft)) return true;
        // Match any word in the label
        var words = id.label.toLowerCase().split(/\s+/);
        for (var w = 0; w < words.length; w++) {
          if (words[w].includes(ft)) return true;
        }
        return false;
      });
    }

    // Group by parola_chiave — sidebar shows only keywords
    var groups = {};
    for (var i = 0; i < idioms.length; i++) {
      var pk = idioms[i].parola_chiave || '—';
      if (!groups[pk]) groups[pk] = 0;
      groups[pk]++;
    }

    // Sort by count desc, then alphabetically
    var groupKeys = Object.keys(groups).sort(function (a, b) {
      var diff = groups[b] - groups[a];
      return diff !== 0 ? diff : a.localeCompare(b, 'it');
    });

    var totalCount = idioms.length;
    var html = '<div style="font-weight:600;margin-bottom:8px;">Parole chiave (' + groupKeys.length + ')</div>';

    for (var g = 0; g < groupKeys.length; g++) {
      var pk = groupKeys[g];
      html += '<div class="word-list-item" data-keyword="' + escapeHtml(pk) + '">'
        + '<span>' + escapeHtml(pk) + '</span>'
        + '<span class="count">' + groups[pk] + '</span>'
        + '</div>';
    }

    var el = document.getElementById('sidebar-content');
    el.innerHTML = html;
    el.querySelectorAll('.word-list-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var kw = item.dataset.keyword;
        document.getElementById('idiom-search-input').value = kw;
        executeIdiomWordSearch(kw);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // URL state
  // ---------------------------------------------------------------------------
  function updateUrl(params) {
    var url = new URL(window.location);
    url.search = '';
    Object.keys(params).forEach(function (k) {
      if (params[k]) url.searchParams.set(k, params[k]);
    });
    history.replaceState(null, '', url);
  }

  function readUrlParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      q: params.get('q'),
      mode: params.get('mode') || 'word',
      id: params.get('id')
    };
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', async function () {
    try {
      await loadIndex();
    } catch (e) {
      document.getElementById('conc-loading').innerHTML =
        '<span style="color:#c0392b;">Errore nel caricamento dell\'indice.</span>';
      return;
    }

    document.getElementById('conc-loading').style.display = 'none';
    document.getElementById('conc-app').style.display = 'block';

    // Tab switching
    document.querySelectorAll('.conc-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.conc-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        MODE = tab.dataset.mode;

        document.getElementById('word-search-panel').style.display = MODE === 'word' ? 'block' : 'none';
        document.getElementById('idiom-search-panel').style.display = MODE === 'idiom' ? 'block' : 'none';
        document.getElementById('exact-toggle-wrapper').style.display = MODE === 'word' ? 'flex' : 'none';

        if (MODE === 'word') {
          buildWordSidebar();
          // Default: show "anima" as demo
          document.getElementById('search-input').value = 'anima';
          executeWordSearch('anima');
          return;
        } else {
          populateTipologiaFilter();
          buildIdiomSidebar('', '');
          // Default: show "sangue" idioms as demo
          document.getElementById('idiom-search-input').value = 'sangue';
          executeIdiomWordSearch('sangue');
          return;
        }

        CURRENT_RESULTS = [];
        CURRENT_PAGE = 0;
        document.getElementById('results-body').innerHTML =
          '<div class="conc-empty">Inserisci una parola per iniziare la ricerca</div>';
        document.getElementById('result-count').textContent = '';
        document.getElementById('pagination').innerHTML = '';
        document.getElementById('lemma-info').style.display = 'none';
      });
    });

    // Search mode toggle (checkbox: unchecked = lemma, checked = exact)
    document.getElementById('mode-exact-check').addEventListener('change', function () {
      SEARCH_TYPE = this.checked ? 'exact' : 'lemma';
      var query = document.getElementById('search-input').value;
      if (query) executeWordSearch(query);
    });

    // Search button & enter key
    document.getElementById('search-btn').addEventListener('click', function () {
      executeWordSearch(document.getElementById('search-input').value);
    });
    document.getElementById('search-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') executeWordSearch(this.value);
    });

    // Sort controls
    document.querySelectorAll('.conc-sort-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.conc-sort-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        CURRENT_SORT = btn.dataset.sort;
        CURRENT_PAGE = 0;
        displayResults();
      });
    });

    // Idiom filters — update sidebar on input, search on button/Enter
    document.getElementById('idiom-search-input').addEventListener('input', function () {
      var tipo = document.getElementById('idiom-tipo-filter').value;
      buildIdiomSidebar(this.value, tipo);
    });
    document.getElementById('idiom-search-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') executeIdiomWordSearch(this.value);
    });
    document.getElementById('idiom-search-btn').addEventListener('click', function () {
      executeIdiomWordSearch(document.getElementById('idiom-search-input').value);
    });
    document.getElementById('idiom-tipo-filter').addEventListener('change', function () {
      var text = document.getElementById('idiom-search-input').value;
      buildIdiomSidebar(text, this.value);
    });

    // Build initial sidebar
    buildWordSidebar();

    // Handle URL parameters or show default search
    var params = readUrlParams();
    if (params.mode === 'idiom' && params.id) {
      document.querySelector('.conc-tab[data-mode="idiom"]').click();
      executeIdiomSearch(params.id);
    } else if (params.q) {
      document.getElementById('search-input').value = params.q;
      executeWordSearch(params.q);
    } else {
      // Default: show "anima" as demo
      document.getElementById('search-input').value = 'anima';
      executeWordSearch('anima');
    }
  });

  function populateTipologiaFilter() {
    var tipos = {};
    var keys = Object.keys(INDEX.idioms);
    for (var i = 0; i < keys.length; i++) {
      var t = INDEX.idioms[keys[i]].tipologia;
      if (t) tipos[t] = (tipos[t] || 0) + 1;
    }
    var select = document.getElementById('idiom-tipo-filter');
    select.innerHTML = '<option value="">Tutte le tipologie</option>';
    Object.keys(tipos).sort().forEach(function (t) {
      select.innerHTML += '<option value="' + t + '">' + t + ' (' + tipos[t] + ')</option>';
    });
  }

})();
