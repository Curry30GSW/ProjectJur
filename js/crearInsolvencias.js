
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


let clienteSeleccionado = null;

document.addEventListener('DOMContentLoaded', function () {
    const paramas = new URLSearchParams(window.location.search)

    const idInsolvencia = paramas.get("id");


    // Inicializar el modal una sola vez
    const modalElement = document.getElementById('modalSeleccionCliente');
    const modal = new bootstrap.Modal(modalElement);

    if (!idInsolvencia) {
        // Mostrar el modal automáticamente al cargar
        modal.show();
    } else {
        cargarDatosEnFormulario(idInsolvencia)
    }



    const inputCedula = document.getElementById('inputCedula');
    const btnBuscar = document.getElementById('btnBuscarCedula');
    const resultadoDiv = document.getElementById('resultadoCliente');
    const sinResultadosDiv = document.getElementById('sinResultados');
    const btnSeleccionar = document.getElementById('btnSeleccionarCliente');
    const btnCancelar = document.getElementById('btnCancelarBusqueda');
    const clienteFotoPerfil = document.getElementById('clienteFotoPerfil');

    async function buscarCliente() {
        const cedula = inputCedula.value.trim();
        if (!cedula) {
            inputCedula.focus();
            return;
        }

        try {
            // Reset UI
            resultadoDiv.classList.add('d-none');
            sinResultadosDiv.classList.add('d-none');
            btnBuscar.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btnBuscar.disabled = true;

            // 🔑 Siempre habilitamos el botón antes de validar al cliente
            btnSeleccionar.disabled = false;
            btnSeleccionar.classList.remove("btn-secondary");
            btnSeleccionar.classList.add("btn-primary");

            const response = await fetch(`http://localhost:3000/api/cliente-insolvencias/${cedula}`);

            if (!response.ok) {
                throw new Error('Cliente no encontrado');
            }

            const cliente = await response.json();
            const nombreCompleto = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();

            // ⚠️ Caso cliente estado = 1
            if (cliente.estado === 1) {
                document.getElementById('clienteNombre').textContent = nombreCompleto || 'Nombre no disponible';
                document.getElementById('clienteCedula').textContent = cliente.cedula || cedula;
                document.getElementById('clienteTelefono').textContent = cliente.telefono || 'No disponible';

                if (cliente.foto_perfil) {
                    clienteFotoPerfil.src = `http://localhost:3000${cliente.foto_perfil}`;
                    clienteFotoPerfil.alt = nombreCompleto;
                } else {
                    clienteFotoPerfil.src = '../assets/img/avatar.png';
                }

                // Badge "Cliente Retirado"
                document.getElementById('clienteNombre').innerHTML +=
                    ` <span class="badge bg-gradient-purple ms-2">Cliente Retirado</span>`;

                // 🚫 Deshabilitar botón SOLO para este caso
                btnSeleccionar.disabled = true;
                btnSeleccionar.classList.add("btn-secondary");
                btnSeleccionar.classList.remove("btn-primary");

                resultadoDiv.classList.remove('d-none');
                sinResultadosDiv.classList.add('d-none');
                return;
            }

            // ✅ Cliente normal
            document.getElementById('clienteNombre').textContent = nombreCompleto || 'Nombre no disponible';
            document.getElementById('clienteCedula').textContent = cliente.cedula || cedula;
            document.getElementById('clienteTelefono').textContent = cliente.telefono || 'No disponible';

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
            console.error('Error Buscando cliente', error);
            resultadoDiv.classList.add('d-none');
            sinResultadosDiv.classList.remove('d-none');

            // 🔑 Reset botón en caso de error
            btnSeleccionar.disabled = false;
            btnSeleccionar.classList.add("btn-primary");
            btnSeleccionar.classList.remove("btn-secondary");

        } finally {
            btnBuscar.innerHTML = '<i class="fas fa-search"></i>';
            btnBuscar.disabled = false;
        }
    }




    btnBuscar.addEventListener('click', buscarCliente)
    // funciona la tecla enter
    inputCedula.addEventListener('keypress', function (e) {
        if (e.key === "Enter") {
            buscarCliente();
        }
    })


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

    function actualizarDetalleCliente(cliente) {
        const fotoPerfil = document.getElementById('fotoperfil');

        if (cliente.foto_perfil) {
            fotoPerfil.src = `http://localhost:3000${cliente.foto_perfil}`
        } else {
            fotoPerfil.src = `../assets/img/avatar.png`
        }

        const fechaRaw = cliente.fecha_vinculo;

        if (fechaRaw) {
            const fecha = new Date(fechaRaw);
            const dia = fecha.getDate().toString().padStart(2, '0');
            const mes = fecha.toLocaleString('es-CO', { month: 'short' }).replace('.', '')
            const anio = fecha.getFullYear();
            const fechaFormateada = `${dia}/${mes.charAt(0).toUpperCase() + mes.slice(1)}/${anio}`;
            document.getElementById('detalleVinculacion').textContent = fechaFormateada;

        } else {
            document.getElementById('detalleVinculacion').textContent = '---'
        }

        // id  
        document.getElementById('inputIdCliente').value = cliente.id_cliente || '';


        document.getElementById('idModal').textContent = cliente.id_cliente || '---'

        document.getElementById('detalleTipoDocumento').textContent = cliente.cedula || '---'

        document.getElementById('detalleNombreCliente').textContent = `${cliente.nombres || ' '} ${cliente.apellidos || ''}`.trim()

        document.getElementById('telefonoModal').textContent = cliente.telefono || '---'

        document.getElementById('emailModal').textContent = cliente.correo || '---';

        document.getElementById('direccionModal').textContent = cliente.direccion || '---';

        document.getElementById('ciudadModal').textContent = cliente.ciudad || '---';

        // document.getElementById('').value = cliente.pagadurias || '';

    }

    // cancelar
    btnCancelar.addEventListener('click', function () {
        Swal.fire({
            title: '¿Cancelar búsqueda?',
            text: "Serás redirigido a la página de insolvencias",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, continuar'
        }).then((result) => {
            if (result.isConfirmed) {
                modal.hide();
                window.location.href = 'insolvencias.html';
            }
        });
    });


    // limpiar
    modalElement.addEventListener('show.bs.modal', function () {
        inputCedula.value = '';
        resultadoDiv.classList.add('d-none');
        sinResultadosDiv.classList.add('d-none');
        clienteSeleccionado = null;
        clienteFotoPerfil.src = '../assets/img/avatar.png';
        inputCedula.focus();
    });

})


