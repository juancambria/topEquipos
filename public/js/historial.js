// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {

// ===== BUSCADOR EN TIEMPO REAL =====
document.getElementById('buscadorHistorial')?.addEventListener('input', function() {
    const filtro = this.value.toLowerCase();
    document.querySelectorAll('#tablaHistorial tbody tr').forEach(fila => {
        const equipo = fila.children[1].textContent.toLowerCase();
        const accion = fila.children[2].textContent.toLowerCase();
        fila.style.display = (equipo.includes(filtro) || accion.includes(filtro)) ? '' : 'none';
    });
});

// ===== ORDENAR POR COLUMNAS =====
document.querySelectorAll('#tablaHistorial th.sortable').forEach(th => {
    th.addEventListener('click', function() {
        const column = this.dataset.column;
        const currentOrder = this.dataset.order;
        const newOrder = currentOrder === 'desc' ? 'asc' : 'desc';
        const url = new URL(window.location.href);
        url.searchParams.set('column', column);
        url.searchParams.set('order', newOrder);
        window.location.href = url.toString();
    });
    th.style.cursor = 'pointer';
    th.title = 'Click para ordenar';
});

}); // Fin DOMContentLoaded
