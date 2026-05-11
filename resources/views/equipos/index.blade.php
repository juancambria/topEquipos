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
                    data-numero-factura="{{ $e->numeroFactura ? e($e->numeroFactura) : '' }}"
                    data-proveedor-nombre="{{ e($e->factura_proveedor_nombre ?? ($e->proveedor->proveedor ?? '')) }}"
                    data-observacion="{{ e($e->observacion ?? '') }}"
                    data-vto-garantia="{{ $e->vtoGarantia ?? '' }}"
                    data-fecha-inicio-garantia="{{ $e->created_at ? $e->created_at->format('Y-m-d') : '' }}"
                    data-precio="{{ $e->precio ?? '' }}"
                    data-factura-precio-equipo="{{ $e->factura_precio_equipo ?? '' }}"
                    data-factura-total="{{ $e->factura_total ?? '' }}"
                    data-factura-fecha="{{ $e->factura_fecha ?? '' }}"
                    data-factura-proveedor-id="{{ $e->factura_proveedor_id ?? '' }}"
                    data-factura-proveedor-nombre="{{ e($e->factura_proveedor_nombre ?? '') }}"
                    data-informa-seguro="{{ $e->informa_al_seguro ? 1 : 0 }}"
                    data-atributos-valores='@json($e->atributoValores->mapWithKeys(fn($av) => [(string) $av->idAtributo => $av->valor])->toArray())'
                    data-imagen="{{ $e->imagen ?? '' }}">
                    <td>{{ $e->id }}</td>
                    <td>{{ $e->serie }}</td>
                    <td>{{ $e->tipo->nombreTipo ?? '—' }}</td>
                    <td>{{ $e->marca->marca ?? '—' }}</td>
                    <td>{{ $e->modelo->modelo ?? '—' }}</td>
                    <td>{{ $e->proveedor->proveedor ?? '—' }}</td>
                    <td>{{ $e->numeroFactura ?: '—' }}</td>
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

