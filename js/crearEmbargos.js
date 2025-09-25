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

            const response = await fetch(`http://localhost:3000/api/cliente-embargos/${cedula}`);

            if (!response.ok) {
                throw new Error('Cliente no encontrado');
            }

            const cliente = await response.json();
            const nombreCompleto = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();

            // Mostrar datos básicos
            document.getElementById('clienteNombre').textContent = nombreCompleto || 'Nombre no disponible';
            document.getElementById('clienteCedula').textContent = cliente.cedula || cedula;
            document.getElementById('clienteTelefono').textContent = cliente.telefono || 'No disponible';

            // Foto de perfil
            if (cliente.foto_perfil) {
                clienteFotoPerfil.src = `http://localhost:3000${cliente.foto_perfil}`;
                clienteFotoPerfil.alt = nombreCompleto;
            } else {
                clienteFotoPerfil.src = '../assets/img/avatar.png';
            }

            // ⚠️ Si el cliente está retirado
            if (cliente.estado === 1) {
                // Agregamos badge morado
                document.getElementById('clienteNombre').innerHTML +=
                    ` <span class="badge bg-gradient-purple ms-2">Cliente Retirado</span>`;

                // Deshabilitamos botón seleccionar
                btnSeleccionar.disabled = true;
                btnSeleccionar.classList.add("btn-secondary");
                btnSeleccionar.classList.remove("btn-primary");

                resultadoDiv.classList.remove('d-none');
                sinResultadosDiv.classList.add('d-none');
                return; // 🚫 No dejamos seleccionarlo
            }

            // Si está activo
            clienteSeleccionado = cliente;
            resultadoDiv.classList.remove('d-none');
            sinResultadosDiv.classList.add('d-none');
            btnSeleccionar.disabled = false;
            btnSeleccionar.classList.add("btn-primary");
            btnSeleccionar.classList.remove("btn-secondary");
            btnSeleccionar.focus();

        } catch (error) {
            console.error('Error buscando cliente:', error);
            resultadoDiv.classList.add('d-none');
            sinResultadosDiv.classList.remove('d-none');
        } finally {
            btnBuscar.innerHTML = '<i class="fas fa-search"></i>';
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
        document.getElementById('inputPagaduria').value = cliente.pagadurias || '';
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
                window.location.href = 'embargos.html';
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

document.addEventListener('DOMContentLoaded', function () {
    const fechaRadicacionInput = document.getElementById('fecha_radicacion');
    const fechaSolicitudInput = document.getElementById('fecha_expediente');
    const fechaRevisionInput = document.getElementById('fecha_revision_exp');

    // Establecer la fecha mínima como hoy
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const dia = hoy.getDate().toString().padStart(2, '0');
    const fechaHoy = `${anio}-${mes}-${dia}`;
    fechaRadicacionInput.min = fechaHoy;

    // Función para sumar días hábiles (lunes a viernes)
    function sumarDiasHabiles(fechaInicial, cantidadDias) {
        const fecha = new Date(fechaInicial);
        let diasSumados = 0;

        while (diasSumados < cantidadDias) {
            fecha.setDate(fecha.getDate() + 1);
            const diaSemana = fecha.getDay(); // 0 = domingo, 6 = sábado
            if (diaSemana !== 0 && diaSemana !== 6) {
                diasSumados++;
            }
        }
        return fecha;
    }

    // Escuchar cambios para calcular +15 y +30 días hábiles
    fechaRadicacionInput.addEventListener('change', function () {
        const fechaRadicacion = new Date(this.value);

        if (!isNaN(fechaRadicacion.getTime())) {
            // Calcular fechas hábiles
            const fechaSolicitud = sumarDiasHabiles(fechaRadicacion, 15);
            const fechaRevision = sumarDiasHabiles(fechaRadicacion, 30);

            // Formatear y asignar
            const formatDate = (fecha) => {
                const año = fecha.getFullYear();
                const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
                const dia = fecha.getDate().toString().padStart(2, '0');
                return `${año}-${mes}-${dia}`;
            };

            fechaSolicitudInput.value = formatDate(fechaSolicitud);
            fechaRevisionInput.value = formatDate(fechaRevision);
        } else {
            fechaSolicitudInput.value = '';
            fechaRevisionInput.value = '';
        }
    });
});


const nombreAsesor = sessionStorage.getItem('nombreUsuario');
document.getElementById('asesorNombre').textContent = nombreAsesor || '---';


document.addEventListener('DOMContentLoaded', () => {

});

async function seleccionarEstadoFinal(estado) {
    const form = document.getElementById('formCrearEmbargo');
    const estadoFinalInput = document.getElementById('estado_embargo');
    const idClienteInput = document.getElementById('id_cliente');

    // Validar que el ID del cliente esté presente
    if (!idClienteInput.value) {
        return Swal.fire('Error', 'No se ha seleccionado un cliente válido', 'error');
    }

    const valorEmbargo = document.getElementById('valor_embargo').value.trim();
    const porcentaje = document.getElementById('porcentaje').value.trim();
    const juzgado = document.getElementById('juzgado').value.trim();
    const fechaRadicacion = document.getElementById('fecha_radicacion').value.trim();
    const redJudicial = document.querySelector('input[name="red_judicial"]:checked')?.value;
    const linkRedJudicial = document.getElementById('link_red_judicial').href;


    // if (!valorEmbargo) {
    //     return Swal.fire('Campo obligatorio', 'Por favor ingresa el valor del embargo.', 'warning');
    // }

    // if (!porcentaje || porcentaje < 1 || porcentaje > 100) {
    //     return Swal.fire('Campo obligatorio', 'Ingresa un porcentaje válido entre 1 y 100.', 'warning');
    // }

    // if (!juzgado) {
    //     return Swal.fire('Campo obligatorio', 'Por favor ingresa el juzgado.', 'warning');
    // }

    // if (!fechaRadicacion) {
    //     return Swal.fire('Campo obligatorio', 'Por favor selecciona la fecha de radicación.', 'warning');
    // }

    // if (!redJudicial) {
    //     return Swal.fire('Campo obligatorio', 'Por favor selecciona si aplica red judicial.', 'warning');
    // }

    // if (redJudicial === 'si' && !linkRedJudicial) {
    //     return Swal.fire('Campo obligatorio', 'Debes ingresar el link de la red judicial.', 'warning');
    // }

    // Asignar valor numérico al estado
    const estadoNumerico =
        estado === 'rechazado' ? 1 :
            estado === 'proceso' ? 2 :
                0;
    estadoFinalInput.value = estadoNumerico;

    // Crear objeto con los datos del formulario
    const formData = new FormData(form);
    const plainData = Object.fromEntries(formData.entries());

    // Agregar valores adicionales
    plainData.asesor_embargo = sessionStorage.getItem('nombreUsuario') || '---';
    plainData.pagaduria_embargo = document.getElementById('inputPagaduria').value.trim();
    plainData.porcentaje_embargo = porcentaje;
    plainData.juzgado_embargo = document.getElementById('juzgado').value.trim().toUpperCase();
    plainData.red_judicial = redJudicial === 'si' ? linkRedJudicial : '';

    plainData.estado_embargo = estadoNumerico;
    // Agregar fechas calculadas
    plainData.fecha_expediente = document.getElementById('fecha_expediente').value.trim();
    plainData.fecha_revision_exp = document.getElementById('fecha_revision_exp').value.trim();

    try {
        const response = await fetch('http://localhost:3000/api/crear-embargos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plainData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al procesar el embargo');
        }

        const resultado = await response.json();

        // Si se seleccionó subsanaciones = SI, enviar la notificación
        const subsanacionSI = document.getElementById('subsanaciones_si').checked;

        if (subsanacionSI) {
            const fechaNotificacion = document.querySelector('input[name="fecha_alarma"]').value.trim();
            const observaciones = document.querySelector('textarea[name="observaciones_alarma"]').value.trim();
            const asesor = sessionStorage.getItem('nombreUsuario') || '---';
            const idEmbargo = resultado.id_embargos;

            if (!fechaNotificacion || !observaciones) {
                return Swal.fire('Campos incompletos', 'Debes ingresar la fecha y observaciones para programar la notificación.', 'warning');
            }

            const notificacion = {
                fecha_notificacion: fechaNotificacion,
                observaciones: observaciones,
                asesor_notificacion: asesor,
                id_embargos: idEmbargo
            };

            if (!idEmbargo) {
                console.error('No se recibió un ID de embargo válido:', resultado);
                return Swal.fire('Error', 'No se pudo obtener el ID del embargo creado.', 'error');
            }

            try {


                const notifRes = await fetch('http://localhost:3000/api/notificaciones-embargos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(notificacion)
                });

                if (!notifRes.ok) {
                    throw new Error('No se pudo programar la notificación');
                }



            } catch (error) {
                console.error('Error al registrar notificación:', error);
                Swal.fire('Error', 'El embargo fue creado, pero no se pudo programar la notificación.', 'error');
            }
        }


        await Swal.fire({
            title: 'Éxito',
            text: resultado.action === 'insert'
                ? 'Nuevo embargo creado correctamente'
                : 'Embargo actualizado correctamente',
            icon: 'success'
        });

        if (estado === 'rechazado') {
            document.getElementById('btnNuevoProceso').classList.remove('d-none');
            document.getElementById('mensajeRechazo').textContent = 'Este embargo fue rechazado. Puedes crear un nuevo proceso si lo deseas.';
        } else {
            window.location.href = 'embargos.html';
        }

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: error.message || 'Error al procesar el embargo',
            icon: 'error'
        });
    }
}



function obtenerIdEmbargo() {
    return document.getElementById('detalleID').textContent.trim();
}

function formatearMoneda(input) {
    let valor = input.value.replace(/\D/g, '');
    valor = new Intl.NumberFormat('es-CO').format(valor);
    input.value = valor;
}


function mostrarDetalleSubsanaciones(mostrar) {
    const contenedor = document.getElementById('detalleSubsanacionesContainer');
    contenedor.style.display = mostrar ? 'block' : 'none';
}



document.getElementById('red_judicial_si').addEventListener('change', function () {
    const link = document.getElementById('link_red_judicial');
    document.getElementById('linkRedJudicialContainer').style.display = 'flex';

    link.href = "https://www.redjudicial.com/nuevo/";
    link.textContent = "https://www.redjudicial.com/nuevo/";
    link.style.display = 'block'; // mostrar enlace
});

document.getElementById('red_judicial_no').addEventListener('change', function () {
    const link = document.getElementById('link_red_judicial');
    document.getElementById('linkRedJudicialContainer').style.display = 'none';

    link.href = "#";
    link.textContent = "";
    link.style.display = 'none'; // ocultar enlace
});