document.getElementById('formCrearInsolvencia').addEventListener('submit', function (e) {
    e.preventDefault();

    // Verificar si hay correcciones activas
    const tieneCorrecciones = document.querySelector('input[name="correcciones"]:checked')?.value === 'SI';


    // Obtener valores del formulario
    const nom = document.getElementById('detalleNombreCliente').textContent;
    const ced = document.getElementById('detalleTipoDocumento').textContent;

    // Obtener valores del formulario
    const id_cliente = document.getElementById('inputIdCliente').value;
    const cuadernillo = document.querySelector('input[name="cuadernillo"]:checked')?.value === 'SI' ? 1 : 0;
    const fecha_cuadernillo = document.getElementById('fecha_cuadernillo')?.value.trim() || null;
    const radicacion = document.querySelector('input[name="radicacion"]:checked')?.value === 'SI' ? 1 : 0;
    const fecha_radicacion = document.getElementById('fecha_radicacion')?.value.trim() || null;
    const correcciones = tieneCorrecciones ? document.getElementById('detalleCorrecciones').value.trim() : '';
    const archivoPDF = document.getElementById('archivoPDF').files[0];
    const archivoAutoliquidador = document.getElementById('archivoAutoliquidador')?.files[0];
    const audienciasVisibles = document.querySelector('input[name="audiencias"]:checked')?.value === 'SI';
    const tipo_proceso = document.querySelector('input[name="tipo_proceso"]:checked')?.value || '';
    const juzgado = document.getElementById('juzgado')?.value.trim() || '';
    const liquidador = document.querySelector('input[name="liquidador"]:checked')?.value === 'SI' ? 1 : 0;
    const terminacion = document.querySelector('input[name="estado"]:checked')?.value || '';
    const desprendible_estado = document.querySelector('input[name="desprendible"]:checked')?.value || '';
    const desprendiblePDF = document.getElementById('desprendiblePDF').files[0];
    const observaciones_desprendible = document.getElementById('observaciones_desprendible')?.value.trim() || '';

    // Validar campos condicionales solo si no hay correcciones

    const creada = parseInt(document.getElementById('creada').value, 10) || 0;

    if (creada === 0) {
        if (desprendible_estado) {
            if (!desprendiblePDF) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Archivo PDF requerido',
                    text: 'Debe adjuntar el PDF del desprendible para continuar.',
                    confirmButtonColor: '#d33'
                });
                return;
            }
            if (!observaciones_desprendible) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Observaciones requeridas',
                    text: 'Debe ingresar las observaciones para el desprendible.',
                    confirmButtonColor: '#d33'
                });
                return;
            }
        }
    }


    if (!tieneCorrecciones) {
        if (liquidador) {
            const nombre_liquidador = document.getElementById('nombre_liquidador')?.value.trim() || '';
            const telefono_liquidador = document.getElementById('telefono_liquidador')?.value.trim() || '';
            const correo_liquidador = document.getElementById('correo_liquidador')?.value.trim() || '';
            const pago_liquidador = document.querySelector('input[name="pago_liquidador"]:checked')?.value || '';

            if (!nombre_liquidador || !telefono_liquidador || !correo_liquidador || !pago_liquidador) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos incompletos',
                    text: 'Debes completar todos los datos del liquidador.',
                    confirmButtonColor: '#d33'
                });
                return;
            }
        }

        if (terminacion === 'NO APTO') {
            const motivo = document.getElementById('motivo')?.value.trim().toUpperCase() || '';
            if (!motivo) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Motivo requerido',
                    text: 'Debes escribir el motivo si el proceso no es apto.',
                    confirmButtonColor: '#d33'
                });
                return;
            }
        }
    }

    // Validar tamaño máximo de archivos antes de continuar
    const archivos = [
        { nombre: 'Acta de aceptación', archivo: archivoPDF },
        { nombre: 'Desprendible', archivo: desprendiblePDF },
        { nombre: 'Autoliquidador', archivo: archivoAutoliquidador }
    ];

    for (let { nombre, archivo } of archivos) {
        if (archivo && archivo.size > 5 * 1024 * 1024) { // 5 MB en bytes
            Swal.fire({
                icon: 'error',
                title: 'Archivo demasiado pesado',
                text: `El archivo "${nombre}" supera el tamaño máximo permitido de 5 MB.`,
                confirmButtonColor: '#d33'
            });
            return;
        }
    }
    // Preparar datos del desprendible
    let datosParcial = null;
    if (desprendible_estado === 'PARCIAL') {
        datosParcial = {
            salario: document.getElementById('salario')?.value || '',
            salario_total: document.getElementById('salario_total')?.value || '',
            saldo_total: document.getElementById('saldo_total')?.value || '',
            deducciones: document.getElementById('deducciones')?.value || '',
            saldo_libre: document.getElementById('saldo_libre')?.value || '',
            porcentaje: document.getElementById('porcentaje')?.value || '',
            cuota_pagar: document.getElementById('cuota_pagar')?.value || ''
        };
    } else if (desprendible_estado === 'LIMPIO') {
        datosParcial = {
            porcentaje: document.getElementById('porcentaje_limpio')?.value || '',
            cuota_pagar: document.getElementById('cuota_limpio')?.value || ''
        };
    }

    const desprendibleData = {
        estado_desprendible: desprendible_estado,
        obs_desprendible: observaciones_desprendible.toUpperCase(),
        datos_parcial: datosParcial
    };

    // Preparar FormData
    const formData = new FormData();
    formData.append('id_cliente', id_cliente);
    formData.append('cuadernillo', cuadernillo);
    if (fecha_cuadernillo) {
        formData.append('fecha_cuadernillo', fecha_cuadernillo);
    }
    formData.append('radicacion', radicacion || '');

    if (fecha_radicacion) {
        formData.append('fecha_radicacion', fecha_radicacion);
    }
    formData.append('correcciones', correcciones.toUpperCase());
    formData.append('tipo_proceso', tipo_proceso);
    formData.append('juzgado', juzgado.toUpperCase());
    formData.append('liquidador', liquidador);
    formData.append('datos_desprendible', JSON.stringify(desprendibleData));

    // Agregar archivos solo si existen
    if (archivoPDF) formData.append('archivoPDF', archivoPDF);
    if (desprendiblePDF) formData.append('desprendiblePDF', desprendiblePDF);
    if (archivoAutoliquidador) formData.append('archivoAutoliquidador', archivoAutoliquidador);

    // Procesar audiencias si están visibles
    if (audienciasVisibles) {
        const audienciasItems = document.querySelectorAll('#listaAudiencias .audiencia-item');
        const audiencias = [];

        for (const item of audienciasItems) {
            const descripcion = item.querySelector('input[name^="audiencias"][name$="[descripcion]"]').value.trim().toUpperCase();
            const fecha = item.querySelector('input[name^="audiencias"][name$="[fecha]"]').value.trim().toUpperCase();

            if (!tieneCorrecciones && (!descripcion || !fecha)) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Datos incompletos',
                    text: 'Cada audiencia debe tener descripción y fecha completas.',
                    confirmButtonColor: '#d33'
                });
                return;
            }

            audiencias.push({ descripcion, fecha });
        }

        formData.append('audiencias', JSON.stringify(audiencias));
    }

    // Agregar datos del liquidador si corresponde
    if (liquidador && !tieneCorrecciones) {
        const nombre_liquidador = document.getElementById('nombre_liquidador')?.value.trim().toUpperCase() || '';
        const telefono_liquidador = document.getElementById('telefono_liquidador')?.value.trim().toUpperCase() || '';
        const correo_liquidador = document.getElementById('correo_liquidador')?.value.trim().toUpperCase() || '';
        const pago_liquidador = document.querySelector('input[name="pago_liquidador"]:checked')?.value || '';

        formData.append('nombre_liquidador', nombre_liquidador);
        formData.append('telefono_liquidador', telefono_liquidador);
        formData.append('correo_liquidador', correo_liquidador);
        formData.append('pago_liquidador', pago_liquidador);

        if (pago_liquidador === 'SI') {
            const valor_total_pagado = document.getElementById('valor_total_pagado')?.value || '';

            const cuotas = [
                document.getElementById('cuota_1')?.value || '',
                document.getElementById('cuota_2')?.value || '',
                document.getElementById('cuota_3')?.value || '',
                document.getElementById('cuota_4')?.value || ''
            ];

            const fechas = [
                document.getElementById('fecha_1')?.value || '',
                document.getElementById('fecha_2')?.value || '',
                document.getElementById('fecha_3')?.value || '',
                document.getElementById('fecha_4')?.value || ''
            ];

            // Agregar al FormData directamente
            formData.append('valor_liquidador', valor_total_pagado);
            formData.append('cuota_1', cuotas[0]);
            formData.append('cuota_2', cuotas[1]);
            formData.append('cuota_3', cuotas[2]);
            formData.append('cuota_4', cuotas[3]);
            formData.append('fecha_1', fechas[0]);
            formData.append('fecha_2', fechas[1]);
            formData.append('fecha_3', fechas[2]);
            formData.append('fecha_4', fechas[3]);
        }
    }


    if (terminacion && terminacion.trim() !== '') {
        formData.append('terminacion', terminacion.toUpperCase());

        // Obtener fecha actual en formato YYYY-MM-DD
        const hoy = new Date();
        const fechaActual = hoy.toISOString().split('T')[0];
        formData.append('fecha_terminacion', fechaActual);
    }

    // Agregar motivo si no es apto
    if (terminacion === 'NO APTO' && !tieneCorrecciones) {
        const motivo = document.getElementById('motivo')?.value.trim().toUpperCase() || '';
        formData.append('motivo_insolvencia', motivo);
    }

    // Generar resumen para confirmación
    // Definir color dinámico del desprendible
    let colorDesprendible = "#6c757d"; // gris por defecto
    if (desprendible_estado === "DEUDAS") {
        colorDesprendible = "#dc3545"; // rojo
    } else if (desprendible_estado === "LIMPIO") {
        colorDesprendible = "#198754"; // verde
    } else if (desprendible_estado === "PARCIAL") {
        colorDesprendible = "#6c757d"; // gris
    }

    // Crear array de audiencias
    const audienciasArray = [];

    const audienciasItems = document.querySelectorAll('#listaAudiencias .audiencia-item');
    audienciasItems.forEach((item) => {
        const descripcion = item.querySelector('input[name^="audiencias"][name$="[descripcion]"]').value.trim();
        const fecha = item.querySelector('input[name^="audiencias"][name$="[fecha]"]').value.trim();

        if (descripcion && fecha) {
            audienciasArray.push({ descripcion, fecha });
        }
    });

    // Agregar al FormData
    formData.append('audiencias', JSON.stringify(audienciasArray));

    let resumen = `
            <h5>Nombre: ${nom}</h5>    <h5>Cedula: ${ced}</h5>
        <div style="font-family: Arial, sans-serif; text-align: left;
                    display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">

            <!-- Información General -->
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 10px;">
             
            <h6 style="margin: 0; color: #0d6efd;"><i class="fas fa-file-alt me-2"></i>Información General</h6>
            
            <p>
                <strong>Cuadernillo:</strong> ${cuadernillo ? 'Sí' : 'No'}<br>
                <strong>Fecha Cuadernillo:</strong> ${fecha_cuadernillo || 'N/A'}<br>
                <strong>Radicación:</strong> ${radicacion ? 'Sí' : 'No'}<br>
                <strong>Fecha Radicación:</strong> ${fecha_radicacion || 'N/A'}
            </p>
            </div>

            <!-- Documentos -->
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 10px;">
            <h6 style="margin: 0; color: #198754;"><i class="fas fa-clipboard-check me-2"></i>Documentos</h6>
            <p>
                <strong>Correcciones:</strong> ${correcciones || 'No'}<br>
                <strong>Desprendible:</strong> 
                <span style="color: ${colorDesprendible}; font-weight: bold;">
                    ${desprendible_estado}
                </span><br>
                <strong>Observaciones:</strong> ${observaciones_desprendible || 'N/A'}<br>
                ${(desprendible_estado === 'PARCIAL' || desprendible_estado === 'LIMPIO')
            ? `<strong>Cuota a Pagar:</strong> ${datosParcial?.cuota_pagar || 'N/A'}<br>`
            : ''
        }
            </p>
            </div>

            <!-- Proceso -->
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 10px;">
            <h6 style="margin: 0; color: #dc3545;"> <i class="fas fa-balance-scale me-2"></i>Proceso</h6>
            <p>
                <strong>Tipo:</strong> ${tipo_proceso}<br>
                <strong>Juzgado:</strong> ${juzgado || 'N/A'}<br>
                <strong>Estado:</strong> ${terminacion}<br>
                ${(terminacion === 'NO APTO' && !tieneCorrecciones)
            ? `<strong>Motivo:</strong> ${document.getElementById('motivo').value.trim()}<br>` : ''}
            </p>
            </div>


            <!-- Liquidador -->
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 10px;">
            <h6 style="margin: 0; color: #fd7e14;">👨‍💼 Liquidador</h6>
            <p>
                <strong>¿Hay liquidador?:</strong> ${liquidador ? 'Sí' : 'No'}<br>
                ${(liquidador && !tieneCorrecciones) ? `
                <strong>Nombre:</strong> ${document.getElementById('nombre_liquidador').value.trim()}<br>
                <strong>Teléfono:</strong> ${document.getElementById('telefono_liquidador').value.trim()}<br>
                <strong>Correo:</strong> ${document.getElementById('correo_liquidador').value.trim()}<br>
                <strong>Pago:</strong> ${document.querySelector('input[name="pago_liquidador"]:checked')?.value}<br>
                ` : ''}
            </p>
            </div>

            <!-- Audiencias (a lo ancho ocupan toda la fila) 🗓️-->
                ${audienciasArray.length > 0 ? `
            <div style="grid-column: span 2; 
                        border: 1px solid #ddd; 
                        border-radius: 8px; 
                        padding: 10px;">
            <h6 style="margin: 0; color: #6f42c1;">
                <i class="fas fa-gavel me-2"></i>Audiencias
            </h6>

            <ul style="margin-right: 20px;">
                ${audienciasArray.map(a => `<li><strong>${a.descripcion}</strong> <p> <strong>Fecha:</strong> ${a.fecha}</p></li>`).join('')}
            </ul>
        </div>
        ` :
            ` <div style="grid-column: span 2; border: 1px solid #ddd; border-radius: 8px; padding: 10px;">
                    <h5 style="margin:0; color: #207a93ff;" ><i class="fas fa-gavel me-2"></i>Audiencias</h5>
                    <p class="fw-bold">No hay audiencias Disponibles</p>         
            </div> `
        }
        </div>
        `;


    // Mostrar confirmación antes de enviar
    Swal.fire({
        title: '<span style="color:#0d6efd"; font-size:20px> ¿Confirmar envío?</span>',
        html: `<div style="max-height: 60vh; overflow-y: auto;">${resumen}</div>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        focusCancel: false,  // ← Esta propiedad evita que Cancelar esté enfocado
        width: '800px',
        backgroundColor: '#ffffff',
        buttonsStyling: false,
        reverseButtons: true,
        customClass: {
            popup: 'swal2-shadow',
            title: 'my-title',
            confirmButton: 'custom-confirm',
            cancelButton: 'custom-cancel',
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Mostrar carga mientras se envía
            Swal.fire({
                title: 'Enviando datos...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Ver qué contiene el formData antes de enviarlo
            for (const [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }

            // Enviar datos al servidor
            fetch('http://localhost:3000/api/actualizar-insolvencias', {
                method: 'PUT',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    Swal.close();
                    if (data.success) {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Guardado!',
                            text: 'Los datos se guardaron correctamente.',
                            confirmButtonColor: '#3085d6',
                            timer: '1700',
                            showConfirmButton: true,
                            allowOutsideClick: true,
                            allowEscapeKey: true
                        })
                            .then(() => {

                                // const modal = bootstrap.Modal.getInstance(document.getElementById('modalCrearInsolvencia'));
                                // if (modal) modal.hide();
                                // location.href = 'insolvencias.html'
                            });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: data.message || 'Hubo un problema al guardar los datos.',
                            confirmButtonColor: '#d33'
                        });
                    }
                })
                .catch(error => {
                    Swal.close();
                    console.error('Error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de conexión',
                        text: 'No se pudo conectar con el servidor.',
                        confirmButtonColor: '#d33'
                    });
                });
        }
    });
});


document.getElementById('btnCerrar').addEventListener('click', () => {
    Swal.fire({
        icon: 'warning',
        title: 'Advertencia!',
        text: 'Estas, seguro de salir?',
        confirmButtonColor: '#3085d6',
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar',

    }).then((result) => {
        // Cerrar modal y recargar si es necesario
        // const modal = bootstrap.Modal.getInstance(document.getElementById('modalCrearInsolvencia'));
        // if (modal) modal.hide();
        // location.reload(); // Opcional: recargar la página
        if (result.isConfirmed) {
            location.href = 'insolvencias.html'
        }
    });

})




// Función para toggle de tarjetas
function toggleCard(element) {
    const card = element.closest('.toggle-card');
    card.classList.toggle('active');
}

// Mostrar nombre de archivo seleccionado
document.getElementById('archivoPDF').addEventListener('change', function (e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : 'Ningún archivo seleccionado';
    document.getElementById('fileNameDisplay').textContent = fileName;
});



//Audiencias
function agregarAudiencia() {
    const lista = document.getElementById('listaAudiencias');
    const contadorAudiencias = lista.children.length + 1;
    const nuevoId = 'audiencia_' + contadorAudiencias;

    const nuevaAudiencia = document.createElement('div');
    nuevaAudiencia.className = 'audiencia-item mb-2';
    nuevaAudiencia.id = nuevoId;
    nuevaAudiencia.innerHTML = `
      <div class="row g-2">
        <div class="col-md-7">
          <input type="text" class="form-control form-control-lg" 
                 name="audiencias[][descripcion]" 
                 value="Audiencia ${contadorAudiencias}" required>
        </div>
        <div class="col-md-4">
          <input type="date" class="form-control form-control-lg" 
                 name="audiencias[][fecha]" required>
        </div>
        <div class="col-md-1">
            <button type="button" class="btn btn-md btn-danger w-100" onclick="eliminarAudiencia('${nuevoId}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
      </div>
    `;

    lista.appendChild(nuevaAudiencia);
    renumerarAudiencias();
}

function eliminarAudiencia(id) {
    Swal.fire({
        title: '¿Eliminar audiencia?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-trash me-1"></i> Eliminar',
        cancelButtonText: '<i class="fas fa-times me-1"></i> Cancelar',
        customClass: {
            confirmButton: 'btn btn-danger me-2',
            cancelButton: 'btn btn-secondary ms-2'
        },
        buttonsStyling: false
    }).then((result) => {
        if (result.isConfirmed) {
            document.getElementById(id).remove();
            renumerarAudiencias();
        }
    });
}

function renumerarAudiencias() {
    const lista = document.getElementById('listaAudiencias').children;
    Array.from(lista).forEach((audiencia, index) => {
        const inputDescripcion = audiencia.querySelector('input[type="text"]');
        inputDescripcion.value = `Audiencia ${index + 1}`;
    });
}

function mostrarAudiencias() {
    document.getElementById('contenedorAudiencias').style.display = 'block';
    if (document.getElementById('listaAudiencias').children.length === 0) {
        agregarAudiencia();
    }
}

function ocultarAudiencias() {
    document.getElementById('contenedorAudiencias').style.display = 'none';
    document.getElementById('listaAudiencias').innerHTML = '';
}

function renderizarAudiencias(audiencias) {
    const contenedor = document.getElementById('listaAudiencias');
    contenedor.innerHTML = '';

    audiencias.forEach((audiencia, index) => {
        const item = document.createElement('div');
        item.classList.add('audiencia-item');
        item.innerHTML = `
            <input type="text" name="audiencias[${index}][descripcion]" value="${audiencia.descripcion}" placeholder="Descripción" class="form-control mb-2">
            <input type="date" name="audiencias[${index}][fecha]" value="${audiencia.fecha}" class="form-control mb-3">
        `;
        contenedor.appendChild(item);
    });
}


// mostrar la fecha  cuadernillo y radicacion
function mostrarFecha(tipo, mostrar) {
    const container = document.getElementById(`fecha_${tipo}_container`);
    if (container) {
        container.style.display = mostrar ? 'block' : 'none';
    }
}



// Función para deshabilitar un elemento y su label asociado
function deshabilitarElemento(elemento) {
    if (!elemento) return;

    elemento.disabled = true;

    // Manejo especial para radios/checkboxes
    if (elemento.type === "radio" || elemento.type === "checkbox") {
        elemento.onclick = function (e) { e.preventDefault(); return false; };
        const label = document.querySelector(`label[for="${elemento.id}"]`);
        if (label) {
            label.classList.add('disabled-field');
            label.style.pointerEvents = 'none';
        }
    }

    // Manejo especial para file inputs
    if (elemento.type === "file") {
        const label = document.querySelector(`label[for="${elemento.id}"]`);
        if (label) {
            label.classList.add('disabled-field');
            label.style.pointerEvents = 'none';
        }
    }
}

// Función para habilitar un elemento y su label asociado
function habilitarElemento(elemento) {
    if (!elemento) return;

    elemento.disabled = false;

    if (elemento.type === "radio" || elemento.type === "checkbox") {
        elemento.onclick = null;
        const label = document.querySelector(`label[for="${elemento.id}"]`);
        if (label) {
            label.classList.remove('disabled-field');
            label.style.pointerEvents = '';
        }
    }

    if (elemento.type === "file") {
        const label = document.querySelector(`label[for="${elemento.id}"]`);
        if (label) {
            label.classList.remove('disabled-field');
            label.style.pointerEvents = '';
        }
    }
}



// Otras funciones existentes
function mostrarCampoCorrecciones() {


    // Mostrar el textarea de correcciones
    const campoCorrecciones = document.getElementById("campoDetalleCorrecciones");
    if (campoCorrecciones) {
        campoCorrecciones.style.display = "block";
    }
    //  else {
    //     console.error("No se encontró el elemento con ID 'campoDetalleCorrecciones'");
    // }

    // Deshabilitar todos los campos especificados
    CAMPOS_A_DESHABILITAR.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) deshabilitarElemento(elemento);
    });

    // Dentro de mostrarCampoCorrecciones()
    // CAMPOS_LIQUIDADOR.forEach(id => {
    //     const elemento = document.getElementById(id);
    //     if (elemento) {
    //         deshabilitarElemento(elemento);
    //     }
    // });

}


// Ocultar campo de correcciones y habilitar otros campos
function ocultarCampoCorrecciones() {


    // Ocultar el textarea de correcciones
    const campoCorrecciones = document.getElementById("campoDetalleCorrecciones");
    if (campoCorrecciones) {
        campoCorrecciones.style.display = "none";
        document.getElementById("detalleCorrecciones").value = "";
    }

    // Habilitar todos los campos especificados
    CAMPOS_A_DESHABILITAR.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            habilitarElemento(elemento);
        }
    });
    inicializarLiquidador();

    // 🔑 Restaurar listeners de Liquidador después de habilitar
    // const liquidadorSi = document.getElementById("liquidador_si");
    // const liquidadorNo = document.getElementById("liquidador_no");

    // if (liquidadorSi) {
    //     liquidadorSi.onchange = () => mostrarDatosLiquidador(true);
    // }
    // if (liquidadorNo) {
    //     liquidadorNo.onchange = () => mostrarDatosLiquidador(false);
    // }
}


function actualizarCalculadoraDesprendible(estado, clienteSeleccionado) {
    const calculadoraParcial = document.getElementById('calculadora-parcial');
    const calculadoraLimpio = document.getElementById('calculadora-limpio');

    // Ocultar ambas secciones primero
    calculadoraParcial.style.display = 'none';
    calculadoraLimpio.style.display = 'none';

    if (!clienteSeleccionado) return;

    if (estado === 'PARCIAL') {
        calculadoraParcial.style.display = 'block';

        const sal = clienteSeleccionado.salario || 0;   // salario viene del JSON
        const cuota = clienteSeleccionado.valor_cuota || 0;

        // Salario Total (el que reemplaza a "salario")
        const inputSalarioTotal = document.getElementById('salario_total');
        inputSalarioTotal.value = formatCurrency(sal);
        inputSalarioTotal.dataset.valor = sal;

        // Cuota a Pagar (se recalculará, pero inicializamos con lo que venga del JSON)
        const inputCuota = document.getElementById('cuota_pagar');
        inputCuota.value = formatCurrency(cuota);
        inputCuota.dataset.valor = cuota;

        // Recalcular automáticamente
        calcular();

    } else if (estado === 'LIMPIO') {
        calculadoraLimpio.style.display = 'block';

        const porcentaje = parseFloat(
            (clienteSeleccionado.porcentaje || '0').toString().replace('%', '').trim()
        ) || 0;
        const cuota = parseFloat(
            (clienteSeleccionado.valor_cuota || '0').toString().replace(/[^\d.-]/g, '')
        ) || 0;

        // Porcentaje
        const inputPorcentaje = document.getElementById('porcentaje_limpio');
        inputPorcentaje.value = porcentaje + ' %';
        inputPorcentaje.dataset.valor = porcentaje;

        // Cuota
        const inputCuotaLimpio = document.getElementById('cuota_limpio');
        inputCuotaLimpio.value = formatCurrency(cuota);
        inputCuotaLimpio.dataset.valor = cuota;
    } else {
        console.log('Otro estado:', estado);
    }
}


function validarPorcentaje(input) {
    // Obtener el valor actual
    let valorTexto = input.value;

    // Patrón regex que solo permite números y un punto decimal opcional
    const patronValido = /^-?\d*\.?\d*$/;

    // Si el valor contiene caracteres no permitidos, limpiarlo
    if (!patronValido.test(valorTexto)) {
        // Remover todos los caracteres excepto números y punto
        valorTexto = valorTexto.replace(/[^\d.]/g, '');

        // Remover puntos decimales adicionales
        const partes = valorTexto.split('.');
        if (partes.length > 2) {
            valorTexto = partes[0] + '.' + partes.slice(1).join('');
        }

        // Aplicar el valor limpio
        input.value = valorTexto;
    }

    // Eliminar el signo negativo si existe
    if (valorTexto.startsWith('-')) {
        valorTexto = valorTexto.substring(1);
        input.value = valorTexto;
    }

    // Eliminar el signo positivo si existe
    if (valorTexto.startsWith('+')) {
        valorTexto = valorTexto.substring(1);
        input.value = valorTexto;
    }

    // Convertir a número para validar rango
    let valor = parseFloat(valorTexto);

    // Si está vacío o no es un número, salir
    if (isNaN(valor)) {
        input.classList.remove('is-invalid', 'is-valid');
        return;
    }

    // Validar rango
    if (valor < 0) {
        input.value = 0;
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        mostrarAlertaPorcentaje('El porcentaje no puede ser menor a 0%', 'warning');
    } else if (valor > 100) {
        input.value = 100;
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        mostrarAlertaPorcentaje('El porcentaje no puede ser mayor a 100%', 'warning');
    } else {
        input.classList.add('is-valid');
        input.classList.remove('is-invalid');
    }

    // Recalcular si es necesario
    if (document.getElementById('desprendible_parcial')?.checked) {
        calcular();
    }
}

function mostrarAlertaPorcentaje(mensaje, tipo = "warning") {
    //
    const toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }

    });


    toast.fire({
        icon: tipo,
        title: mensaje
    })
}



// posible botones de estado desprendible

const radioParcial = document.getElementById("desprendible_parcial");
const radioOtros = document.querySelectorAll('input[name="desprendible"]:not(#desprendible_parcial)');
const seccionParcial = document.getElementById("calculadora-parcial");
const radioLimpio = document.getElementById("desprendible_limpio");
const seccionLimpio = document.getElementById("calculadora-limpio");
document.querySelectorAll('input[name="desprendible"]').forEach(radio => {
    radio.addEventListener('change', function () {
        if (clienteSeleccionado) {
            actualizarCalculadoraDesprendible(this.value, clienteSeleccionado);
        }
    });
});


const salario_total = document.getElementById("salario_total");
const saldo_total = document.getElementById("saldo_total");
const deducciones = document.getElementById("deducciones");
const saldo_libre = document.getElementById("saldo_libre");
const porcentaje = document.getElementById("porcentaje");
const cuota_pagar = document.getElementById("cuota_pagar");

function limpiarNumero(valor) {
    return valor.replace(/\D/g, '');
}

function formatearMonedaVisual(input) {
    const crudo = limpiarNumero(input.value);
    input.dataset.valor = crudo;

    if (crudo) {
        input.value = new Intl.NumberFormat('es-CO').format(crudo);
    } else {
        input.value = '';
    }
}

function capturarValorCrudo(input) {
    const crudo = limpiarNumero(input.value);
    input.dataset.valor = crudo;
}

function formatCurrency(value) {
    const number = parseFloat(value);
    if (isNaN(number)) return "";
    return '$' + number.toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

function unformatCurrency(value) {
    if (typeof value !== 'string') {
        const n = Number(value);
        return isNaN(n) ? 0 : n;
    }
    let cleaned = value.replace(/\s/g, '').replace(/[^\d.,-]/g, '');

    cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');

    // 3) Parsear número
    const number = parseFloat(cleaned);
    return isNaN(number) ? 0 : number;
}


function calcular() {
    // Tomar el salario total desde el dataset
    const sal_total = parseFloat(salario_total.dataset.valor || 0);

    // Deducciones y porcentaje
    const ded = unformatCurrency(deducciones.value);
    const porc = parseFloat(porcentaje.value) || 0;

    // Salario Total
    salario_total.value = formatCurrency(sal_total);
    salario_total.style.color = sal_total < 0 ? 'red' : 'inherit';

    // Saldo Total = mitad del salario total
    const saldo = sal_total / 2;
    saldo_total.value = formatCurrency(saldo);
    saldo_total.style.color = saldo < 0 ? 'red' : 'inherit';

    // Saldo Libre = saldo total - deducciones
    const libre = saldo - ded;
    saldo_libre.value = formatCurrency(libre);
    saldo_libre.style.color = libre < 0 ? 'red' : 'inherit';

    // Cuota a Pagar = (saldo libre * porcentaje) / 100
    const cuota = (libre * porc) / 100;
    cuota_pagar.value = formatCurrency(cuota);
    cuota_pagar.style.color = cuota < 0 ? 'red' : 'inherit';
}


function applyCurrencyFormatting(input) {
    input.addEventListener("input", () => {
        // Obtener solo los números
        let raw = input.value.replace(/\D/g, '');
        input.dataset.valor = raw;

        if (raw) {
            input.value = formatCurrency(raw);

            // Mover el cursor al final
            setTimeout(() => {
                input.selectionStart = input.selectionEnd = input.value.length;
            }, 0);
        } else {
            input.value = '';
        }

        calcular();
    });

    // Inicializar si hay valor al cargar
    const initialRaw = input.value.replace(/\D/g, '');
    input.dataset.valor = initialRaw;
    if (initialRaw) {
        input.value = formatCurrency(initialRaw);
    }
}



[deducciones].forEach(applyCurrencyFormatting);

// Recalcular cuando cambie el porcentaje
porcentaje.addEventListener("input", calcular);

// Mostrar la sección PARCIAL si se selecciona el radio
radioParcial.addEventListener("change", () => {
    if (radioParcial.checked) {
        seccionParcial.style.display = "block";
        calcular(); // recalcular en caso de que ya exista salario_total
    }
});


radioOtros.forEach(radio => {
    radio.addEventListener("change", () => {
        seccionParcial.style.display = "none";
    });
});

function mostrarFecha(tipo, mostrar) {
    const container = document.getElementById(`fecha_${tipo}_container`);
    if (container) {
        container.style.display = mostrar ? 'block' : 'none';
    }
}


// contador de observaciones
document.addEventListener('DOMContentLoaded', function () {
    const textarea = document.getElementById('observaciones_desprendible');
    const contador = document.getElementById('contadorCaracteres')


    if (textarea && contador) {
        textarea.addEventListener('input', function () {
            const caracteres = this.value.length;

            contador.textContent = caracteres;

            // validaciones
            if (caracteres > 150) {
                contador.className = 'text-danger'
            } else if (caracteres > 100) {

                contador.className = 'text-warning'
            } else {
                contador.className = 'text-muted';
            }
        })
    }

    const textareaCorrecciones = document.getElementById('detalleCorrecciones');
    const contadorCorrecciones = document.getElementById('contadorCorrecciones');

    if (textareaCorrecciones && contadorCorrecciones) {
        textareaCorrecciones.addEventListener('input', function () {
            const caracteres = this.value.length;
            contadorCorrecciones.textContent = caracteres;

            // Cambiar estilo si se acerca al límite
            if (caracteres > 290) {

                contadorCorrecciones.className = 'text-danger';
            } else if (caracteres > 250) {
                contadorCorrecciones.className = 'text-warning';
            } else {
                contadorCorrecciones.className = 'text-muted';
            }
        });
    }

    const textareaMotivos = document.getElementById('motivo');
    const contadorMotivos = document.getElementById('contadorMotivo');

    if (textareaMotivos && contadorMotivos) {
        textareaMotivos.addEventListener('input', function () {
            const caracteres = this.value.length;
            contadorMotivos.textContent = caracteres;

            // Cambiar estilo si se acerca al límite
            if (caracteres > 150) {
                contadorMotivos.className = 'text-danger';
            } else if (caracteres > 100) {

                contadorMotivos.className = 'text-warning';
            } else {
                contadorMotivos.className = 'text-muted';
            }
        });
    }

    const estadoApto = document.getElementById("estado_apto");
    const estadoNoApto = document.getElementById("estado_no_apto");
    const motivo = document.getElementById("motivo_no_apto");

    if (estadoApto && estadoNoApto && motivo) {
        estadoApto.addEventListener("change", () => {
            motivo.style.display = "none";
        });

        estadoNoApto.addEventListener("change", () => {
            motivo.style.display = "block";
        });
    }
})




let datosOriginalesParcial = {};
// cargar posible datos editar]
function cargarDatosEnFormulario(cliente) {

    document.getElementById('creada').value = cliente.creada ?? 0;


    // Datos básicos del cliente (ya funcionan)
    document.getElementById('idModal').textContent = cliente.id_cliente || '---';
    document.getElementById('inputIdCliente').value = cliente.id_cliente || '';
    const nombreCompleto = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
    document.getElementById('detalleNombreCliente').textContent = nombreCompleto || '---';
    document.getElementById('detalleTipoDocumento').textContent = cliente.cedula ? `Cédula: ${cliente.cedula}` : '---';
    document.getElementById('telefonoModal').textContent = cliente.telefono || '---';
    document.getElementById('emailModal').textContent = cliente.correo || '---';
    document.getElementById('direccionModal').textContent = cliente.direccion || '---';
    document.getElementById('ciudadModal').textContent = cliente.ciudad || '---';
    const fechaVinculo = cliente.fecha_vinculo ? new Date(cliente.fecha_vinculo).toLocaleDateString() : '---';
    document.getElementById('detalleVinculacion').textContent = fechaVinculo;

    // Foto de perfil
    const foto = document.getElementById('fotoperfil');
    if (foto) {
        foto.src = cliente.foto_perfil ? `http://localhost:3000${cliente.foto_perfil}` : '../assets/img/avatar.png';
        foto.onerror = function () {
            this.src = '../assets/img/avatar.png';
        };
    }

    // Cuadernillo y Radicación con fechas
    const cuadernilloValor = cliente.cuadernillo ? 'SI' : 'NO';
    document.querySelector(`input[name="cuadernillo"][value="${cuadernilloValor}"]`).checked = true;

    if (cliente.cuadernillo) {
        const fechaCuadernilloInput = document.getElementById('fecha_cuadernillo');
        document.getElementById('fecha_cuadernillo_container').style.display = 'block';

        if (cliente.fecha_cuadernillo) {
            // Si ya existe fecha en BD: mostrar como solo lectura
            fechaCuadernilloInput.value = cliente.fecha_cuadernillo.split('T')[0];
            fechaCuadernilloInput.readOnly = true;
            fechaCuadernilloInput.style.backgroundColor = '#e9ecef';
        } else {
            // Si no hay fecha en BD: dejar editable para nueva fecha
            fechaCuadernilloInput.value = '';
            fechaCuadernilloInput.readOnly = false;
            fechaCuadernilloInput.style.backgroundColor = '';
        }
    }

    const radicacionValor = cliente.radicacion ? 'SI' : 'NO';
    document.querySelector(`input[name="radicacion"][value="${radicacionValor}"]`).checked = true;

    if (cliente.radicacion) {
        const fechaRadicacionInput = document.getElementById('fecha_radicacion');
        document.getElementById('fecha_radicacion_container').style.display = 'block';

        if (cliente.fecha_radicacion) {
            // Si ya existe fecha en BD: mostrar como solo lectura
            fechaRadicacionInput.value = cliente.fecha_radicacion.split('T')[0];
            fechaRadicacionInput.readOnly = true;
            fechaRadicacionInput.style.backgroundColor = '#e9ecef';
        } else {
            // Si no hay fecha en BD: dejar editable para nueva fecha
            fechaRadicacionInput.value = '';
            fechaRadicacionInput.readOnly = false;
            fechaRadicacionInput.style.backgroundColor = '';
        }
    }

    // Correcciones
    if (cliente.correcciones && cliente.correcciones.trim() !== '') {
        document.querySelector(`input[name="correcciones"][value="SI"]`).checked = true;
        document.getElementById('detalleCorrecciones').value = cliente.correcciones;
        document.getElementById('campoDetalleCorrecciones').style.display = 'block';
    } else {
        document.querySelector(`input[name="correcciones"][value="NO"]`).checked = true;
    }



    datosOriginalesParcial = {
        salario: cliente.salario || '',
        cuota_pagar: cliente.valor_cuota || ''
    };



    if (cliente.estado_desprendible) {
        document.querySelector(`input[name="desprendible"][value="${cliente.estado_desprendible}"]`).checked = true;
        document.querySelector(`input[name="desprendible"][value="${cliente.estado_desprendible}"]`).dispatchEvent(new Event('change'));
    }

    // Primero asigna listener a radios
    document.querySelectorAll('input[name="desprendible"]').forEach((radio) => {
        radio.addEventListener('change', (e) => {
            actualizarCalculadoraDesprendible(e.target.value, cliente);
        });
    });

    // Luego, al cargar datos en el formulario
    if (cliente.estado_desprendible) {
        document.querySelector(`input[name="desprendible"][value="${cliente.estado_desprendible}"]`).checked = true;
        actualizarCalculadoraDesprendible(cliente.estado_desprendible, cliente);
    }

    // Mostrar nombre del archivo de desprendible si existe
    if (cliente.ruta_desprendible) {
        const fileName = cliente.ruta_desprendible.split('/').pop();
        document.getElementById('desprendibleFileNameDisplay').textContent = fileName;
        document.getElementById('desprendiblePDFUrl').value = cliente.ruta_desprendible;
    }

    // Observaciones del desprendible
    if (cliente.obs_desprendible) {
        document.getElementById('observaciones_desprendible').value = cliente.obs_desprendible;
    }

    // Cuota a pagar
    if (cliente.cuota_pagar) {
        document.getElementById('cuota_pagar').value = cliente.cuota_pagar;
    }

    // Tipo de proceso
    if (cliente.tipo_proceso) {
        document.querySelector(`input[name="tipo_proceso"][value="${cliente.tipo_proceso}"]`).checked = true;
    }

    // Juzgado
    document.getElementById('juzgado').value = cliente.juzgado || '';

    // Autoliquidador: mostrar nombre del archivo y enlace si existe
    if (cliente.autoliquidador) {
        const fileName = cliente.autoliquidador.split('/').pop();
        document.getElementById('fileNameDisplayAutoliquidador').textContent = fileName;
        document.getElementById('archivoAutoliquidadorUrl').value = cliente.ruta_autoliquidador;

        const filePreview = document.getElementById('filePreviewAutoliquidador');
        filePreview.innerHTML = `
            <a href="http://localhost:3000${cliente.autoliquidador}" target="_blank" class="btn btn-md btn-outline-info mt-2">
                <i class="fas fa-eye me-1"></i> Ver archivo
            </a>
        `;
    }

    // Estado del proceso
    if (cliente.terminacion) {
        document.querySelector(`input[name="estado"][value="${cliente.terminacion}"]`).checked = true;
        if (cliente.terminacion === 'NO APTO' && cliente.motivo_insolvencia) {
            document.getElementById('motivo').value = cliente.motivo_insolvencia;
            document.getElementById('motivo_no_apto').style.display = 'block';
        }
    }

    // Acta de aceptación
    if (cliente.acta_aceptacion) {
        const fileName = cliente.acta_aceptacion.split('/').pop();
        document.getElementById('fileNameDisplay').textContent = fileName;
        document.getElementById('archivoPDFUrl').value = cliente.acta_aceptacion;
    }

    // Cargar audiencias
    if (cliente.audiencias && cliente.audiencias.length > 0) {
        // Activar el botón de "Sí"
        document.getElementById('audiencias_si').checked = true;
        document.getElementById('audiencias_no').disabled = true; // ⛔ Deshabilitar el "No"
        mostrarAudiencias();

        // Limpiar audiencias anteriores
        const listaAudiencias = document.getElementById('listaAudiencias');
        listaAudiencias.innerHTML = '';

        cliente.audiencias.forEach((audienciaObj, index) => {
            const div = document.createElement('div');
            div.classList.add('mb-2');

            const audiencia = audienciaObj.audiencia || '---';
            const fecha = audienciaObj.fecha_audiencias
                ? new Date(audienciaObj.fecha_audiencias).toLocaleDateString()
                : '---';

            div.innerHTML = `
                <div class="border rounded p-2 bg-light">
                    <strong>Audiencia:</strong> ${audiencia}<br>
                    <strong>Fecha:</strong> ${fecha}
                </div>
            `;

            listaAudiencias.appendChild(div);
        });
    } else {
        document.getElementById('audiencias_no').checked = true;
        document.getElementById('audiencias_no').disabled = false;
        ocultarAudiencias();
    }

    // Liquidador
    if (cliente.nombre_liquidador || cliente.telefono_liquidador || cliente.correo_liquidador) {
        // Marcar "Sí"
        document.getElementById('liquidador_si').checked = true;
        mostrarDatosLiquidador(true); // Muestra los campos del liquidador

        document.getElementById('nombre_liquidador').value = cliente.nombre_liquidador || '';
        document.getElementById('telefono_liquidador').value = cliente.telefono_liquidador || '';
        document.getElementById('correo_liquidador').value = cliente.correo_liquidador || '';

        if (cliente.pago_liquidador && cliente.pago_liquidador.toUpperCase() === 'SI') {
            document.getElementById('pago_si').checked = true;

            // Mostrar la sección de cuotas automáticamente si ya se pagó
            document.getElementById('cuotas_pago').style.display = 'block';
            document.getElementById('valor_total_pagado').value = cliente.valor_liquidador || '';

            for (let i = 1; i <= 4; i++) {
                document.getElementById(`cuota_${i}`).value = cliente[`cuota_${i}`] || '';
                if (cliente[`fecha_${i}`]) {
                    document.getElementById(`fecha_${i}`).value = new Date(cliente[`fecha_${i}`]).toISOString().split('T')[0];
                }
            }

        } else if (cliente.pago_liquidador && cliente.pago_liquidador.toUpperCase() === 'NO') {
            document.getElementById('pago_no').checked = true;
        }


    } else {
        document.getElementById('liquidador_no').checked = true;
        mostrarDatosLiquidador(false); // Oculta los campos
    }

    // Mostrar visualmente el archivo del desprendible
    if (cliente.ruta_desprendible) {
        const filePreview = document.getElementById('filePreviewDesprendible');
        filePreview.innerHTML = `
        <a href="http://localhost:3000${cliente.ruta_desprendible}" target="_blank" class="btn btn-outline-info btn-md" title="Ver desprendible">
            <i class="fas fa-eye"></i> Ver Desprendible
        </a>
    `;
    }

    // Mostrar visualmente el archivo del acta de aceptación
    if (cliente.acta_aceptacion) {
        const filePreview = document.getElementById('filePreviewActa');
        filePreview.innerHTML = `
        <a href="http://localhost:3000${cliente.acta_aceptacion}" target="_blank" class="btn btn-outline-info btn-md" title="Ver acta de aceptación">
            <i class="fas fa-eye"></i> Ver Acta
        </a>
    `;
    }

    inicializarCorrecciones();


}


