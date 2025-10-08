// Mapa de permisos UI
const permisosUI = {
    admin: ["permiso-admin", "permiso-embargos", "permiso-cartera" , "permiso-insolvencia"],
    controlTotal: ["permiso-admin", "permiso-embargos", "permiso-cartera", "permiso-insolvencia"],
    embargos: ["permiso-embargos"],
    cartera: ["permiso-cartera"],
    insolvencia: ["permiso-insolvencia"],
    consultante: ["solo-consulta"] // solo lectura
};


function aplicarPermisosUI() {
    const rol = sessionStorage.getItem("rol");
    const permisos = permisosUI[rol] || [];

    // Buscar todos los elementos que tengan clases de permisos
    document.querySelectorAll("[class*='permiso-'], .solo-consulta").forEach(el => {
        const clases = el.classList;

        // Si el rol no tiene ninguna clase del elemento → ocultar
        const tienePermiso = [...clases].some(clase => permisos.includes(clase));
        if (!tienePermiso) {
            el.style.display = "none";
        }
    });
}


document.addEventListener("DOMContentLoaded", aplicarPermisosUI);


// Exportar función global para usarla en otros scripts
window.aplicarPermisosUI = aplicarPermisosUI;
