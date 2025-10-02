const token = sessionStorage.getItem('token');
let resultados = '';

if (!token) {
    Swal.fire({
        title: 'Sesión expirada',
        text: 'Su sesión ha finalizado. Por favor ingrese nuevamente.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6',
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = '../pages/login.html';
        }
    });

    setTimeout(() => {
        window.location.href = '../pages/login.html';
    }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!sessionStorage.getItem('token')) {
        window.location.href = '../pages/login.html';
        return;
    }
    obtenerUsuarios();
});


async function obtenerUsuarios() {
    try {
        const token = sessionStorage.getItem('token');
        const url = 'http://localhost:3000/api/users';

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error en la solicitud');

        usuarios = await response.json();

        if (!Array.isArray(usuarios) || usuarios.length === 0) {
            Swal.fire({
                title: 'Sin registros',
                text: 'No se encontraron Clientes en la base de datos.',
                icon: 'info',
                confirmButtonText: 'Entendido',
                allowOutsideClick: false,
                allowEscapeKey: false
            });
            return;
        }

        mostrar(usuarios);

    } catch (error) {
        console.error('❌ Error en usuarios:', error);
        Swal.fire('Error', 'No se pudo obtener la información.', 'error');
    }
}



const mostrar = (usuarios) => {
    let resultados = '';

    usuarios.forEach((usuario) => {
        // Badge dinámico
        const estadoBadge = usuario.activo == 1
            ? `<span class="badge bg-success">ACTIVO</span>`
            : `<span class="badge bg-danger">INACTIVO</span>`;

        // Botón dinámico según estado
        const botonEstado = usuario.activo == 1
            ? `<button class="btn btn-md btn-danger btn-inhabilitar" data-id="${usuario.id_usuario}">
                   <i class="fas fa-user-slash"></i> Inhabilitar
               </button>`
            : `<button class="btn btn-md btn-success btn-habilitar" data-id="${usuario.id_usuario}">
                   <i class="fas fa-user-check"></i> Habilitar
               </button>`;

        // Botones de acción
        const botonesAccion = `
            <button class="btn btn-md btn-warning btn-editar" data-id="${usuario.id_usuario}">
                <i class="fas fa-edit"></i> Editar
            </button>
            ${botonEstado}
        `;

        resultados += `
        <tr>
            <td class="text-center align-middle text-uppercase"><p class="text-md text-dark mb-0">${usuario.name}</p></td>
            <td class="text-center align-middle text-uppercase"><p class="text-md text-dark mb-0">${usuario.user}</p></td>
            <td class="text-center align-middle text-uppercase"><p class="text-md text-dark mb-0">${usuario.email}</p></td>
            <td class="text-center align-middle text-uppercase"><p class="text-md text-dark mb-0">${usuario.rol}</p></td>
            <td class="text-center align-middle text-uppercase">${estadoBadge}</td>
            <td class="text-center align-middle">${botonesAccion}</td>
        </tr>
        `;
    });

    if ($.fn.DataTable.isDataTable('#tablaUsuarios')) {
        $('#tablaUsuarios').DataTable().clear().destroy();
    }

    $("#tablaUsuarios tbody").html(resultados);

    // Inicializa DataTable
    $('#tablaUsuarios').DataTable({
        pageLength: 6,
        lengthMenu: [6, 10, 25, 50, 100],
        language: {
            decimal: ",",
            thousands: ".",
            processing: "Procesando...",
            search: "Buscar:",
            sLengthMenu: "Mostrar _MENU_ registros",
            info: "Mostrando del _START_ al _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            loadingRecords: "Cargando...",
            zeroRecords: "No se encontraron registros",
            emptyTable: "No hay datos disponibles en la tabla",
            paginate: {
                first: "Primero",
                previous: "Anterior",
                next: "Siguiente",
                last: "Último"
            },
            aria: {
                sortAscending: ": activar para ordenar ascendente",
                sortDescending: ": activar para ordenar descendente"
            }
        },
        responsive: true,
        order: [[0, 'asc']],
    });
};