function mostrarDatosLiquidador(mostrar) {
    // document.getElementById('datos_liquidador').style.display = mostrar ? 'block' : 'none';

    const datos = document.getElementById('datos_liquidador');
    if (datos) {
        datos.style.display = mostrar ? 'block' : 'none';
    }
}

function inicializarLiquidador() {
    const liquidadorSi = document.getElementById("liquidador_si");
    const liquidadorNo = document.getElementById("liquidador_no");

    if (liquidadorSi) {
        liquidadorSi.onchange = () => mostrarDatosLiquidador(true);
    }
    if (liquidadorNo) {
        liquidadorNo.onchange = () => mostrarDatosLiquidador(false);
    }

    // Mostrar/ocultar según lo marcado
    if (liquidadorSi && liquidadorSi.checked) {
        mostrarDatosLiquidador(true);
    } else if (liquidadorNo && liquidadorNo.checked) {
        mostrarDatosLiquidador(false);
    } else {
        mostrarDatosLiquidador(false);
    }
}

function actualizarBotonPDF(elementId, url, textoBoton) {
    const elemento = document.getElementById(elementId);
    if (url) {
        const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
        elemento.innerHTML = `
            <a href="${fullUrl}" target="_blank" class="btn btn-danger btn-lg">
                <i class="fas fa-file-pdf me-1"></i> ${textoBoton}
            </a>
        `;
    } else {
        elemento.innerHTML = '<span class="text-muted">No hay documento adjunto</span>';
    }
}

