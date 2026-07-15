(function () {
    'use strict';

    var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    var DOW = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    function pad(n) {
        return n < 10 ? '0' + n : String(n);
    }

    function toYmd(d) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function parseYmd(str) {
        var p = String(str).split('-');
        return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    }

    window.OperacionesCalendar = function (options) {
        var cfg = Object.assign({
            apiUrl: '',
            gridEl: null,
            dowEl: null,
            titleEl: null,
            prevBtn: null,
            nextBtn: null,
            getEventClass: function () { return 'op-estado-pendiente'; },
            getEventLabel: function (item) { return item.incidencia || item.descripcion_resumen || '#'; },
            getEventDate: function (item) { return item.fecha; },
            onDayClick: function () {},
        }, options || {});

        var hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        var minDate = new Date(hoy);
        minDate.setFullYear(minDate.getFullYear() - 1);
        var maxDate = new Date(hoy);
        maxDate.setFullYear(maxDate.getFullYear() + 1);

        var current = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        var eventos = [];

        function puedeIr(dir) {
            var test = new Date(current);
            test.setMonth(test.getMonth() + dir);
            return test >= new Date(minDate.getFullYear(), minDate.getMonth(), 1)
                && test <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
        }

        function actualizarNav() {
            if (cfg.titleEl) {
                cfg.titleEl.textContent = MESES[current.getMonth()] + ' ' + current.getFullYear();
            }
            if (cfg.prevBtn) cfg.prevBtn.disabled = !puedeIr(-1);
            if (cfg.nextBtn) cfg.nextBtn.disabled = !puedeIr(1);
        }

        function eventosDelDia(ymd) {
            return eventos.filter(function (e) { return cfg.getEventDate(e) === ymd; });
        }

        function renderDow() {
            if (!cfg.dowEl) return;
            cfg.dowEl.innerHTML = DOW.map(function (d) {
                return '<div class="op-cal-dow">' + d + '</div>';
            }).join('');
        }

        function renderGrid() {
            if (!cfg.gridEl) return;

            var first = new Date(current.getFullYear(), current.getMonth(), 1);
            var startDow = (first.getDay() + 6) % 7;
            var daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
            var prevMonthDays = new Date(current.getFullYear(), current.getMonth(), 0).getDate();

            var html = '';
            var cell = 0;

            for (var i = startDow - 1; i >= 0; i--) {
                var d = prevMonthDays - i;
                html += celdaHtml(d, true, new Date(current.getFullYear(), current.getMonth() - 1, d));
                cell++;
            }

            for (var day = 1; day <= daysInMonth; day++) {
                html += celdaHtml(day, false, new Date(current.getFullYear(), current.getMonth(), day));
                cell++;
            }

            while (cell % 7 !== 0) {
                var nd = cell - startDow - daysInMonth + 1;
                html += celdaHtml(nd, true, new Date(current.getFullYear(), current.getMonth() + 1, nd));
                cell++;
            }

            cfg.gridEl.innerHTML = html;

            cfg.gridEl.querySelectorAll('.op-cal-day').forEach(function (el) {
                el.addEventListener('click', function () {
                    var ymd = el.dataset.date;
                    cfg.onDayClick(ymd, eventosDelDia(ymd));
                });
            });
        }

        function celdaHtml(num, outside, dateObj) {
            var ymd = toYmd(dateObj);
            var items = eventosDelDia(ymd);
            var cls = 'op-cal-day' + (outside ? ' outside' : '');
            if (ymd === toYmd(hoy)) cls += ' today';

            var evHtml = items.map(function (item) {
                return '<div class="op-cal-event ' + cfg.getEventClass(item) + '" title="' + escapeAttr(cfg.getEventLabel(item)) + '">' +
                    escapeHtml(cfg.getEventLabel(item)) + '</div>';
            }).join('');

            return '<div class="' + cls + '" data-date="' + ymd + '">' +
                '<div class="op-cal-day-num">' + num + '</div>' + evHtml + '</div>';
        }

        function escapeHtml(s) {
            return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        function escapeAttr(s) {
            return escapeHtml(s).replace(/"/g, '&quot;');
        }

        function cargar() {
            var desde = new Date(current.getFullYear(), current.getMonth(), 1);
            var hasta = new Date(current.getFullYear(), current.getMonth() + 1, 0);
            var url = cfg.apiUrl + '?desde=' + toYmd(desde) + '&hasta=' + toYmd(hasta);

            return fetch(url, { headers: { Accept: 'application/json' } })
                .then(function (r) { return r.json(); })
                .then(function (json) {
                    eventos = (json && json.data) ? json.data : [];
                    actualizarNav();
                    renderGrid();
                })
                .catch(function () {
                    if (typeof mostrarToast === 'function') {
                        mostrarToast('Error al cargar el calendario', 'error');
                    }
                });
        }

        if (cfg.prevBtn) {
            cfg.prevBtn.addEventListener('click', function () {
                if (!puedeIr(-1)) return;
                current.setMonth(current.getMonth() - 1);
                cargar();
            });
        }
        if (cfg.nextBtn) {
            cfg.nextBtn.addEventListener('click', function () {
                if (!puedeIr(1)) return;
                current.setMonth(current.getMonth() + 1);
                cargar();
            });
        }

        renderDow();
        actualizarNav();

        return {
            cargar: cargar,
            irAMes: function (ymd) {
                var d = parseYmd(ymd);
                current = new Date(d.getFullYear(), d.getMonth(), 1);
                return cargar();
            },
            getEventos: function () { return eventos.slice(); },
        };
    };
})();