document.addEventListener("click", async (e) => {
    // Habilitar usuario
    if (e.target.closest(".btn-habilitar")) {
        const idUsuario = e.target.closest(".btn-habilitar").dataset.id;

        Swal.fire({
            title: '¿Estás seguro?',
            text: "El usuario será habilitado y podrá acceder nuevamente.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, habilitar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`http://localhost:3000/api/users/${idUsuario}/enable`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" }
                    });
                    const data = await res.json();

                    Swal.fire({
                        icon: 'success',
                        title: 'Habilitado',
                        text: data.message || "Usuario habilitado correctamente",
                        showConfirmButton: false,
                        timer: 1500
                    });

                    obtenerUsuarios();
                } catch (err) {
                    console.error("❌ Error:", err);
                    Swal.fire('Error', 'No se pudo habilitar el usuario.', 'error');
                }
            }
        });
    }


    // Inhabilitar usuario
    if (e.target.closest(".btn-inhabilitar")) {
        const idUsuario = e.target.closest(".btn-inhabilitar").dataset.id;

        Swal.fire({
            title: '¿Estás seguro?',
            text: "El usuario será inhabilitado y no podrá acceder.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, inhabilitar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`http://localhost:3000/api/users/${idUsuario}/disable`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" }
                    });
                    const data = await res.json();

                    Swal.fire({
                        icon: 'success',
                        title: 'Inhabilitado',
                        text: data.message || "Usuario inhabilitado correctamente",
                        showConfirmButton: false,
                        timer: 1000
                    });

                    obtenerUsuarios();
                } catch (err) {
                    console.error("❌ Error:", err);
                    Swal.fire('Error', 'No se pudo inhabilitar el usuario.', 'error');
                }
            }
        });
    }

    // Editar usuario (abrir modal)
    if (e.target.closest(".btn-editar")) {
        const idUsuario = e.target.closest(".btn-editar").dataset.id;
        try {
            const token = sessionStorage.getItem("token");

            const res = await fetch(`http://localhost:3000/api/users/${idUsuario}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                throw new Error("No tienes permisos o el token es inválido");
            }

            const usuario = await res.json();

            document.getElementById("editId").value = usuario.id_usuario;
            document.getElementById("editName").value = usuario.name;
            document.getElementById("editUser").value = usuario.user;
            document.getElementById("editEmail").value = usuario.email;
            document.getElementById("editRol").value = usuario.rol;
            document.getElementById("editPassword").value = "";

            // Abrir modal con Bootstrap 5
            const modal = new bootstrap.Modal(document.getElementById("modalEditarUsuario"));
            modal.show();
        } catch (err) {
            console.error("❌ Error cargando usuario:", err);
        }
    }

});


// Guardar cambios en el modal
document.getElementById("btnGuardarCambios").addEventListener("click", async () => {
    const id = document.getElementById("editId").value;

    const usuarioActualizado = {
        name: document.getElementById("editName").value,
        user: document.getElementById("editUser").value,
        email: document.getElementById("editEmail").value,
        rol: document.getElementById("editRol").value,
        password: document.getElementById("editPassword").value || null
    };

    try {
        const token = sessionStorage.getItem("token");

        const res = await fetch(`http://localhost:3000/api/users-updated/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(usuarioActualizado)
        });

        const data = await res.json();

        Swal.fire({
            title: '✅ Usuario actualizado',
            text: data.message || "Los cambios se guardaron correctamente",
            icon: 'success',
            showConfirmButton: false,
            timer: 1000,
            timerProgressBar: true
        }).then(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById("modalEditarUsuario"));
            modal.hide();
            obtenerUsuarios();
        });

    } catch (err) {
        console.error("❌ Error actualizando usuario:", err);
        Swal.fire({
            title: '❌ Error',
            text: 'No se pudo actualizar el usuario.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
});



document.getElementById("togglePassword").addEventListener("click", function () {
    const input = document.getElementById("editPassword");
    const icon = this.querySelector("i");

    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("bi-eye");
        icon.classList.add("bi-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("bi-eye-slash");
        icon.classList.add("bi-eye");
    }
});


const passwordInput = document.getElementById("editPassword");
const passwordCounter = document.getElementById("passwordCounter");

passwordInput.addEventListener("input", () => {
    const length = passwordInput.value.length;
    passwordCounter.textContent = `${length} / 13 Caracteres`;

    if (length >= 13) {
        passwordCounter.classList.add("text-danger");
    } else {
        passwordCounter.classList.remove("text-danger");
    }
});


// === CREAR USUARIO ===
const newPasswordInput = document.getElementById("newPassword");
const newPasswordCounter = document.getElementById("newPasswordCounter");
const newTogglePassword = document.getElementById("newTogglePassword");

if (newPasswordInput) {
    newPasswordInput.addEventListener("input", () => {
        const length = newPasswordInput.value.length;
        newPasswordCounter.textContent = `${length} / 13 Caracteres`;

        if (length >= 13) {
            newPasswordCounter.classList.add("text-danger");
        } else {
            newPasswordCounter.classList.remove("text-danger");
        }
    });

    newTogglePassword.addEventListener("click", () => {
        const type = newPasswordInput.type === "password" ? "text" : "password";
        newPasswordInput.type = type;
        newTogglePassword.innerHTML = type === "password"
            ? `<i class="fa-solid fa-eye"></i>`
            : `<i class="fa-solid fa-eye-slash"></i>`;
    });
}




document.getElementById("formCrearUsuario").addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = {
        name: document.getElementById("newName").value,
        user: document.getElementById("newUser").value,
        email: document.getElementById("newEmail").value,
        rol: document.getElementById("newRol").value,
        password: document.getElementById("newPassword").value
    };

    try {
        const token = sessionStorage.getItem("token");

        const res = await fetch("http://localhost:3000/api/users-create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // 👈 mandas el token
            },
            body: JSON.stringify(usuario)
        });

        const data = await res.json();

        if (data.status === "success") {
            Swal.fire({
                icon: "success",
                title: "¡Usuario creado!",
                text: data.message
            });
            document.getElementById("formCrearUsuario").reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById("modalCrearUsuario"));
            modal.hide();
            obtenerUsuarios(); // refresca la tabla
        } else {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: data.message || "No se pudo crear el usuario."
            });
        }

    } catch (err) {
        console.error("❌ Error creando usuario:", err);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "Hubo un problema al conectar con el servidor."
        });
    }
});