function mostrarError(mensaje) {
    console.error(mensaje);
    alert(mensaje);
}


function mostrarMotivo(mostrar) {
    document.getElementById('motivo_no_apto').style.display = mostrar ? 'block' : 'none';
}




let esEdicion = false; // por defecto crear
let idInsolvenciaGlobal = null;


document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (id) {
        esEdicion = true; // 🚨 estamos editando
        idInsolvenciaGlobal = id;

        try {
            const res = await fetch(`http://localhost:3000/api/insolvencia/id/${id}`);
            const json = await res.json();
            if (json.success && json.data) {
                cargarDatosEnFormulario(json.data);
                document.getElementById('inputIdInsolvencia').value = id;

                inicializarCorrecciones(true);
            } else {
                Swal.fire('Error', 'No se encontraron datos para esta insolvencia', 'error');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Error al obtener insolvencia', 'error');
        }
    }

    inicializarCorrecciones();
    inicializarLiquidador();
});


// Nueva función para inicializar al cargar la página o al editar
function inicializarCorrecciones() {
    const correccionesSi = document.getElementById("correcciones_si");
    const correccionesNo = document.getElementById("correcciones_no");

    if (correccionesSi && correccionesSi.checked) {
        mostrarCampoCorrecciones();
    } else if (correccionesNo && correccionesNo.checked) {
        ocultarCampoCorrecciones();
    } else {
        ocultarCampoCorrecciones(); // por defecto
    }
}




