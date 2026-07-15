(function () {
    'use strict';

    function serializeForm(form) {
        var data = {};
        if (!form) return data;
        Array.prototype.forEach.call(form.elements, function (el) {
            if (!el.name || el.type === 'file' || el.type === 'submit' || el.type === 'button') return;
            if (el.type === 'checkbox' || el.type === 'radio') {
                if (el.checked) data[el.name] = el.value;
                return;
            }
            if (el.tagName === 'SELECT' && el.multiple) {
                data[el.name] = Array.prototype.map.call(el.selectedOptions, function (o) { return o.value; });
                return;
            }
            data[el.name] = el.value;
        });
        return data;
    }

    function snapshotsEqual(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    }

    window.OperacionesForm = {
        captureSnapshot: function (form) {
            return serializeForm(form);
        },

        isDirty: function (form, snapshot, extras) {
            extras = extras || {};
            if (!snapshotsEqual(serializeForm(form), snapshot)) return true;
            if (extras.fotosEliminar && extras.fotosEliminar.length > 0) return true;
            if (extras.nuevasFotos && extras.nuevasFotos.length > 0) return true;
            if (extras.extraDirty) return true;
            return false;
        },

        confirmar: function (titulo, mensaje, callback, peligro) {
            if (typeof abrirModalConfirmacion === 'function') {
                abrirModalConfirmacion(titulo, mensaje, callback, false, !!peligro);
                return;
            }
            if (window.confirm(mensaje)) callback();
        },

        confirmarCancelar: function (hayCambios, callback) {
            if (!hayCambios) {
                callback();
                return;
            }
            this.confirmar(
                'Descartar cambios',
                'Se van a perder los cambios realizados. ¿Desea continuar?',
                callback,
                true
            );
        },

        confirmarGuardar: function (esCrear, etiqueta, callback) {
            var titulo = esCrear ? 'Crear ' + etiqueta : 'Actualizar ' + etiqueta;
            var mensaje = esCrear
                ? '¿Confirmás la creación de este registro?'
                : '¿Confirmás la actualización de este registro?';
            this.confirmar(titulo, mensaje, callback, false);
        },

        confirmarEliminar: function (etiqueta, callback) {
            this.confirmar(
                'Eliminar ' + etiqueta,
                '¿Desea eliminar este registro? Esta acción no se puede deshacer.',
                callback,
                true
            );
        },

        bindDirtyTracking: function (form, getState, onDirty) {
            if (!form) return;
            var mark = function () {
                var st = getState();
                onDirty(OperacionesForm.isDirty(form, st.snapshot, st.extras));
            };
            form.addEventListener('input', mark);
            form.addEventListener('change', mark);
        },

        getNuevasFotos: function (input) {
            if (!input || !input.files) return [];
            return Array.prototype.slice.call(input.files);
        },

        /**
         * Cola de imágenes: permite elegir en varias tandas hasta max total (incl. existentes en servidor).
         */
        createColaFotos: function (opts) {
            opts = opts || {};
            var max = opts.max || 5;
            var cola = [];
            var contarExistentes = opts.contarExistentes || function () { return 0; };
            var avisar = opts.avisar || function () {};

            function fileKey(file) {
                return file.name + '|' + file.size + '|' + file.lastModified;
            }

            function esImagen(file) {
                if (!file || !file.size) return false;
                if (file.type && file.type.indexOf('image/') === 0) return true;
                return /\.(jpe?g|png)$/i.test(file.name || '');
            }

            function slotsDisponibles() {
                return Math.max(0, max - contarExistentes() - cola.length);
            }

            function syncInput(input) {
                if (!input || typeof DataTransfer === 'undefined') return;
                var dt = new DataTransfer();
                cola.forEach(function (f) { dt.items.add(f); });
                input.files = dt.files;
            }

            return {
                getFiles: function () {
                    return cola.slice();
                },

                length: function () {
                    return cola.length;
                },

                limpiar: function (input) {
                    cola = [];
                    syncInput(input);
                },

                quitar: function (index, input) {
                    if (index < 0 || index >= cola.length) return;
                    cola.splice(index, 1);
                    syncInput(input);
                },

                agregarDesdeInput: function (input) {
                    if (!input || !input.files || !input.files.length) return 0;
                    var incoming = Array.prototype.slice.call(input.files);
                    input.value = '';
                    var slots = slotsDisponibles();
                    if (slots === 0) {
                        avisar('Ya alcanzó el máximo de ' + max + ' imágenes.');
                        return 0;
                    }
                    var keys = Object.create(null);
                    cola.forEach(function (f) { keys[fileKey(f)] = true; });
                    var agregadas = 0;
                    var omitidasMax = 0;
                    incoming.forEach(function (file) {
                        if (!esImagen(file)) return;
                        var key = fileKey(file);
                        if (keys[key]) return;
                        if (agregadas >= slots) {
                            omitidasMax++;
                            return;
                        }
                        keys[key] = true;
                        cola.push(file);
                        agregadas++;
                    });
                    syncInput(input);
                    if (omitidasMax > 0) {
                        avisar('Solo puede adjuntar hasta ' + max + ' imágenes en total.');
                    }
                    return agregadas;
                },

                appendToFormData: function (fd, fieldName) {
                    fieldName = fieldName || 'fotos[]';
                    cola.forEach(function (file) {
                        fd.append(fieldName, file);
                    });
                },
            };
        },
    };
})();
