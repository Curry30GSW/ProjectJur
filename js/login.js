document.getElementById('btnLogin').addEventListener('click', async function () {
    const user = document.getElementById('user').value;
    const password = document.getElementById('password').value;

    if (!user || !password) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos vacíos',
            text: 'Por favor ingrese ambos campos.',
        });
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, password }),
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || data.message || 'Credenciales incorrectas.',
            });
            return;
        }


        if (data.token) {
            const nombreUsuario = data.name.trim().toUpperCase();
            const rolUsuario = data.rol;

            sessionStorage.setItem('nombreUsuario', nombreUsuario);
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('rol', rolUsuario);


            if (rolUsuario === 'Consultante') {
                sessionStorage.setItem('hideOnbush', 'true'); // Ocultar módulos
                Swal.fire({
                    icon: 'success',
                    title: 'Bienvenido',
                    html: `Inicio de sesión exitoso, <b>${nombreUsuario}</b>.`,
                    timer: 2000,
                    showConfirmButton: false,
                }).then(() => {
                    window.location.href = '/pages/home.html';
                });

            } else if (['embargos', 'controlTotal', 'admin', 'cartera', 'insolvencia'].includes(rolUsuario)) {
                sessionStorage.setItem('hideOnbush', 'false'); // No ocultar módulos
                Swal.fire({
                    icon: 'success',
                    title: 'Bienvenido',
                    html: `Inicio de sesión exitoso, <b>${nombreUsuario}</b>.`,
                    timer: 2000,
                    showConfirmButton: false,
                }).then(() => {
                    window.location.href = '/pages/home.html';
                });
            } else if (rolUsuario === 'Jefatura') {
                sessionStorage.setItem('hideOnbushTes', 'true'); // Según necesidad
                Swal.fire({
                    icon: 'success',
                    title: 'Bienvenido',
                    html: `Inicio de sesión exitoso, <b>${nombreUsuario}</b>.`,
                    timer: 2000,
                    showConfirmButton: false,
                }).then(() => {
                    window.location.href = '/pages/home.html';
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Acceso denegado',
                    text: 'No tienes permiso para ingresar.',
                });
                return;
            }

        }
    } catch (error) {
        console.error('Error en el login:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al intentar ingresar. Intente nuevamente.',
        });
    }
});


document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");
    const btnLogin = document.getElementById("btnLogin");

    form.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            btnLogin.click();
        }
    });


});