document.addEventListener('DOMContentLoaded', function () {
    // Acta de Aceptación
    setupFileInput(
        'archivoPDF',
        'fileNameDisplay',
        '.file-upload-label[for="archivoPDF"]',
        'Seleccionar archivo',
        'filePreviewActa'
    );

    // Desprendible
    setupFileInput(
        'desprendiblePDF',
        'desprendibleFileNameDisplay',
        '.file-upload-label[for="desprendiblePDF"]',
        'Seleccionar desprendible',
        'filePreviewDesprendible'
    );

    // Autoliquidador con vista previa
    setupFileInput(
        'archivoAutoliquidador',
        'fileNameDisplayAutoliquidador',
        '.file-upload-label[for="archivoAutoliquidador"]',
        'Seleccionar archivo',
        'filePreviewAutoliquidador'
    );

    function setupFileInput(inputId, displayId, labelSelector, defaultText, previewContainerId = null) {
        const fileInput = document.getElementById(inputId);
        const fileNameDisplay = document.getElementById(displayId);
        const uploadLabel = document.querySelector(labelSelector);
        const previewContainer = previewContainerId ? document.getElementById(previewContainerId) : null;

        if (fileInput && fileNameDisplay && uploadLabel) {
            fileInput.addEventListener('change', function () {
                if (this.files.length > 0) {
                    const file = this.files[0];
                    const fileName = file.name;
                    fileNameDisplay.textContent = fileName;
                    uploadLabel.classList.add('has-file');
                    uploadLabel.querySelector('.file-upload-text').textContent = 'Archivo seleccionado';

                    // Si es PDF y hay contenedor de previsualización
                    if (previewContainer && file.type === 'application/pdf') {
                        const fileURL = URL.createObjectURL(file);
                        previewContainer.innerHTML = `
                            <iframe src="${fileURL}" width="100%" height="400px" style="border:1px solid #ccc; border-radius: 8px;"></iframe>
                        `;
                    } else if (previewContainer) {
                        previewContainer.innerHTML = `<div class="text-danger small">Archivo no compatible para previsualización.</div>`;
                    }

                } else {
                    fileNameDisplay.textContent = 'Ningún archivo seleccionado';
                    uploadLabel.classList.remove('has-file');
                    uploadLabel.querySelector('.file-upload-text').textContent = defaultText;
                    if (previewContainer) {
                        previewContainer.innerHTML = '';
                    }
                }
            });
        }
    }
});



