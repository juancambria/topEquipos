// dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard cargado correctamente');

    // Resaltar opción activa del menú
    const links = document.querySelectorAll('.sidebar a');
    const currentUrl = window.location.href;

    links.forEach(link => {
        if (currentUrl.includes(link.getAttribute('href'))) {
            link.style.background = '#bcbcbc';
            link.style.fontWeight = 'bold';
        }
    });

    // Funcionalidad de grupos colapsables
    const groupButtons = document.querySelectorAll('.sidebar-group-btn');

    groupButtons.forEach(button => {
        button.addEventListener('click', () => {
            const groupName = button.getAttribute('data-group');
            const content = document.getElementById('group-' + groupName);

            // Toggle en el contenido
            content.classList.toggle('collapsed');

            // Toggle en el botón (para la flecha)
            button.classList.toggle('collapsed');
        });
    });
});
