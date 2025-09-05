document.addEventListener('DOMContentLoaded', function () {
    // Inicializar el modal una sola vez
    const modalElement = document.getElementById('modalSeleccionCliente');
    const modal = new bootstrap.Modal(modalElement);

    // Mostrar el modal automáticamente al cargar
    modal.show();

    const inputCedula = document.getElementById('inputCedula');
    const btnBuscar = document.getElementById('btnBuscarCedula');
    const resultadoDiv = document.getElementById('resultadoCliente');
    const sinResultadosDiv = document.getElementById('sinResultados');
    const btnSeleccionar = document.getElementById('btnSeleccionarCliente');
    const btnCancelar = document.getElementById('btnCancelarBusqueda');
    const clienteFotoPerfil = document.getElementById('clienteFotoPerfil');

    let clienteSeleccionado = null;

    async function buscarCliente() {
        const cedula = inputCedula.value.trim();

        if (!cedula) {
            inputCedula.focus();
            return;
        }

        try {
            // Mostrar estado de carga
            resultadoDiv.classList.add('d-none');
            sinResultadosDiv.classList.add('d-none');
            btnBuscar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
            btnBuscar.disabled = true;

            const response = await fetch(`http://localhost:3000/api/clientes-cartera/${cedula}`);

            if (!response.ok) {
                throw new Error('Cliente no encontrado');
            }

            const resJson = await response.json();
            const cliente = resJson.data;


            // Unir nombres y apellidos
            const nombreCompleto = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();

            // Mostrar resultado
            document.getElementById('clienteCartNombre').textContent = nombreCompleto || 'Nombre no disponible';
            document.getElementById('clienteCartCedula').textContent = cliente.cedula || cedula;
            document.getElementById('clienteCartTelefono').textContent = cliente.telefono || 'No disponible';

            // Mostrar foto de perfil
            if (cliente.foto_perfil) {
                clienteFotoPerfil.src = `http://localhost:3000${cliente.foto_perfil}`;
                clienteFotoPerfil.alt = nombreCompleto;
            } else {
                clienteFotoPerfil.src = '../assets/img/avatar.png';
            }

            clienteSeleccionado = cliente;

            resultadoDiv.classList.remove('d-none');
            sinResultadosDiv.classList.add('d-none');

            btnSeleccionar.focus();
        } catch (error) {
            console.error('Error buscando cliente:', error);
            resultadoDiv.classList.add('d-none');
            sinResultadosDiv.classList.remove('d-none');
        } finally {
            btnBuscar.innerHTML = '<i class="fas fa-search"></i> Buscar';
            btnBuscar.disabled = false;
        }
    }

    // Event Listeners
    btnBuscar.addEventListener('click', buscarCliente);

    inputCedula.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            buscarCliente();
        }
    });

    // Seleccionar cliente con SweetAlert2 y cierre del modal
    btnSeleccionar.addEventListener('click', async function () {
        if (clienteSeleccionado) {
            // Cerrar el modal
            modal.hide();

            // Mostrar la alerta de selección
            await Swal.fire({
                title: 'Cliente seleccionado',
                text: `${clienteSeleccionado.nombres} ${clienteSeleccionado.apellidos}`,
                icon: 'success',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Aceptar',
                timer: 2000,
                timerProgressBar: true
            });

            // ⚠️ Limpiar backdrop de Bootstrap si quedó activo
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();

            // Actualizar detalles del cliente
            actualizarDetalleCliente(clienteSeleccionado);
        }
    });



    // Función para actualizar los detalles del cliente
    function actualizarDetalleCliente(cliente) {
        const fotoPerfil = document.getElementById('detalleFotoPerfil');

        // Corregir la ruta de la foto (consistencia en mayúsculas)
        if (cliente.foto_perfil) {
            fotoPerfil.src = `http://localhost:3000${cliente.foto_perfil}`;
        } else {
            fotoPerfil.src = '../assets/img/avatar.png';
        }

        const fechaRaw = cliente.fecha_vinculo;

        if (fechaRaw) {
            const fecha = new Date(fechaRaw);
            const dia = fecha.getDate().toString().padStart(2, '0');
            const mes = fecha.toLocaleString('es-CO', { month: 'short' }).replace('.', '');
            const anio = fecha.getFullYear();
            const fechaFormateada = `${dia}/${mes.charAt(0).toUpperCase() + mes.slice(1)}/${anio}`;
            document.getElementById('detalleVinculacion').textContent = fechaFormateada;
        } else {
            document.getElementById('detalleVinculacion').textContent = '---';
        }

        // Establecer el ID del cliente en el campo hidden
        document.getElementById('id_cliente').value = cliente.id_cliente || '';

        // Mostrar datos en la interfaz
        document.getElementById('detalleID').textContent = cliente.id_cliente || '---';
        document.getElementById('detalleDocumento').textContent = cliente.cedula || '---';
        document.getElementById('detalleNombreCliente').textContent = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
        document.getElementById('detalleTelefono').textContent = cliente.telefono || '---';
        document.getElementById('detalleEmail').textContent = cliente.correo || '---';
        document.getElementById('detallePagaduria').textContent = cliente.pagadurias || '---';
        document.getElementById('detalleCiudad').textContent = cliente.ciudad || '---';
    }

    // Cancelar búsqueda con SweetAlert2 y redirección
    btnCancelar.addEventListener('click', function () {
        Swal.fire({
            title: '¿Cancelar búsqueda?',
            text: "Serás redirigido a la página de embargos",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, continuar'
        }).then((result) => {
            if (result.isConfirmed) {
                modal.hide();
                window.location.href = 'cartera.html';
            }
        });
    });

    // Limpiar al mostrar el modal
    modalElement.addEventListener('show.bs.modal', function () {
        inputCedula.value = '';
        resultadoDiv.classList.add('d-none');
        sinResultadosDiv.classList.add('d-none');
        clienteSeleccionado = null;
        clienteFotoPerfil.src = '../assets/img/avatar.png';
        inputCedula.focus();
    });
});