// contador de observaciones
document.addEventListener('DOMContentLoaded', function () {
    const textarea = document.getElementById('observaciones_desprendible');
    const contador = document.getElementById('contadorCaracteres')


    if (textarea && contador) {
        textarea.addEventListener('input', function () {
            const caracteres = this.value.length;

            contador.textContent = caracteres;

            // validaciones
            if (caracteres > 100) {
                contador.className = 'text-warning'
            } else if (caracteres > 150) {
                contador.className = 'text-danger'
            } else {
                contador.className = 'text-muted';
            }
        })
    }
})

// contador de correcionees
document.addEventListener('DOMContentLoaded', function () {
    const textareaCorrecciones = document.getElementById('detalleCorrecciones');
    const contadorCorrecciones = document.getElementById('contadorCorrecciones');

    if (textareaCorrecciones && contadorCorrecciones) {
        textareaCorrecciones.addEventListener('input', function () {
            const caracteres = this.value.length;
            contadorCorrecciones.textContent = caracteres;

            // Cambiar estilo si se acerca al límite
            if (caracteres > 250) {
                contadorCorrecciones.className = 'text-warning';
            } else if (caracteres > 290) {
                contadorCorrecciones.className = 'text-danger';
            } else {
                contadorCorrecciones.className = 'text-muted';
            }
        });
    }
});



