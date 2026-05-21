@extends('layouts.dashboard')

@section('styles')
<link rel="stylesheet" href="{{ asset('css/atributos-tipos-equipos.css') }}">
@endsection

@section('content')
<div class="page-container pagina-atributos-tipos-equipos">
    <header class="atributos-tipos-header">
        <h1>Atributos de Tipos de Equipos</h1>
        <div class="atributos-tipos-toolbar">
            <span id="tipoSeleccionadoInfo" class="selected-info">Ningún tipo seleccionado</span>
            <span class="estado-autoguardado" id="estadoAutoguardado">Guardado automático activo</span>
        </div>
    </header>

    <div class="atributos-layout">
        <section class="panel panel-tipos">
            <h2>Equipos</h2>
            <div class="panel-search-wrap">
                <input type="text" id="buscarTiposEquipos" class="panel-search-input" placeholder="Buscar tipo..." autocomplete="off">
            </div>
            <div id="listaTipos" class="lista-tipos">
                @if($tipos->isEmpty())
                    <p class="estado-vacio">No hay tipos activos disponibles.</p>
                @else
                    <table class="tabla-tipos" id="tablaTiposEquipos">
                        <thead>
                            <tr>
                                <th class="sortable" data-column="id" data-order="asc">
                                    ID <span class="sort-icon">↕</span>
                                </th>
                                <th class="sortable" data-column="nombre" data-order="asc">
                                    Tipo <span class="sort-icon">↕</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($tipos as $tipo)
                                <tr
                                    class="tipo-item {{ (int) $tipo->idTipo === (int) $idTipoSeleccionado ? 'seleccionado' : '' }}"
                                    data-tipo-id="{{ $tipo->idTipo }}"
                                    data-tipo-nombre="{{ $tipo->nombreTipo }}"
                                    tabindex="0"
                                >
                                    <td>{{ $tipo->idTipo }}</td>
                                    <td>{{ $tipo->nombreTipo }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @endif
            </div>
        </section>

        <section class="panel panel-atributos">
            <div class="panel-heading-inline">
                <h2>Atributos</h2>
                <div class="panel-actions-inline">
                    <button type="button" class="btn btn-secundario tool-btn btn-panel-action" data-toolbar-key="u" onclick="abrirModalUnidadesMedida()" title="Unidades (Alt+U)">
                        <span class="tool-icon">📏</span>
                        <span class="tool-label">Unidades</span>
                    </button>
                    <button type="button" class="btn btn-primario tool-btn btn-panel-action" data-toolbar-key="a" onclick="abrirModalCrearAtributo()" title="Crear atributo (Alt+A)">
                        <span class="tool-icon">➕</span>
                        <span class="tool-label">Crear atributo</span>
                    </button>
                </div>
            </div>
            <div class="panel-search-wrap">
                <input type="text" id="buscarAtributosEquipos" class="panel-search-input" placeholder="Buscar atributo..." autocomplete="off">
            </div>
            <div id="listaAtributos" class="lista-atributos">
                <table class="tabla-atributos" id="tablaAtributos">
                    <thead>
                        <tr>
                            <th style="width:40px;">Sel</th>
                            <th class="sortable" data-column="id" data-order="asc">
                                ID <span class="sort-icon">↕</span>
                            </th>
                            <th class="sortable" data-column="nombre" data-order="asc">
                                Atributo <span class="sort-icon">↕</span>
                            </th>
                            <th style="width:44px;">Acc</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($atributos as $atributo)
                            <tr class="atributo-item" data-atributo-id="{{ $atributo->idAtributo }}">
                                <td>
                                    <input type="checkbox" class="atributo-check" value="{{ $atributo->idAtributo }}">
                                </td>
                                <td>{{ $atributo->idAtributo }}</td>
                                <td class="atributo-nombre">{{ $atributo->nombre }}</td>
                                <td>
                                    <button type="button" class="btn-opcion-quitar btn-eliminar-atributo" title="Eliminar atributo {{ $atributo->nombre }}">x</button>
                                </td>
                            </tr>
                        @empty
                            <tr class="fila-sin-atributos">
                                <td colspan="4" class="td-vacio">No hay atributos creados todavía.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </section>

        <section class="panel panel-especificaciones">
            <h2>Especificaciones</h2>
            <p class="panel-help-text">Tab para avanzar entre campos, Enter para confirmar opciones rápidas.</p>
            <div id="atributoEspecificacionActual" class="especificacion-actual">Atributo activo: —</div>
            <div class="editor-especificaciones-wrap">
                <div id="editorEspecificaciones" class="editor-especificaciones">
                    <div class="td-vacio">Selecciona un tipo y marca atributos para configurar.</div>
                </div>
            </div>
        </section>
    </div>
</div>

<div id="modalCrearAtributo" class="modal-overlay" data-modal-focus="#nuevoAtributoNombre" aria-hidden="true">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2>Nuevo atributo general</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalCrearAtributo()" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formCrearAtributo" class="modal-sector-body">
            @csrf
            <div class="form-grupo">
                <label for="nuevoAtributoNombre">Nombre</label>
                <input type="text" id="nuevoAtributoNombre" name="nombre" required autocomplete="off" maxlength="30">
            </div>
            <div class="modal-sector-footer">
                <button type="button" class="btn btn-secundario" onclick="cerrarModalCrearAtributo()">Cancelar</button>
                <button type="submit" class="btn btn-primario">Guardar atributo</button>
            </div>
        </form>
    </div>
</div>

<div id="modalUnidadesMedida" class="modal-overlay" data-modal-focus="#nuevaUnidadNombre" aria-hidden="true">
    <div class="modal-sector">
        <div class="modal-sector-header">
            <h2>Unidades de medida</h2>
            <button type="button" class="modal-cerrar" onclick="cerrarModalUnidadesMedida()" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-sector-body">
            <form id="formCrearUnidadMedida" class="form-inline-unidad">
                @csrf
                <input type="text" id="nuevaUnidadNombre" name="nombre" maxlength="30" required placeholder="Ej: GB, Kg, MHz">
                <button type="submit" class="btn btn-primario">Agregar</button>
            </form>
            <div class="tabla-unidades-wrap">
                <table class="tabla-atributos" id="tablaUnidadesMedida">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Unidad</th>
                            <th style="width:44px;">Acc</th>
                        </tr>
                    </thead>
                    <tbody id="tbodyUnidadesMedida">
                        @forelse($unidadesMedida as $unidad)
                            <tr data-unidad-id="{{ $unidad->idUnidadMedida }}" data-unidad-nombre="{{ $unidad->nombre }}">
                                <td>{{ $unidad->idUnidadMedida }}</td>
                                <td>{{ $unidad->nombre }}</td>
                                <td><button type="button" class="btn-opcion-quitar btn-eliminar-unidad" title="Eliminar unidad">x</button></td>
                            </tr>
                        @empty
                            <tr class="sin-unidades"><td colspan="3" class="td-vacio">No hay unidades creadas.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<div
    id="atributosTiposEquiposData"
    data-csrf-token="{{ csrf_token() }}"
    data-ruta-obtener-configuracion="{{ route('atributosTiposEquipos.tipos.configuracion', ['idTipo' => '__ID__']) }}"
    data-ruta-guardar-configuracion="{{ route('atributosTiposEquipos.tipos.configuracion.guardar', ['idTipo' => '__ID__']) }}"
    data-ruta-crear-atributo="{{ route('atributosTiposEquipos.atributos.crear') }}"
    data-ruta-eliminar-atributo="{{ route('atributosTiposEquipos.atributos.eliminar', ['idAtributo' => '__ID__']) }}"
    data-ruta-crear-unidad="{{ route('atributosTiposEquipos.unidadesMedida.crear') }}"
    data-ruta-eliminar-unidad="{{ route('atributosTiposEquipos.unidadesMedida.eliminar', ['idUnidadMedida' => '__ID__']) }}"
    data-tipo-seleccionado="{{ $idTipoSeleccionado }}"
    data-configuraciones-iniciales='@json($configuraciones)'
    data-unidades-medida='@json($unidadesMedida)'
></div>
@endsection