const nombreAsesor = sessionStorage.getItem('nombreUsuario');
document.getElementById('asesorNombre').textContent = nombreAsesor || '---';





function formatearMoneda(input) {
    let valor = input.value.replace(/\D/g, '');
    valor = new Intl.NumberFormat('es-CO').format(valor);
    input.value = valor;
}



function limpiarFormato(valor) {
    return parseFloat(valor.replace(/[^0-9]/g, '')) || 0;
}




function validarFormulario() {
    const elementosRequeridos = [
        'id_cliente',
        'monto_solicitado',
        'monto_aprobado',
        'banco',
        'negociacion'
    ];

    // Validar que los campos requeridos existan y no estén vacíos
    for (const id of elementosRequeridos) {
        const element = document.getElementById(id);
        if (!element || !element.value.trim()) {
            Swal.fire('Error', `El campo ${id.replace('_', ' ')} es requerido`, 'error');
            if (element) element.focus();
            return false;
        }
    }

    // Validaciones numéricas para montos
    const montoSolicitado = parseFloat(document.getElementById('monto_solicitado').value.replace(/\D/g, ''));
    const montoAprobado = parseFloat(document.getElementById('monto_aprobado').value.replace(/\D/g, ''));


    if (isNaN(montoAprobado) || montoAprobado <= 0) {
        Swal.fire('Error', 'El monto aprobado debe ser mayor a 0', 'error');
        return false;
    }

    // Validar banco y negociación con mínimo de caracteres
    const banco = document.getElementById('banco').value.trim();
    const negociacion = document.getElementById('negociacion').value.trim();

    if (banco.length < 3) {
        Swal.fire('Error', 'El nombre del banco debe tener al menos 3 caracteres', 'error');
        return false;
    }

    if (negociacion.length < 3) {
        Swal.fire('Error', 'La negociación debe tener al menos 3 caracteres', 'error');
        return false;
    }

    return true;
}


// Enviar formulario
document.getElementById('formCrearCredito').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validarFormulario()) {
        return;
    }

    const btnGuardar = document.getElementById('btnGuardarCredito');
    const originalText = btnGuardar.innerHTML;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
    btnGuardar.disabled = true;

    try {
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());

        // Preparar datos para enviar - CONVERSIÓN A MAYÚSCULAS Y TRIM
        const datosEnvio = {
            id_cliente: Number(data.id_cliente),  // viene oculto en el form
            monto_solicitado: Number(data.monto_solicitado.replace(/\D/g, '')),
            monto_aprobado: Number(data.monto_aprobado.replace(/\D/g, '')),
            banco: data.banco ? data.banco.trim().toUpperCase() : '',
            negociacion: data.negociacion ? data.negociacion.trim().toUpperCase() : '',
            asesor_banco: document.getElementById("asesorNombre").textContent.trim().toUpperCase() || ''
        };


        console.log('Datos a enviar:', datosEnvio);

        const response = await fetch('http://localhost:3000/api/creditos-banco/crear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosEnvio)
        });

        // Verificar si la respuesta es JSON
        const contentType = response.headers.get('content-type');
        let result;

        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            const textResponse = await response.text();
            console.error('Respuesta no JSON:', textResponse);
            throw new Error(`Error del servidor: ${response.status}`);
        }

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: result.message,
                showConfirmButton: false,
                timer: 2000
            }).then(() => {
                limpiarFormulario();
            });
        } else {
            Swal.fire('Error', result.message || 'Error al guardar el crédito', 'error');
        }

    } catch (error) {
        console.error('Error completo:', error);
        Swal.fire('Error', error.message || 'Error de conexión con el servidor', 'error');
    } finally {
        btnGuardar.innerHTML = originalText;
        btnGuardar.disabled = false;
    }
});

// Limpiar formulario
function limpiarFormulario() {
    document.getElementById('formCrearCredito').reset();
}