// campos del liquidador cuando es "si"
document.addEventListener("DOMContentLoaded", () => {
    const pagoSi = document.getElementById('pago_si');
    const pagoNo = document.getElementById('pago_no');
    const cuotasDiv = document.getElementById('cuotas_pago');

    function toggleCuotas() {
        cuotasDiv.style.display = pagoSi.checked ? 'block' : 'none';
    }

    pagoSi.addEventListener('change', toggleCuotas);
    pagoNo.addEventListener('change', toggleCuotas);

    toggleCuotas();

    // ⬇️ Aplicar formato de moneda a los campos
    const camposMoneda = [
        'valor_total_pagado',
        'cuota_1',
        'cuota_2',
        'cuota_3',
        'cuota_4'
    ];

    camposMoneda.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            applyCurrencyFormatting(campo);
        }
    });
});


const CAMPOS_LIQUIDADOR = [
    "liquidador_si", "liquidador_no",
    "nombre_liquidador", "telefono_liquidador", "correo_liquidador",
    "pago_si", "pago_no"
];


const CAMPOS_A_DESHABILITAR = [
    // Audiencias
    "audiencias_si", "audiencias_no",

    // Acta de aceptación
    "archivoPDF", "archivoPDFUrl",

    // Estado del Proceso
    "desprendiblePDF", "desprendiblePDFUrl",
    "desprendible_parcial", "desprendible_limpio", "desprendible_deudas",
    "salario", "salario_total", "saldo_total", "deducciones",
    "saldo_libre", "porcentaje", "cuota_pagar",
    "porcentaje_limpio", "cuota_limpio",
    "observaciones_desprendible",

    // Proceso Jurídico
    "proceso_liquidacion", "proceso_acuerdo_pago",
    "juzgado", "archivoAutoliquidador", "archivoAutoliquidadorUrl",

    "liquidador_si", "liquidador_no",
    "nombre_liquidador", "telefono_liquidador", "correo_liquidador",
    "pago_si", "pago_no",


    // Proceso Finalizado
    "estado_apto", "estado_no_apto", "motivo"
];