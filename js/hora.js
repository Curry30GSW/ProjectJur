document.addEventListener('DOMContentLoaded', function () {
    function actualizarFechaHora() {
        const opcionesFecha = {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: 'long',
            day: '2-digit'
        };

        const opcionesHora = {
            timeZone: 'America/Bogota',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };

        const ahora = new Date();
        const fecha = new Intl.DateTimeFormat('es-CO', opcionesFecha).format(ahora);
        const hora = new Intl.DateTimeFormat('es-CO', opcionesHora).format(ahora);

        const fechaActualElement = document.getElementById('fechaActual');
        if (fechaActualElement) {
            fechaActualElement.textContent = `${fecha} - ${hora}`;
        } else {
            console.error("❌ No se encontró el elemento con ID 'fechaActual'");
        }
    }

    actualizarFechaHora();

    // Actualiza cada segundo
    setInterval(actualizarFechaHora, 1000);
});


document.addEventListener("DOMContentLoaded", function () {
    let nombreCompleto = sessionStorage.getItem("nombreUsuario") || "Usuario Desconocido";
    let partes = nombreCompleto.trim().split(" ");

    let iniciales = "";
    if (partes.length >= 2) {
        iniciales = partes[0][0] + partes[1][0];
    } else {
        iniciales = partes[0][0];
    }

    document.getElementById("userInitials").textContent = iniciales.toUpperCase();
});

document.addEventListener("DOMContentLoaded", function () {
    // Crear el elemento <style>
    let style = document.createElement("style");
    style.innerHTML = `
        #userInitials {
            width: 40px;
            height: 40px;
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            border-radius: 50%;
            background-color: #ec8600ea; /* Color personalizado */
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    `;
    document.head.appendChild(style);
});

function confirmLogout() {
    Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Estás seguro que deseas cerrar tu sesión?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const nombre_usuario = sessionStorage.getItem('nombreUsuario');
            const rol = sessionStorage.getItem('rol');

            fetch('http://localhost:5000/auth/logout-auditoria', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nombre_usuario, rol }) // Solo envías estos dos
            })
                .then(res => res.json())
                .then(data => {
                    console.log('✅ Auditoría registrada:');
                })
                .catch((error) => {
                    console.error('❌ Error registrando logout:', error);
                })
                .finally(() => {
                    sessionStorage.clear();
                    localStorage.removeItem('token');
                    setTimeout(() => {
                        window.location.href = '../pages/login.html';
                    }, 500);
                });
        }
    });
}
