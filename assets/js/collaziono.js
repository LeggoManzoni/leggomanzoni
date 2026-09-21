/**
 * Collaziono — Ventisettana 1827 / Quarantana 1840, synoptic view.
 * Ported from prototipo/collazione.html renderSyn() and select().
 * Vanilla, no bundler, matching assets/js/concordanza.js.
 */
(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------
    var DATA = null;                 // the loaded chapter payload
    var CACHE = {};                  // chapter -> payload
    var CHAPTER = 'cap1';
    var PRESET = 'tutto';            // 'tutto' | 'riscritture'
    var CURRENT = null;              // selected locus id
    var ORDER = [];                  // visible locus ids, in reading order

    var surface = document.getElementById('coll-surface');
    var readout = document.getElementById('coll-readout');
    var counter = document.getElementById('coll-counter');
    var hint = document.getElementById('coll-hint');
    var chapTitle = document.getElementById('coll-chaptitle');
    var chapButton = document.getElementById('toggle-capitoli');

    var CARET = '‸';            // ‸ — the witness lacks this reading

    // -------------------------------------------------------------------------
    // Filtering
    // -------------------------------------------------------------------------

    /**
     * Whether a locus is marked under the active choice.
     * Filtered-out loci still render, as plain text, out of the tab order.
     * Salience 3 means the locus involves five words or more.
     * @param {Object} locus entry from DATA.loci
     * @returns {boolean}
     */
    function visible(locus) {
        if (!locus) return false;
        if (PRESET === 'riscritture') return locus.sal === 3;
        return true;
    }

    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------

    /**
     * Build one witness cell for one row.
     * @param {Array} segments the witness's segment list
     * @param {string} witness 'V27' or 'Q40'
     * @returns {HTMLElement}
     */
    function renderCell(segments, witness) {
        var cell = document.createElement('div');
        cell.className = 'coll-col coll-col-' + witness.toLowerCase();
        cell.setAttribute('data-siglum', witness === 'V27' ? '1827' : '1840');

        var p = document.createElement('p');

        if (!segments.length) {
            var absent = document.createElement('span');
            absent.className = 'coll-absent';
            absent.textContent = '[paragrafo assente da questo testimone]';
            p.appendChild(absent);
            cell.appendChild(p);
            return cell;
        }

        segments.forEach(function (seg) {
            if (seg.t === 's') {
                p.appendChild(document.createTextNode(seg.w + ' '));
                return;
            }

            var locus = DATA.loci[seg.id];

            if (!visible(locus)) {
                // Unmarked: plain text. An absent reading still needs the caret,
                // or the two columns silently disagree about their word count.
                if (seg.w) p.appendChild(document.createTextNode(seg.w + ' '));
                return;
            }

            var span = document.createElement('span');
            span.className = 'coll-rd coll-rd-' + witness.toLowerCase();
            span.setAttribute('data-id', seg.id);
            span.tabIndex = 0;
            span.setAttribute('role', 'button');

            if (seg.w) {
                span.textContent = seg.w;
            } else {
                span.className += ' coll-caret';
                span.textContent = CARET;
                span.setAttribute('aria-label', 'lezione assente da questo testimone');
            }

            p.appendChild(span);
            p.appendChild(document.createTextNode(' '));
        });

        cell.appendChild(p);
        return cell;
    }

    /** Render the whole chapter into #coll-surface. */
    function render() {
        var grid = document.createElement('div');
        grid.className = 'coll-syn';

        ORDER = [];
        var seen = {};

        DATA.rows.forEach(function (row, i) {
            grid.appendChild(renderCell(row.V27, 'V27'));
            grid.appendChild(renderCell(row.Q40, 'Q40'));

            if (i < DATA.rows.length - 1) {
                var rule = document.createElement('div');
                rule.className = 'coll-row-rule';
                grid.appendChild(rule);
            }

            // Reading order for the arrow keys, de-duplicated: each locus is in
            // the DOM twice, once per column.
            row.V27.concat(row.Q40).forEach(function (seg) {
                if (seg.t === 's' || seen[seg.id]) return;
                if (!visible(DATA.loci[seg.id])) return;
                seen[seg.id] = true;
                ORDER.push(seg.id);
            });
        });

        surface.innerHTML = '';
        surface.appendChild(grid);

        updateCounter();
        if (CURRENT && seen[CURRENT]) highlight(CURRENT);
    }

    /**
     * Pin the column headers directly under the rail. The rail is a line taller
     * in the filtered mode, so this cannot be a constant in the stylesheet.
     */
    function updateStickyOffsets() {
        var rail = document.querySelector('.coll-rail');
        var page = document.querySelector('.coll-page');
        if (!rail || !page) return;
        var offset = parseFloat(getComputedStyle(rail).top) || 0;
        page.style.setProperty('--coll-head-top',
            Math.round(offset + rail.getBoundingClientRect().height) + 'px');
    }

    /** Update the "n loci visibili su N" readout and the explanatory line. */
    function updateCounter() {
        var total = Object.keys(DATA.loci).length;
        counter.innerHTML = '<b>' + ORDER.length + '</b> loci visibili su <b>' + total + '</b>';

        // Only the filtered mode needs explaining: it hides ~97% of the marks.
        // What the default shows is said in the Mostra buttons' tooltips.
        if (PRESET === 'riscritture') {
            hint.textContent = 'Riscrittura = un locus che coinvolge cinque parole o più: ' +
                ORDER.length + ' sui ' + total + ' di questo capitolo. Le altre varianti restano ' +
                'nel testo, senza marca.';
            hint.hidden = false;
        } else {
            hint.textContent = '';
            hint.hidden = true;
        }

        updateStickyOffsets();
    }

    // -------------------------------------------------------------------------
    // Selection and readout
    // -------------------------------------------------------------------------

    /**
     * Mark a locus as current in both columns at once.
     * @param {string} id locus id
     */
    function highlight(id) {
        var previous = surface.querySelectorAll('[aria-current="true"]');
        Array.prototype.forEach.call(previous, function (el) {
            el.removeAttribute('aria-current');
        });

        var now = surface.querySelectorAll('[data-id="' + id + '"]');
        Array.prototype.forEach.call(now, function (el) {
            el.setAttribute('aria-current', 'true');
        });
    }

    /**
     * Select a locus and fill the readout with both readings.
     * @param {string} id locus id
     */
    function select(id) {
        var locus = DATA.loci[id];
        if (!locus) return;

        CURRENT = id;
        highlight(id);

        readout.innerHTML = '';

        var grid = document.createElement('div');
        grid.className = 'coll-rd-grid';

        [['V27', '1827', locus.rdg.V27], ['Q40', '1840', locus.rdg.Q40]]
            .forEach(function (pair) {
                var siglum = document.createElement('div');
                siglum.className = 'coll-siglum coll-siglum-' + pair[0].toLowerCase();
                siglum.textContent = pair[0] + ' · ' + pair[1];

                var reading = document.createElement('div');
                reading.className = 'coll-rdg' + (pair[2] ? '' : ' coll-rdg-none');
                reading.textContent = pair[2] || 'lezione assente';

                grid.appendChild(siglum);
                grid.appendChild(reading);
            });

        var meta = document.createElement('div');
        meta.className = 'coll-rd-meta';

        var operation = { sub: 'sostituzione', add: 'aggiunta 1840', del: 'soppressione 1840' };
        var kind = !locus.rdg.V27 ? 'add' : (!locus.rdg.Q40 ? 'del' : 'sub');

        [operation[kind],
         locus.cls,
         'salienza ' + locus.sal,
         locus.size + (locus.size === 1 ? ' parola' : ' parole')
        ].forEach(function (bit) {
            var span = document.createElement('span');
            span.textContent = bit;
            meta.appendChild(span);
        });

        grid.appendChild(meta);
        readout.appendChild(grid);
    }

    // -------------------------------------------------------------------------
    // Loading
    // -------------------------------------------------------------------------

    /**
     * Load a chapter and render it.
     * @param {string} chapter e.g. 'cap1'
     */
    function loadChapter(chapter) {
        if (CACHE[chapter]) {
            DATA = CACHE[chapter];
            CHAPTER = chapter;
            CURRENT = null;
            resetReadout();
            updateTitle();
            render();
            return;
        }

        surface.innerHTML = '<p class="coll-loading">Caricamento del capitolo&hellip;</p>';

        fetch('./collaziono/data/' + chapter)
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function (payload) {
                CACHE[chapter] = payload;
                DATA = payload;
                CHAPTER = chapter;
                CURRENT = null;
                resetReadout();
                updateTitle();
                render();
            })
            .catch(function (err) {
                surface.innerHTML = '<p class="coll-error">Impossibile caricare il capitolo: ' +
                    err.message + '</p>';
            });
    }

    function updateTitle() {
        // The introduction has a name, not a numeral.
        var label = DATA.chapter === 'intro' ? DATA.roman : 'Capitolo ' + DATA.roman;
        chapTitle.textContent = label;
        chapButton.textContent = label;
    }

    function resetReadout() {
        readout.innerHTML = '<p class="coll-empty">Selezionate un locus nel testo &mdash; con il ' +
            'mouse, con <kbd>Tab</kbd>, o con le frecce <kbd>&larr;</kbd> <kbd>&rarr;</kbd> ' +
            '&mdash; per leggerne le due lezioni.</p>';
    }

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    // One delegated listener for the whole surface: with ~1,500 loci in the DOM
    // at "Ogni variante", per-element listeners are the wrong trade.
    surface.addEventListener('click', function (e) {
        var target = e.target.closest('[data-id]');
        if (target) select(target.getAttribute('data-id'));
    });

    surface.addEventListener('focusin', function (e) {
        var target = e.target.closest('[data-id]');
        if (target) select(target.getAttribute('data-id'));
    });

    document.querySelectorAll('.coll-chapter-link').forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            loadChapter(link.getAttribute('data-chapter'));
        });
    });

    document.querySelectorAll('#coll-preset button').forEach(function (button) {
        button.addEventListener('click', function () {
            PRESET = button.getAttribute('data-v');
            document.querySelectorAll('#coll-preset button').forEach(function (b) {
                b.setAttribute('aria-pressed', String(b === button));
            });
            render();
        });
    });

    // Arrow keys step by locus id, not by element: each locus is in the DOM
    // twice. Check the target first, or this hijacks arrows inside controls.
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'select' || tag === 'input' || tag === 'textarea') return;
        if (!ORDER.length) return;

        var index = ORDER.indexOf(CURRENT);
        if (index === -1) {
            index = 0;
        } else {
            index += (e.key === 'ArrowRight' ? 1 : -1);
            if (index < 0 || index >= ORDER.length) return;
        }

        e.preventDefault();
        select(ORDER[index]);

        var el = surface.querySelector('[data-id="' + ORDER[index] + '"]');
        if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });

    // The rail wraps at narrow widths, so its height is not fixed.
    window.addEventListener('resize', updateStickyOffsets);

    loadChapter(CHAPTER);
})();