<div id="modalEquipo" class="modal-overlay" data-modal-focus="#equipoIdTipo" aria-hidden="true" data-route-atributos-tipo="{{ route('equipos.atributosPorTipo', ['idTipo' => '__ID__']) }}" data-route-gestor-atributos="{{ route('atributosTiposEquipos.index') }}" data-route-crear-atributo-tipo="{{ route('atributosTiposEquipos.tipos.atributos.crear', ['idTipo' => '__TIPO__']) }}" data-route-crear-opcion-atributo="{{ route('atributosTiposEquipos.tipos.atributos.opciones.crear', ['idTipo' => '__TIPO__', 'idAtributo' => '__ATTR__']) }}">
    <div class="modal-equipo">
        <div class="modal-equipo-header">
            <h2 id="modalEquipoTitulo">Alta de Equipo</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalEquipo()" aria-label="Cerrar" title="Alt+Mayús+C o Esc para cerrar">&times;</button>
        </div>
        <form id="formEquipo" method="POST" class="modal-equipo-body" enctype="multipart/form-data">
            @csrf
            <input type="hidden" id="equipoNumeroFactura" name="numeroFactura">
            <div class="modal-equipo-layout">
                <div class="modal-equipo-col modal-equipo-col-main">
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
                                <button type="button" class="btn btn-agregar-entidad" onclick="abrirModalTipo('crear')" title="Crear nuevo tipo">+</button>
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
                                <button type="button" class="btn btn-agregar-entidad" onclick="abrirModalMarca('crear')" title="Crear nueva marca">+</button>
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
                                <button type="button" class="btn btn-agregar-entidad" onclick="abrirModalModelo('crear')" title="Crear nuevo modelo">+</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-grupo">
                        <label for="equipoSerie">Serie *</label>
                        <input type="text" id="equipoSerie" name="serie" required autocomplete="off" class="form-control">
                        <small id="equipoSerieError" class="texto-error" style="display:none; color:#d9534f; margin-top:4px;">Número de serie incorrecto o ya existente</small>
                    </div>

                    <div class="form-grupo form-grupo-garantia">
                        <div class="garantia-linea">
                            <span class="garantia-texto">Garantía de</span>
                            <input type="number" id="equipoGarantiaDias" min="0" max="999" step="1" value="" class="form-control garantia-dias-input" placeholder="0" aria-label="Garantía en días">
                            <span class="garantia-texto">días</span>
                            <span id="equipoGarantiaPreview" class="garantia-preview">(vence: —)</span>
                        </div>
                        <input type="hidden" id="equipoGarantiaBase" value="">
                        <input type="hidden" id="equipoVtoGarantia" name="vtoGarantia" value="">
                    </div>

                    <div class="form-grupo">
                        <label for="equipoPrecio">Precio</label>
                        <input type="number" step="0.01" id="equipoPrecio" name="precio" placeholder="0.00" class="form-control">
                    </div>

                    <div class="form-grupo form-grupo-check">
                        <input type="hidden" name="informa_al_seguro" value="0">
                        <label class="form-check-label" for="equipoInformaSeguro">
                            <input type="checkbox" id="equipoInformaSeguro" class="form-check-input" name="informa_al_seguro" value="1" checked>
                            Informa al seguro
                        </label>
                    </div>

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
                                <button type="button" class="btn btn-agregar-entidad" onclick="abrirModalUbicacion('crear')" title="Crear nueva ubicación">+</button>
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
                                <button type="button" class="btn btn-agregar-entidad" onclick="abrirModalSector('crear')" title="Crear nuevo sector">+</button>
                            </div>
                        </div>
                    </div>

                </div>

                <aside class="modal-equipo-col modal-equipo-col-side">
                    <div class="form-grupo">
                        <label for="equipoObservacion">Observación</label>
                        <textarea id="equipoObservacion" name="observacion" rows="5" class="form-control"></textarea>
                    </div>

                    <div class="form-grupo" id="equipoAtributosBlock" hidden>
                        <div class="equipo-atributos-header">
                            <label>Atributos</label>
                            <button type="button" class="btn btn-agregar-entidad btn-atributos-gestor" id="btnAbrirGestorAtributosEquipo" title="Crear atributo">+</button>
                        </div>
                        <div id="equipoAtributosContainer" class="equipo-atributos-container"></div>
                    </div>

                    <div class="form-grupo form-grupo-imagen">
                        <label for="equipoImagen">Imagen del equipo</label>
                        <input type="file" id="equipoImagen" name="imagen" accept="image/*" class="form-control-file-input">
                        <input type="hidden" id="imagenActual" name="imagen_actual" value="">
                        <div class="preview-imagen preview-imagen--modal" id="previewImagen">
                            <div class="preview-imagen-container">
                                <img id="previewImgTag" src="">
                                <button type="button" id="btnEliminarImagen" class="btn-eliminar-imagen" style="display: none;" title="Eliminar imagen">&times;</button>
                            </div>
                            <div class="placeholder" id="previewPlaceholder">
                                Tocá para elegir imagen
                            </div>
                        </div>
                        <small class="form-grupo-imagen-hint">Formatos: JPG, PNG, GIF. Máx. 2&nbsp;MB</small>
                    </div>

                    <div id="equipoPanelFactura" class="equipo-panel-factura" hidden>
                        <h3 class="equipo-panel-factura-titulo">Datos de la factura de compra</h3>
                        <dl class="equipo-panel-factura-dl">
                            <div class="equipo-panel-factura-fila">
                                <dt>Fecha</dt>
                                <dd id="equipoPanelFacturaFecha">—</dd>
                            </div>
                            <div class="equipo-panel-factura-fila">
                                <dt>Proveedor</dt>
                                <dd id="equipoPanelFacturaProveedor">—</dd>
                            </div>
                            <div class="equipo-panel-factura-fila">
                                <dt>N° factura</dt>
                                <dd id="equipoPanelFacturaNumero">—</dd>
                            </div>
                            <div class="equipo-panel-factura-fila">
                                <dt>Precio</dt>
                                <dd id="equipoPanelFacturaPrecio">—</dd>
                            </div>
                        </dl>
                    </div>
                </aside>
            </div>

            <div class="modal-equipo-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalEquipo()">Cancelar</button>
                <button type="submit" id="modalEquipoSubmit" class="btn btn-primario">Guardar</button>
            </div>
        </form>
    </div>
</div>

<div id="modalAtributoEquipo" class="modal-overlay" aria-hidden="true" data-modal-focus="#equipoNuevoAtributoNombre">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2>Nuevo Atributo</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalAtributoEquipo()" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formAtributoEquipo" class="modal-sector-body">
            <div class="form-grupo">
                <label for="equipoNuevoAtributoNombre">Nombre *</label>
                <input type="text" id="equipoNuevoAtributoNombre" maxlength="30" required autocomplete="off" class="form-control">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalAtributoEquipo()"><span class="footer-acc-label"><span class="acc-k">C</span>ancelar</span></button>
                <button type="submit" class="btn btn-primario"><span class="footer-acc-label">Crea<span class="acc-k">r</span></span></button>
            </div>
        </form>
    </div>
</div>

<div id="modalOpcionAtributoEquipo" class="modal-overlay" aria-hidden="true" data-modal-focus="#equipoNuevaOpcionAtributoValor">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2>Nueva Opción</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalOpcionAtributoEquipo()" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formOpcionAtributoEquipo" class="modal-sector-body">
            <input type="hidden" id="equipoOpcionAtributoId" value="">
            <div class="form-grupo">
                <label for="equipoOpcionAtributoNombre">Atributo</label>
                <input type="text" id="equipoOpcionAtributoNombre" class="form-control" readonly>
            </div>
            <div class="form-grupo">
                <label for="equipoNuevaOpcionAtributoValor">Opción *</label>
                <input type="text" id="equipoNuevaOpcionAtributoValor" maxlength="30" required autocomplete="off" class="form-control">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalOpcionAtributoEquipo()">Cancelar</button>
                <button type="submit" class="btn btn-primario">Crear</button>
            </div>
        </form>
    </div>
</div>

@endsection
