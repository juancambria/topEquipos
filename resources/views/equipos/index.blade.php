@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/equipos.css') }}">
@endsection

@section('content')
<div class="page-container pagina-equipos">
    <header class="equipos-header">
        <h1>Gestión de Equipos</h1>
        <div class="equipos-toolbar">
            <div class="search-wrapper">
                <select id="searchColumn" class="search-column">
                    <option value="">Todas las columnas</option>
                    <option value="id">ID</option>
                    <option value="serie">Serie</option>
                    <option value="tipo">Tipo</option>
                    <option value="marca">Marca</option>
                    <option value="modelo">Modelo</option>
                    <option value="proveedor">Proveedor</option>
                    <option value="numeroFactura">N° Factura</option>
                    <option value="ubicacion">Ubicación</option>
                    <option value="sector">Sector</option>
                </select>
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="searchInput" class="input-buscar" placeholder="Buscar..." autocomplete="off" value="{{ request('search') }}" aria-label="Buscar equipo">
            </div>
            <span id="selectedEquipoInfo" class="selected-info">Ningún equipo seleccionado</span>
            <button type="button" class="btn btn-primario tool-btn" data-toolbar-key="a" onclick="abrirModalEquipo('crear')" title="Crear equipo (Alt+A)"><span class="tool-icon">➕</span><span class="tool-label"><span class="acc-k">A</span>ñadir</span></button>
            <button type="button" id="btnEditarEquipo" class="btn btn-primario tool-btn" data-toolbar-key="e" disabled title="Editar (Alt+E)"><span class="tool-icon">✏️</span><span class="tool-label"><span class="acc-k">E</span>ditar</span></button>
            <button type="button" id="btnBajaEquipo" class="btn btn-baja tool-btn" data-toolbar-key="b" disabled title="Baja (Alt+B)"><span class="tool-icon">🗑️</span><span class="tool-label"><span class="acc-k">B</span>aja</span></button>
            <button type="button" id="btnHistorialEquipo" class="btn btn-primario tool-btn" data-toolbar-key="h" disabled title="Historial (Alt+H)"><span class="tool-icon">📋</span><span class="tool-label"><span class="acc-k">H</span>istorial</span></button>
            @if(request()->routeIs('equipos.inactivos'))
                <a href="{{ route('equipos.index') }}" class="btn btn-primario tool-btn" data-toolbar-key="v" title="Ver activos (Alt+V)"><span class="tool-icon">👁️</span><span class="tool-label"><span class="acc-k">V</span>er activos</span></a>
            @else
                <a href="{{ route('equipos.inactivos') }}" class="btn btn-primario tool-btn" data-toolbar-key="v" title="Ver inactivos (Alt+V)"><span class="tool-icon">👁️</span><span class="tool-label"><span class="acc-k">V</span>er inactivos</span></a>
            @endif
        </div>
    </header>

    <div class="equipos-tabla-wrap">
        <table class="tabla-equipos" id="tablaEquipos">
            <thead>
                <tr>
                    <th class="sortable" data-column="id" data-order="{{ request('order', 'asc') }}">
                        ID
                        @if(request('column') == 'id')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="serie" data-order="{{ request('order', 'asc') }}">
                        Serie
                        @if(request('column') == 'serie')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="tipo" data-order="{{ request('order', 'asc') }}">
                        Tipo
                        @if(request('column') == 'tipo')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="marca" data-order="{{ request('order', 'asc') }}">
                        Marca
                        @if(request('column') == 'marca')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="modelo" data-order="{{ request('order', 'asc') }}">
                        Modelo
                        @if(request('column') == 'modelo')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="proveedor" data-order="{{ request('order', 'asc') }}">
                        Proveedor
                        @if(request('column') == 'proveedor')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="numeroFactura" data-order="{{ request('order', 'asc') }}">
                        N° Factura
                        @if(request('column') == 'numeroFactura')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="ubicacion" data-order="{{ request('order', 'asc') }}">
                        Ubicación
                        @if(request('column') == 'ubicacion')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                    <th class="sortable" data-column="sector" data-order="{{ request('order', 'asc') }}">
                        Sector
                        @if(request('column') == 'sector')
                            <span class="sort-icon">{{ request('order', 'asc') == 'asc' ? '▲' : '▼' }}</span>
                        @else
                            <span class="sort-icon">↕</span>
                        @endif
                    </th>
                </tr>
            </thead>
            <tbody>
                @forelse($equipos as $e)
                <tr class="fila-equipo-editar"
                    data-id="{{ $e->id }}"
                    data-serie="{{ e($e->serie) }}"
                    data-id-marca="{{ $e->idMarca }}"
                    data-id-modelo="{{ $e->idModelo }}"
                    data-id-tipo="{{ $e->idTipo }}"
                    data-id-proveedor="{{ $e->idProveedor ?? '' }}"
                    data-ubicacion-id="{{ $e->ubicacion_id ?? '' }}"
                    data-sector-id="{{ $e->sector_id ?? '' }}"
                    data-numero-factura="{{ $e->numeroFactura ?? $e->id }}"
                    data-observacion="{{ e($e->observacion ?? '') }}"
                    data-vto-garantia="{{ $e->vtoGarantia ?? '' }}"
                    data-fecha-inicio-garantia="{{ $e->created_at ? $e->created_at->format('Y-m-d') : '' }}"
                    data-precio="{{ $e->precio ?? '' }}"
                    data-informa-seguro="{{ $e->informa_al_seguro ? 1 : 0 }}"
                    data-imagen="{{ $e->imagen ?? '' }}">
                    <td>{{ $e->id }}</td>
                    <td>{{ $e->serie }}</td>
                    <td>{{ $e->tipo->nombreTipo ?? '—' }}</td>
                    <td>{{ $e->marca->marca ?? '—' }}</td>
                    <td>{{ $e->modelo->modelo ?? '—' }}</td>
                    <td>{{ $e->proveedor->proveedor ?? '—' }}</td>
                    <td>{{ $e->numeroFactura ?? $e->id }}</td>
                    <td>{{ $e->ubicacion->nombre ?? '—' }}</td>
                    <td>{{ $e->sector->nombre ?? '—' }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="9" class="td-vacio">No hay equipos. <button type="button" class="btn btn-link" onclick="abrirModalEquipo('crear')">Crear el primero</button></td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <form id="formBajaEquipo" method="POST" style="display:none;">
        @csrf
    </form>

<div id="modalEquipo" class="modal-overlay" data-modal-focus="#equipoIdTipo" aria-hidden="true">
    <div class="modal-equipo">
        <div class="modal-equipo-header">
            <h2 id="modalEquipoTitulo">Alta de Equipo</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalEquipo()" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formEquipo" method="POST" class="modal-equipo-body" enctype="multipart/form-data">
            @csrf
            <input type="hidden" id="equipoNumeroFactura" name="numeroFactura">
            <div class="modal-equipo-grid">
                <div class="modal-equipo-row modal-equipo-row-3">
                    <div class="form-grupo">
                        <label for="equipoIdTipo">Tipo *</label>
                        <div class="input-group">
                            <select id="equipoIdTipo" name="idTipo" required class="form-control">
                                <option value="">— Seleccionar tipo —</option>
                                @foreach($tipos as $t)
                                    <option value="{{ $t->idTipo }}">{{ $t->nombreTipo }}</option>
                                @endforeach
                            </select>
                            <div class="input-group-append">
                                <button type="button" class="btn btn-outline-secondary btn-agregar-entidad" onclick="abrirModalTipo('crear')" title="Crear nuevo tipo">+</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-grupo">
                        <label for="equipoIdMarca">Marca *</label>
                        <div class="input-group">
                            <select id="equipoIdMarca" name="idMarca" required class="form-control">
                                <option value="">— Seleccionar marca —</option>
                                @foreach($marcas as $m)
                                    <option value="{{ $m->idMarca }}">{{ $m->marca }}</option>
                                @endforeach
                            </select>
                            <div class="input-group-append">
                                <button type="button" class="btn btn-outline-secondary btn-agregar-entidad" onclick="abrirModalMarca('crear')" title="Crear nueva marca">+</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-grupo">
                        <label for="equipoIdModelo">Modelo *</label>
                        <div class="input-group">
                            <select id="equipoIdModelo" name="idModelo" required class="form-control">
                                <option value="">— Seleccionar modelo —</option>
                                @foreach($modelos as $mo)
                                    <option value="{{ $mo->idModelo }}">{{ $mo->modelo }}</option>
                                @endforeach
                            </select>
                            <div class="input-group-append">
                                <button type="button" class="btn btn-outline-secondary btn-agregar-entidad" onclick="abrirModalModelo('crear')" title="Crear nuevo modelo">+</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-equipo-row modal-equipo-row-3">
                    <div class="form-grupo">
                        <label for="equipoSerie">Serie *</label>
                        <input type="text" id="equipoSerie" name="serie" required autocomplete="off" class="form-control">
                        <small id="equipoSerieError" class="texto-error" style="display:none; color:#d9534f; margin-top:4px;">Número de serie incorrecto o ya existente</small>
                    </div>

                    <div class="form-grupo form-grupo-garantia">
                        <label for="equipoGarantiaDias">ㅤ</label>
                        <div class="input-group garantia-input-group">
                            <span class="garantia-texto">Garantía de</span>
                            <input type="number" id="equipoGarantiaDias" min="0" max="999" step="1" value="" class="form-control garantia-dias-input" placeholder="días">
                            <span class="garantia-texto">días</span>
                        </div>
                        <small id="equipoGarantiaPreview" class="garantia-preview">(vence: —)</small>
                        <input type="hidden" id="equipoGarantiaBase" value="">
                        <input type="hidden" id="equipoVtoGarantia" name="vtoGarantia" value="">
                    </div>

                    <div class="form-grupo">
                        <label for="equipoPrecio">Precio</label>
                        <input type="number" step="0.01" id="equipoPrecio" name="precio" placeholder="0.00" class="form-control">
                    </div>
                </div>

                <div class="modal-equipo-row modal-equipo-row-1">
                    <div class="form-grupo form-grupo-check">
                        <input type="hidden" name="informa_al_seguro" value="0">
                        <label class="form-check-label" for="equipoInformaSeguro">
                            <input type="checkbox" id="equipoInformaSeguro" class="form-check-input" name="informa_al_seguro" value="1" checked>
                            Informa al seguro
                        </label>
                    </div>
                </div>

                <div class="modal-equipo-row modal-equipo-row-2">
                    <div class="form-grupo">
                        <label for="equipoUbicacionId">Ubicación *</label>
                        <div class="input-group">
                            <select id="equipoUbicacionId" name="ubicacion_id" required class="form-control">
                                <option value="">— Seleccionar ubicación —</option>
                                @foreach($ubicaciones as $u)
                                    <option value="{{ $u->id }}">{{ trim(($u->codigo ? $u->codigo . ' - ' : '') . $u->nombre) }}</option>
                                @endforeach
                            </select>
                            <div class="input-group-append">
                                <button type="button" class="btn btn-outline-secondary btn-agregar-entidad" onclick="abrirModalUbicacion('crear')" title="Crear nueva ubicación">+</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-grupo">
                        <label for="equipoSectorId">Sector *</label>
                        <div class="input-group">
                            <select id="equipoSectorId" name="sector_id" required class="form-control">
                                <option value="">— Seleccionar sector —</option>
                                @foreach($sectores as $s)
                                    <option value="{{ $s->id }}">{{ $s->nombre }}</option>
                                @endforeach
                            </select>
                            <div class="input-group-append">
                                <button type="button" class="btn btn-outline-secondary btn-agregar-entidad" onclick="abrirModalSector('crear')" title="Crear nuevo sector">+</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-equipo-row modal-equipo-row-1" id="equipoProveedorRow" style="display: none;">
                    <div class="form-grupo">
                        <label for="equipoIdProveedor">Proveedor</label>
                        <select id="equipoIdProveedor" name="idProveedor" class="form-control">
                            <option value="">— Sin especificar —</option>
                            @foreach($proveedores as $p)
                                <option value="{{ $p->idProveedor }}">{{ $p->proveedor }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>

                <div class="modal-equipo-row modal-equipo-row-2">
                    <div class="form-grupo full-width form-grupo-imagen">
                    <label>Imagen del equipo</label>
                    <input type="file" id="equipoImagen" name="imagen" accept="image/*">
                    <input type="hidden" id="imagenActual" name="imagen_actual" value="">
                    <div class="preview-imagen" id="previewImagen">
                        <div class="preview-imagen-container">
                            <img id="previewImgTag" src="" alt="Previsualización">
                            <button type="button" id="btnEliminarImagen" class="btn-eliminar-imagen" style="display: none;" title="Eliminar imagen">&times;</button>
                        </div>
                        <div class="placeholder" id="previewPlaceholder">
                            Click para seleccionar imagen
                        </div>
                    </div>
                    <small style="color: #666; font-size: 11px; margin-top: 4px; display: block;">Formatos: JPG, PNG, GIF. Tamaño máx: 2MB</small>
                    </div>

                    <div class="form-grupo full-width">
                        <label for="equipoObservacion">Observación</label>
                        <textarea id="equipoObservacion" name="observacion" rows="3" class="form-control"></textarea>
                    </div>
                </div>
            </div>

            <div class="modal-equipo-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalEquipo()">Cancelar</button>
                <button type="submit" id="modalEquipoSubmit" class="btn btn-primario">Guardar</button>
            </div>
        </form>
    </div>
</div>

@endsection
