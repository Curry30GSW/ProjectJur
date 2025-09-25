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

async function obtenerClientes() {
    try {
        const token = sessionStorage.getItem('token');
        const url = 'http://localhost:3000/api/clientes-insolvencias';


        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error en la solicitud');

        clientes = await response.json();
        if (!Array.isArray(clientes) || clientes.length === 0) {
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

        mostrar(clientes);

    } catch (error) {
        console.error('❌ Error en clientes:', error);
        Swal.fire('Error', 'No se pudo obtener la información.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!sessionStorage.getItem('token')) {
        window.location.href = '../pages/login.html';
        return;
    }
    obtenerClientes();
});


const mostrar = (clientes) => {
    console.log(clientes);
    let resultados = '';
    clientes.forEach((cliente) => {
        let estadoTexto = '';
        let estadoClase = '';
        let correccionesBadge = '';
        let estadoCreadaTexto = '';

        // Por defecto botón editar habilitado
        let botonEditar = `
        <button title="Editar Proceso" class="btn btn-md btn-warning text-white editar-proceso" 
            data-id_insolvencia="${cliente.id_insolvencia}" 
            ${!cliente.creada || cliente.creada === 'null' ? 'disabled' : ''} >
            <i class="fa-solid fa-edit fs-5"></i>Editar 
        </button>`;

        // 🔹 Validar si cliente está retirado
        if (cliente.estado === 1) {
            estadoTexto = 'Cliente Retirado';
            estadoClase = 'bg-gradient-purple'; // badge morado
            botonEditar = `
            <button title="Editar Proceso" class="btn btn-md btn-secondary text-white editar-proceso" 
                data-id_insolvencia="${cliente.id_insolvencia}" disabled>
                <i class="fa-solid fa-ban fs-5"></i>Editar
            </button>`;
        } else {
            // Estado principal (APTO/NO APTO/En proceso)
            if (cliente.terminacion === 'APTO') {
                estadoTexto = 'APTO';
                estadoClase = 'bg-gradient-success blink';
            } else if (cliente.terminacion === 'NO APTO') {
                estadoTexto = 'NO APTO';
                estadoClase = 'bg-gradient-danger blink';
            } else {
                if (!cliente.creada || cliente.creada === 'null' || cliente.creada === null) {
                    estadoTexto = '';
                    estadoCreadaTexto = '<span class="badge badge-sm bg-gradient-dark blink">No definido</span>';
                } else {
                    estadoTexto = 'En proceso';
                    estadoClase = 'bg-gradient-warning blink';
                    estadoCreadaTexto = '';
                }
            }
        }

        // Badge para correcciones si existe información
        if (cliente.correcciones && cliente.correcciones.trim() !== '') {
            correccionesBadge = `<span class="badge badge-md bg-gradient-warning blink">CORRECCIONES</span>`;
            estadoTexto = '';
            estadoClase = '';
        }

        resultados += `
    <tr>
        <td>
            <div class="d-flex align-items-center px-2 py-1">
                <div>
                    <img src="http://localhost:3000${cliente.foto_perfil}" 
                        class="avatar avatar-lg me-3 foto-cliente" 
                        alt="${cliente.nombres}"
                        data-src="http://localhost:3000${cliente.foto_perfil}">
                </div>
                <div class="d-flex flex-column justify-content-center">
                    <h6 class="mb-0 text-xs">${cliente.nombres} ${cliente.apellidos}</h6>
                    <p class="text-xs text-secondary mb-0">${cliente.correo}</p>
                </div>
            </div>
        </td>
        <td class="text-center align-middle"><p class="text-dark text-sm font-weight-bold mb-0">${cliente.cedula}</p></td>
        <td class="align-middle text-center text-md">
            ${estadoTexto ? `<span class="badge badge-md ${estadoClase}">${estadoTexto}</span>` : ''}
            ${correccionesBadge}
            ${estadoCreadaTexto}
        </td>
        <td class="align-middle">
            <div class="d-flex justify-content-center gap-2">
                ${botonEditar}
                <button class="btn btn-sm btn-success text-white ver-insolvencia" data-id_insolvencia="${cliente.id_insolvencia}">
                    Ver Insolvencia
                </button>
                <button class="btn btn-sm btn-info text-white ver-detalle" data-cedula="${cliente.cedula}">
                    Ver Cliente
                </button>
            </div>
        </td>
    </tr>`;
    });

    //  quite el boton${botonCrear}
    if ($.fn.DataTable.isDataTable('#tablaClientes')) {
        $('#tablaClientes').DataTable().clear().destroy();
    }

    $("#tablaClientes tbody").html(resultados);

    // Inicializar DataTable
    $('#tablaClientes').DataTable({
        pageLength: 5,
        lengthMenu: [5, 15, 25, 50, 100],
        language: {
            sProcessing: "Procesando...",
            sLengthMenu: "Mostrar _MENU_ registros",
            sZeroRecords: "No se encontraron resultados",
            sEmptyTable: "Ningún dato disponible en esta tabla",
            sInfo: "Mostrando del _START_ al _END_ de _TOTAL_ registros",
            sInfoEmpty: "Mostrando 0 a 0 de 0 registros",
            sInfoFiltered: "(filtrado de un total de _MAX_ registros)",
            sSearch: "Buscar:",
            oPaginate: {
                sNext: "Siguiente",
                sPrevious: "Anterior"
            }
        }
    });
};



$(document).on('click', '.foto-cliente', function () {
    const src = $(this).data('src');
    $('#imagen-modal').attr('src', src);

    const modal = new bootstrap.Modal(document.getElementById('modalFoto'));
    modal.show();
});


let datosOriginalesParcial = {};
// boton editar Proceso
function cargarDatosEnFormulario(cliente) {

    document.getElementById('creada').value = cliente.creada ?? 0;

    // Datos básicos del cliente (ya funcionan)
    document.getElementById('idModal').textContent = cliente.id_cliente || '---';
    document.getElementById('inputIdCliente').value = cliente.id_cliente || '';
    const nombreCompleto = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
    document.getElementById('detalleNombreCliente').textContent = nombreCompleto || '---';
    document.getElementById('detalleTipoDocumento').textContent = cliente.cedula ? `Cédula: ${cliente.cedula}` : '---';
    document.getElementById('telefonoCrear').textContent = cliente.telefono || '---';
    document.getElementById('detalleEmail').textContent = cliente.correo || '---';
    document.getElementById('direccionModal').textContent = cliente.direccion || '---';
    document.getElementById('ciudadModal').textContent = cliente.ciudad || '---';
    const fechaVinculo = cliente.fecha_vinculo ? new Date(cliente.fecha_vinculo).toLocaleDateString() : '---';
    document.getElementById('vinculacionModal').textContent = fechaVinculo;

    // Foto de perfil
    const foto = document.getElementById('fotoperfilModal');
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




}


document.querySelector('#tablaClientes tbody').addEventListener('click', function (e) {
    const boton = e.target.closest('.ver-detalle');
    if (boton) {
        const cedula = boton.getAttribute('data-cedula');
        const fila = boton.closest('tr');
        const foto = fila.querySelector('.foto-cliente')?.getAttribute('data-src');

        fetch(`http://localhost:3000/api/clientes/${cedula}`)
            .then(response => response.json())
            .then(cliente => {
                // Llenar datos en el modal
                llenarModalDetalle(cliente, foto);

                // Mostrar el modal
                const modal = new bootstrap.Modal(document.getElementById('modalVerDetalle'));
                modal.show();
            })
            .catch(error => {
                console.error('Error al obtener los detalles:', error);
                mostrarError('Error al cargar los datos del cliente');
            });
    }
});

function llenarModalDetalle(cliente, fotoUrl) {

    // Foto de perfil
    const fotoPerfil = document.getElementById('detalleFotoPerfil');
    fotoPerfil.src = cliente.foto_perfil
        ? `http://localhost:3000${cliente.foto_perfil}`
        : (fotoUrl || '../assets/img/avatar.png');


    // Datos personales
    document.getElementById('detalleID').textContent = cliente.id_cliente || 'No registrado';
    const vinculo = cliente.fecha_vinculo;

    if (vinculo) {
        const fecha = new Date(vinculo);
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = fecha.toLocaleString('es-CO', { month: 'short' }).replace('.', '');
        const mesFormateado = mes.charAt(0).toUpperCase() + mes.slice(1).toLowerCase(); // Ene, Feb, Mar, etc.
        const anio = fecha.getFullYear();

        document.getElementById('detalleVinculacion').textContent = `${dia}/${mesFormateado}/${anio}`;
    } else {
        document.getElementById('detalleVinculacion').textContent = 'No registrado';
    }
    const nombreCompleto = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
    document.getElementById('detalleNombreCompleto').innerText = nombreCompleto || 'No registrado';

    document.getElementById('detalleCedula').value = cliente.cedula || 'No registrado';
    document.getElementById('detalleTelefono').value = cliente.telefono || 'No registrado';
    document.getElementById('detalleCorreo').value = cliente.correo || 'No registrado';
    document.getElementById('detalleDireccion').value = cliente.direccion || 'No registrado';
    document.getElementById('detalleCiudad').value = cliente.ciudad || 'No registrado';
    document.getElementById('detalleBarrio').value = cliente.barrio || 'No registrado';
    document.getElementById('detalleSexo').value = cliente.sexo || 'No registrado';

    if (cliente.fecha_nac) {
        const fecha = new Date(cliente.fecha_nac);

        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = fecha.toLocaleString('es-CO', { month: 'short' });
        const anio = fecha.getFullYear();

        const mesFormateado = mes.charAt(0).toUpperCase() + mes.slice(1).replace('.', '');

        const fechaFormateada = `${dia}/${mesFormateado}/${anio}`;
        document.getElementById('detalleFechaNacimiento').value = fechaFormateada;
    } else {
        document.getElementById('detalleFechaNacimiento').value = 'No registrado';
    }

    document.getElementById('detalleEdad').value = cliente.edad || 'No registrado';
    document.getElementById('detalleEstCivil').value = cliente.estado_civil || 'No registrado';

    // Datos financieros
    document.getElementById('detalleSalario').value = cliente.salario ?
        '$' + cliente.salario.toLocaleString('es-CO') : 'No registrado';

    const situacionLaboral = cliente.laboral == 1 ? 'ACTIVO' : 'PENSIONADO';
    document.getElementById('detalleSituacionLaboral').value = situacionLaboral;

    document.getElementById('detalleEmpresa').value = cliente.empresa || 'No registrado';
    document.getElementById('detalleCargo').value = cliente.cargo || 'No registrado';
    const pagaduriasLista = document.getElementById("detallePagaduriasLista");
    pagaduriasLista.innerHTML = "";

    if (Array.isArray(cliente.pagadurias) && cliente.pagadurias.length > 0) {
        cliente.pagadurias.forEach((p, index) => {
            const row = document.createElement("tr");

            // Nombre
            const colNombre = document.createElement("td");
            colNombre.textContent = p.nombre_pagaduria;
            row.appendChild(colNombre);

            // Valor (formateado en pesos)
            const colValor = document.createElement("td");
            colValor.textContent = "$" + Number(p.valor_pagaduria).toLocaleString("es-CO");
            row.appendChild(colValor);

            // Descuento (%)
            const colDescuento = document.createElement("td");
            const porcentaje = (parseFloat(p.descuento_pagaduria) * 100).toFixed(2) + " %";
            colDescuento.textContent = porcentaje;
            row.appendChild(colDescuento);

            colNombre.style.color = "black";
            colValor.style.color = "black";
            colDescuento.style.color = "black";

            pagaduriasLista.appendChild(row);

        });
    } else {
        const row = document.createElement("tr");
        const col = document.createElement("td");
        col.colSpan = 4;
        col.textContent = "No registrado";
        col.classList.add("text-muted");
        row.appendChild(col);
        pagaduriasLista.appendChild(row);
    }


    document.getElementById('detalleCuota').value = cliente.valor_cuota ?
        '$' + parseInt(cliente.valor_cuota).toLocaleString('es-CO') : 'No registrado';

    document.getElementById('detallePorcentaje').value = cliente.porcentaje ?
        cliente.porcentaje + '%' : 'No registrado';

    document.getElementById('detalleInsolvencia').value = cliente.valor_insolvencia ?
        '$' + parseInt(cliente.valor_insolvencia).toLocaleString('es-CO') : 'No registrado';

    document.getElementById('detalleNCuotas').value = cliente.numero_cuotas || 'No registrado';



    // Documentos PDF
    actualizarBotonPDF('detalleCedulaPDF', cliente.cedula_pdf, 'Ver Cédula');
    actualizarBotonPDF('detalleDesprendible', cliente.desprendible, 'Ver Desprendible');

    actualizarBotonPDF('detalleBienesInmuebles', cliente.bienes, 'Ver Bienes');


    // Bienes inmuebles
    const bienesInmueblesDiv = document.getElementById('detalleBienesInmuebles');

    if (cliente.bienes === "1" && cliente.bienes_inmuebles) {
        actualizarBotonPDF('detalleBienesInmuebles', cliente.bienes_inmuebles, 'Ver Bienes Inmuebles');
    } else {
        bienesInmueblesDiv.innerHTML = '<span class="text-muted">El cliente no reporta bienes inmuebles</span>';
    }

    // Data crédito
    const dataCreditoDiv = document.getElementById('detalleDataCredito');

    if (cliente.nombreData) {
        actualizarBotonPDF('detalleDataCredito', cliente.nombreData, 'Ver DataCredito');
    } else {
        dataCreditoDiv.innerHTML = '<span class="text-muted">El cliente no tiene data crédito registrado</span>';
    }


    // Recibo Publico
    const reciboPublicoDiv = document.getElementById('detalleReciboPublico');

    if (cliente.recibos_publicos) {
        actualizarBotonPDF('detalleReciboPublico', cliente.recibos_publicos, 'Ver Recibo');
    } else {
        reciboPublicoDiv.innerHTML = '<span class="text-muted">El cliente no tiene recibo público registrado</span>';
    }



    // Asesor
    document.getElementById('detalleAsesor').value = cliente.asesor || 'No asignado';

    // Fecha de vinculación
    if (cliente.fecha_vinculo) {
        const fecha = new Date(cliente.fecha_vinculo);

        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = fecha.toLocaleString('es-CO', { month: 'short' }); // ejemplo: "may."
        const anio = fecha.getFullYear();

        // Quitar el punto final en el mes (si lo tiene)
        const mesFormateado = mes.charAt(0).toUpperCase() + mes.slice(1).replace('.', '');

        const fechaFormateada = `${dia}/${mesFormateado}/${anio}`;
        document.getElementById('detalleFechaVinculo').value = fechaFormateada;
    } else {
        document.getElementById('detalleFechaVinculo').value = 'No registrada';
    }


    // Estado del cliente
    const estadoCliente = cliente.estado == 0 ? 'ACTIVO' : 'INACTIVO';
    document.getElementById('detalleEstadoCliente').value = estadoCliente;

    // Motivo de retiro
    const motivoRetiroInput = document.getElementById('detalleMotivoRetiro');
    const motivoRetiroDiv = motivoRetiroInput.closest(".col-6"); // 📌 toma el contenedor de la columna

    if (estadoCliente === 'ACTIVO') {
        motivoRetiroDiv.style.display = "none"; // ocultar
    } else {
        motivoRetiroDiv.style.display = "block"; // mostrar
        motivoRetiroInput.value = cliente.motivo_retiro || 'NO APLICA';
    }



    // Llenar referencias familiares
    if (cliente.referencias_familiares) {
        const refsFamiliares = cliente.referencias_familiares;

        for (let i = 0; i < 3; i++) {
            const nombreInput = document.getElementById(`detalleRefFam${i + 1}`);
            const telInput = document.getElementById(`detalleRefFamTel${i + 1}`);
            const parentescoInput = document.getElementById(`detalleRefFamParentesco${i + 1}`);

            if (refsFamiliares[i]) {
                nombreInput.value = refsFamiliares[i].familia_nombre || '';
                telInput.value = refsFamiliares[i].familia_telefono || '';
                parentescoInput.value = refsFamiliares[i].parentesco || '';

                // Mostrar el campo por si estaba oculto
                nombreInput.parentElement.style.display = '';
                telInput.parentElement.style.display = '';
                parentescoInput.parentElement.style.display = '';
            } else {
                // Limpiar y ocultar campos si no hay datos
                nombreInput.value = '';
                telInput.value = '';
                parentescoInput.value = '';

                nombreInput.parentElement.style.display = 'none';
                telInput.parentElement.style.display = 'none';
                parentescoInput.parentElement.style.display = 'none';
            }
        }
    }

    // Llenar referencias personales
    if (cliente.referencias_personales) {
        const refsPersonales = cliente.referencias_personales;

        for (let i = 0; i < 3; i++) {
            const nombreInput = document.getElementById(`detalleRefPer${i + 1}`);
            const telInput = document.getElementById(`detalleRefPerTel${i + 1}`);

            if (refsPersonales[i]) {
                nombreInput.value = refsPersonales[i].personal_nombre || '';
                telInput.value = refsPersonales[i].personal_telefono || '';

                nombreInput.parentElement.style.display = '';
                telInput.parentElement.style.display = '';
            } else {
                nombreInput.value = '';
                telInput.value = '';

                nombreInput.parentElement.style.display = 'none';
                telInput.parentElement.style.display = 'none';
            }
        }
    }

}

const modal = document.getElementById('modalVerDetalle');
const ModalSeen = document.getElementById('modalVerDetalle');

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



function formatearPeso(valor) {
    return valor.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    });
}


document.addEventListener('click', async function (e) {
    if (e.target.classList.contains('editar-proceso')) {
        const idInsolvencia = e.target.dataset.id_insolvencia;
        location.href = `crearInsolvencia.html?id=${encodeURIComponent(idInsolvencia)}`;
    }
});


//FUNCION PARA VER MODAL

// Event listener para el botón de ver insolvencia
document.addEventListener('click', async function (e) {

    if (e.target.classList.contains('ver-insolvencia')) {
        const id_insolvencia = e.target.dataset.id_insolvencia;

        try {
            const response = await fetch(`http://localhost:3000/api/insolvencia/id/${id_insolvencia}`);
            const data = await response.json();

            if (data.success && data.data) {
                mostrarDetallesInsolvencia(data.data);
            } else {
                Swal.fire('Información', 'No se encontraron datos de insolvencia para esta cédula', 'info');
            }
        } catch (error) {
            console.error('Error al obtener datos de insolvencia:', error);
            Swal.fire('Error', 'No se pudo obtener la información de insolvencia', 'error');
        }
    }
});

// Función para mostrar los detalles de insolvencia en modal
function mostrarDetallesInsolvencia(datos) {
    const modal = new bootstrap.Modal(document.getElementById('modalInsolvencia'));
    const modalContent = document.getElementById('modalInsolvenciaContent');

    // Formateador de fechas
    const formatDate = (fechaOriginal) => {
        if (!fechaOriginal || isNaN(new Date(fechaOriginal))) {
            return "No especificado";
        }
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const fecha = new Date(fechaOriginal);
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = meses[fecha.getMonth()];
        const anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    };

    // Formateador de moneda
    const formatCurrency = (valor) => {
        return valor ? new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(valor)) : '$ 0';
    };

    // Fecha y hora actual formateada
    const ahora = new Date();
    const fechaHoy = ahora.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Determinar estado de la insolvencia
    const estado = datos.terminacion === "APTO" ? "APTO" : "NO APTO";

    // Crear el contenido HTML del modal
    modalContent.innerHTML = `
    <div class="expediente-juridico">
        <!-- Encabezado estilo documento oficial -->
        <div class="encabezado-documento position-relative">

            <!-- Sello del número de proceso arriba a la derecha -->
            <div class="sello-numero-principal">
                <div class="sello-content-numero">
                    Nº ${datos.id_insolvencia || '---'}
                </div>
            </div>

            <div class="membrete">
                <div class="titulo-documento">
                    <h3>EXPEDIENTE DE INSOLVENCIA</h3>
                </div>

                <!-- Sello del estado -->
                <div class="sello">
                    <div class="sello-content 
                        ${datos.terminacion === 'APTO'
            ? 'bg-success'
            : !datos.terminacion || datos.terminacion === 'EN PROCESO'
                ? 'bg-warning'
                : 'bg-danger'}">
                        <span>${datos.terminacion || 'EN PROCESO'}</span>
                    </div>
                </div>
            </div>

            <div class="datos-encabezado">
                <div class="fecha-radicacion">
                    <span>Fecha radicación: ${formatDate(datos.fecha_radicacion)}</span>
                </div>
                <div class="codigo-barras">
                    <span>Cédula: ${datos.cedula || 'No registrada'}</span>
                </div>
            </div>
        </div>




        <!-- Cuerpo principal del expediente -->
        <div class="cuerpo-expediente">
            <!-- Sección de información del cliente -->
            <div class="seccion-expediente">
                <h4 class="titulo-seccion"><i class="fas fa-user-tie"></i> INFORMACIÓN DEL CLIENTE</h4>
                <div class="row">
                    <!-- Card de información básica -->
                    <div class="col-md-6 mb-3">
                        <div class="card h-100 border-primary">
                            <div class="card-header bg-primary text-white">
                                <i class="fas fa-id-card me-2"></i>
                                Datos Básicos
                            </div>
                            <div class="card-body">
                                <div class="info-referencia">
                                    <span class="etiqueta">Nombre completo:</span>
                                    <span class="valor">${datos.nombres} ${datos.apellidos}</span>
                                </div>
                                <div class="info-referencia">
                                    <span class="etiqueta">Identificación:</span>
                                    <span class="valor">${datos.cedula}</span>
                                </div>
                                <div class="info-referencia">
                                    <span class="etiqueta">Fecha de vinculación:</span>
                                    <span class="valor">${formatDate(datos.fecha_vinculo)}</span>
                                </div>
                                <div class="info-referencia">
                                    <span class="etiqueta">Salario:</span>
                                    <span class="valor">${formatCurrency(datos.salario)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Card de contacto -->
                    <div class="col-md-6 mb-3">
                        <div class="card h-100 border-info">
                            <div class="card-header bg-info text-white">
                                <i class="fas fa-address-book me-2"></i>
                                Datos de Contacto
                            </div>
                            <div class="card-body">
                                <div class="info-referencia">
                                    <span class="etiqueta">Dirección:</span>
                                    <span class="valor">${datos.direccion || 'No registrada'}</span>
                                </div>
                                <div class="info-referencia">
                                    <span class="etiqueta">Ciudad:</span>
                                    <span class="valor">${datos.ciudad || 'No registrada'}</span>
                                </div>
                                <div class="info-referencia">
                                    <span class="etiqueta">Teléfono:</span>
                                    <span class="valor">${datos.telefono || 'No registrado'}</span>
                                </div>
                                <div class="info-referencia">
                                    <span class="etiqueta">Correo:</span>
                                    <span class="valor">${datos.correo || 'No registrado'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Foto de perfil -->
                <div class="row mt-2">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body text-center">
                                <img src="${datos.foto_perfil ? `http://localhost:3000${datos.foto_perfil}` : '../assets/img/avatar.png'}" 
                                    class="foto-perfil rounded-circle" 
                                    alt="Foto perfil"
                                    style="width: 120px; height: 120px; object-fit: cover; border: 3px solid #1B3C53;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sección de detalles de la insolvencia -->
            <div class="seccion-expediente">
                <h4 class="titulo-seccion"><i class="fas fa-file-invoice-dollar"></i> DETALLES DE LA INSOLVENCIA</h4>
                <div class="row">
                    <!-- Card de información financiera -->
                    <div class="col-md-6 mb-3">
                        <div class="card h-100 border-success">
                            <div class="card-header bg-success text-white">
                                <i class="fas fa-money-bill-wave me-2"></i>
                                Información Financiera
                            </div>
                            <div class="card-body">
                                <div class="info-referencia">
                                    <span class="etiqueta">Tipo de proceso:</span>
                                    <span class="valor">${datos.tipo_proceso || 'No especificado'}</span>
                                </div>
                                <div class="info-referencia">
                                    <span class="etiqueta">Valor total:</span>
                                    <span class="valor">${formatCurrency(datos.valor_insolvencia)}</span>
                                </div>
                                <div class="info-referencia">
                                    <span class="etiqueta">Número de cuotas:</span>
                                    <span class="valor">${datos.numero_cuotas || '0'}</span>
                                </div>
                                <div class="info-referencia">
                                    <span class="etiqueta">Valor cuota:</span>
                                    <span class="valor">${formatCurrency(datos.valor_cuota)}</span>
                                </div>
                                <div class="info-referencia">
                                    <span class="etiqueta">Porcentaje:</span>
                                    <span class="valor">${datos.porcentaje || '0'}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Card de información legal -->
                    <div class="col-md-6 mb-3">
                        <div class="card h-100 border-warning">
                            <div class="card-header bg-warning text-white">
                                <i class="fas fa-gavel me-2"></i>
                                Información Legal
                            </div>
                            <div class="card-body">
                                <div class="info-referencia">
                                    <span class="etiqueta">Juzgado:</span>
                                    <span class="valor">${datos.juzgado || 'No especificado'}</span>
                                </div>
                                <div class="info-referencia">
                                    <span class="etiqueta">Número de proceso (ID):</span>
                                    <span class="badge bg-primary rounded-pill fs-6">${datos.id_insolvencia}</span>
                                </div>
                                <div class="info-referencia">
                                    <span class="etiqueta">Tipo de Proceso:</span>
                                    <span class="valor">
                                        ${datos.tipo_proceso || 'No especificado'}
                                    </span>
                                </div>
                                <div class="info-referencia">
                                    <span class="etiqueta">Estado desprendible:</span>
                                    <span class="valor">
                                        <span class="badge ${datos.estado_desprendible === 'LIMPIO' ? 'bg-success' : 'bg-warning'}">
                                            ${datos.estado_desprendible || 'No especificado'}
                                        </span>
                                    </span>
                                </div>
                                ${datos.ruta_desprendible ? `
                                <div class="info-referencia">
                                    <span class="etiqueta">Desprendible:</span>
                                    <span class="valor">
                                        <a href="http://localhost:3000${datos.ruta_desprendible}" target="_blank" class="btn btn-md btn-warning">
                                            <i class="fas fa-file-pdf"></i> Ver
                                        </a>
                                    </span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sección de audiencias -->
                ${datos.audiencias && datos.audiencias.length > 0 ? `
                    <div class="row mt-3">
                        <div class="col-12">
                            <div class="card border-info">
                                <div class="card-header bg-info text-white">
                                    <i class="fas fa-gavel me-2"></i>
                                    Audiencias
                                </div>
                                <div class="card-body">
                                    ${datos.audiencias.map(a => `
                                        <div class="row mt-1">
                                            <div class="col-md-6">
                                                <div class="info-referencia">
                                                    <span class="etiqueta">Audiencia:</span>
                                                    <span class="valor">${a.audiencia}</span>
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="info-referencia">
                                                    <span class="etiqueta">Fecha:</span>
                                                    <span class="valor">${a.fecha_audiencias ? formatDate(a.fecha_audiencias) : 'Sin fecha'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                <!-- Sección del liquidador -->
                ${datos.nombre_liquidador ? `
                <div class="row mt-3">
                        <div class="col-12">
                            <div class="card border-secondary">
                                <div class="card-header bg-secondary text-white">
                                    <i class="fas fa-user-tie me-2"></i>
                                    Datos del Liquidador
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-4">
                                            <div class="info-referencia">
                                                <span class="etiqueta">Nombre:</span>
                                                <span class="valor">${datos.nombre_liquidador}</span>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="info-referencia">
                                                <span class="etiqueta">Teléfono:</span>
                                                <span class="valor">${datos.telefono_liquidador || datos.valor_liquidador || 'No registrado'}</span>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="info-referencia">
                                                <span class="etiqueta">Correo:</span>
                                                <span class="valor">${datos.correo_liquidador || 'No registrado'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    ${datos.valor_liquidador ? `
                                    <div class="row mt-2">
                                        <div class="col-12">
                                            <div class="info-referencia">
                                                <span class="etiqueta">Valor Liquidador:</span>
                                                <span class="valor">${datos.valor_liquidador}</span>
                                            </div>
                                        </div>
                                    </div>` : ''}

                                    ${(() => {
                let cuotasHTML = '';
                for (let i = 1; i <= 4; i++) {
                    const valor = datos[`cuota_${i}`];
                    const fecha = datos[`fecha_${i}`];
                    if (valor && valor !== "0") {
                        cuotasHTML += `
                                                    <div class="row mt-1">
                                                        <div class="col-md-6">
                                                            <div class="info-referencia">
                                                                <span class="etiqueta">Cuota ${i}:</span>
                                                                <span class="valor">${valor}</span>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <div class="info-referencia">
                                                                <span class="etiqueta">Fecha:</span>
                                                                <span class="valor">${fecha ? formatDate(fecha) : 'Sin fecha'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                `;
                    }
                }
                return cuotasHTML;
            })()}

                                    ${datos.pago_liquidador ? `
                                    <div class="row mt-2">
                                        <div class="col-12">
                                            <div class="info-referencia">
                                                <span class="etiqueta">Pago al liquidador:</span>
                                                <span class="valor">
                                                    ${datos.pago_liquidador === 'SI'
                    ? '<span class="badge bg-success">SI</span>'
                    : '<span class="badge bg-danger">NO</span>'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>` : ''}

                                    ${datos.autoliquidador ? `
                                    <div class="row mt-2">
                                        <div class="col-12">
                                            <div class="info-referencia">
                                                <span class="etiqueta">Autoliquidador:</span>
                                                <span class="valor">
                                                    <a href="http://localhost:3000${datos.autoliquidador}" target="_blank" class="btn btn-md btn-secondary">
                                                        <i class="fas fa-file-pdf"></i> Ver documento
                                                    </a>
                                                </span>
                                            </div>
                                        </div>
                                    </div>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                ` : ''}
            </div>

            <!-- Sección de documentos -->
            ${datos.acta_aceptacion ? `
            <div class="seccion-expediente">
                <h4 class="titulo-seccion"><i class="fas fa-file-alt"></i> DOCUMENTOS</h4>
                <div class="row">
                    <div class="col-md-6">
                        <div class="card border-secondary">
                            <div class="card-header bg-secondary text-white">
                                <i class="fas fa-file-contract me-2"></i>
                                Documentos Adjuntos
                            </div>
                            <div class="card-body">
                                <div class="d-grid gap-2">
                                    <a href="http://localhost:3000${datos.acta_aceptacion}" target="_blank" class="btn btn-danger text-start">
                                        <i class="fas fa-file-pdf me-2"></i> Acta de aceptación
                                    </a>
                                    ${datos.autoliquidador ? `
                                    <a href="http://localhost:3000${datos.autoliquidador}" target="_blank" class="btn btn-danger text-start">
                                        <i class="fas fa-file-pdf me-2"></i> Autoliquidador
                                    </a>
                                    ` : ''}
                                    ${datos.ruta_desprendible ? `
                                    <a href="http://localhost:3000${datos.ruta_desprendible}" target="_blank" class="btn btn-danger text-start">
                                        <i class="fas fa-file-pdf me-2"></i> Desprendible
                                    </a>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Sección de cronología -->
            <div class="seccion-expediente">
                <h4 class="titulo-seccion"><i class="fas fa-calendar-alt"></i> CRONOLOGÍA DEL PROCESO</h4>
                <div class="timeline">
                  <div class="evento-timeline ${datos.fecha_cuadernillo ? 'completado' : ''}">
                        <div class="fecha-evento">${formatDate(datos.fecha_cuadernillo) || 'Pendiente'}</div>
                        <div class="icono-evento"><i class="fas fa-file-import"></i></div>
                        <div class="detalle-evento">
                            <span class="titulo-evento">Cuadernillo</span>
                            <span class="descripcion-evento">Elaboración del Cuadernillo</span>
                        </div>
                    </div>
                    

                    <div class="evento-timeline ${datos.fecha_radicacion ? 'completado' : ''}">
                        <div class="fecha-evento">${formatDate(datos.fecha_radicacion) || 'Pendiente'}</div>
                        <div class="icono-evento"><i class="fas fa-file-import"></i></div>
                        <div class="detalle-evento">
                            <span class="titulo-evento">Radicación</span>
                            <span class="descripcion-evento">Inicio del proceso de insolvencia</span>
                        </div>
                    </div>
                    
                  <!-- Timeline de audiencias -->
                    ${datos.audiencias && datos.audiencias.length > 0 ? `
                        <div class="evento-timeline completado">
                            <div class="fecha-evento">
                                ${datos.audiencias.length} audiencia${datos.audiencias.length > 1 ? 's' : ''} registrad${datos.audiencias.length > 1 ? 'as' : 'a'}
                            </div>
                            <div class="icono-evento"><i class="fas fa-users"></i></div>
                            <div class="detalle-evento">
                                <span class="titulo-evento">Audiencias</span>
                                ${datos.audiencias.map(aud => `
                                    <div class="descripcion-evento">
                                        <strong>${aud.audiencia}</strong> - ${formatDate(aud.fecha_audiencias)}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div class="evento-timeline">
                            <div class="fecha-evento">Pendiente</div>
                            <div class="icono-evento"><i class="fas fa-users"></i></div>
                            <div class="detalle-evento">
                                <span class="titulo-evento">Audiencias</span>
                                <span class="descripcion-evento">Sin registros</span>
                            </div>
                        </div>
                    `}

                    <!-- Timeline de estado del desprendible -->
                ${datos.estado_desprendible ? `
                    <div class="evento-timeline completado">
                        <div class="icono-evento"><i class="fas fa-file-alt"></i></div>
                        <div class="detalle-evento">
                            <span class="titulo-evento">Estado del desprendible</span>
                            <span class="descripcion-evento"><strong>${datos.estado_desprendible}</strong></span>
                        </div>
                    </div>
                ` : ''}


                    <!-- Timeline de tipo de proceso jurídico -->
                ${datos.tipo_proceso ? `
                    <div class="evento-timeline completado">
                        <div class="icono-evento"><i class="fas fa-gavel"></i></div>
                        <div class="detalle-evento">
                            <span class="titulo-evento">Tipo de proceso jurídico</span>
                            <span class="descripcion-evento"><strong>${datos.tipo_proceso}</strong></span>
                        </div>
                    </div>
                ` : ''}

                    
                    <div class="evento-timeline ${datos.fecha_terminacion ? 'completado' : ''}">
                        <div class="fecha-evento">${formatDate(datos.fecha_terminacion) || 'Pendiente'}</div>
                        <div class="icono-evento"><i class="fas fa-clipboard-check"></i></div>
                        <div class="detalle-evento">
                            <span class="titulo-evento">Resolución final</span>
                            <span class="descripcion-evento">${estado}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sección de observaciones -->
            ${datos.observaciones || datos.obs_desprendible || datos.motivo_insolvencia ? `
            <div class="seccion-expediente">
                <h4 class="titulo-seccion"><i class="fas fa-exclamation-circle"></i> OBSERVACIONES</h4>
                <div class="card">
                    <div class="card-body">
                        ${datos.observaciones ? `
                        <div class="alert alert-light">
                            <h6><i class="fas fa-comment me-2"></i> Observaciones generales</h6>
                            <p>${datos.observaciones}</p>
                        </div>
                        ` : ''}
                        ${datos.obs_desprendible ? `
                        <div class="alert alert-light">
                            <h6><i class="fas fa-file-alt me-2"></i> Observaciones desprendible</h6>
                            <p>${datos.obs_desprendible}</p>
                        </div>
                        ` : ''}
                        ${datos.motivo_insolvencia ? `
                        <div class="alert alert-light">
                            <h6><i class="fas fa-question-circle me-2"></i> Motivo del no APTO</h6>
                            <p>${datos.motivo_insolvencia}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    </div>`;

    modal.show();
}


//VER POR CARPETAS
document.addEventListener("DOMContentLoaded", async () => {
    const folderItems = document.querySelectorAll(".folder-item");

    folderItems.forEach(item => {
        item.addEventListener("click", async () => {
            const insolvencia = item.getAttribute("data-insolvencia");


            try {
                // Traemos todos los clientes (PARCIAL y DEUDAS)
                const response = await fetch("http://localhost:3000/api/insolvencia/parcial-deuda");
                const clientes = await response.json();

                // Filtramos según la carpeta seleccionada
                const filtrados = clientes.filter(c => c.estado_desprendible === insolvencia);

                // Cambiamos el título dinámico
                document.getElementById("nombreInsolvenciaTitulo").textContent = insolvencia;


                // Mostramos los clientes en la tabla/modal
                mostrarClientesTabla(filtrados);
                const modalElement = document.getElementById("modalClientesDesprendible");
                const modalDesprendibles = bootstrap.Modal.getOrCreateInstance(modalElement);
                modalDesprendibles.show();



            } catch (error) {
                console.error("Error al obtener clientes:", error);
            }
        });
    });
});


//Contar clientes
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("http://localhost:3000/api/conteo-parcial-deudas");
        const data = await response.json();

        document.querySelectorAll(".folder-item").forEach((item) => {
            const estado = item.getAttribute("data-insolvencia"); // PARCIAL o DEUDAS

            const resultado = data.find(d => d.estado === estado); // <- aquí se cambió a d.estado

            if (resultado) {
                const countElement = item.querySelector(".folder-count");
                countElement.textContent = `${resultado.cantidad} cliente${resultado.cantidad !== 1 ? 's' : ''}`;
            }
        });
    } catch (error) {
        console.error("Error al cargar conteo de insolvencias:", error);
    }
});


const mostrarClientesTabla = (filtrados) => {
    let resultados = '';

    filtrados.forEach((cliente) => {   // <-- aquí usas filtrados, no clientes
        const estadoTexto = cliente.estado_desprendible;
        const estadoClase = estadoTexto === "PARCIAL" ? "bg-gradient-success" : "bg-gradient-danger";

        const fecha = new Date(cliente.fecha_insert);
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = meses[fecha.getMonth()];
        const año = fecha.getFullYear();
        const fechaFormateada = `${dia}/${mes}/${año}`;

        resultados += `
        <tr>
            <td class="text-center align-middle">
                <p class="text-center text-md text-dark">#${cliente.id_cliente}</p>
            </td>
            <td>
                <div class="d-flex align-items-center px-2 py-1">
                    <div>
                        <img src="http://localhost:3000${cliente.foto_perfil || '/default.png'}" 
                            class="avatar avatar-lg me-3 foto-cliente" 
                            alt="${cliente.nombres}">
                    </div>
                    <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-0 text-sm">${cliente.nombres} ${cliente.apellidos}</h6>
                        <p class="text-sm text-secondary mb-0">${cliente.correo}</p>
                    </div>
                </div>
            </td>
            <td class="align-middle text-center"><p class="text-sm text-dark">${cliente.cedula}</p></td>
            <td class="align-middle text-center text-sm">
                <span class="badge badge-sm ${estadoClase}">${estadoTexto}</span>
            </td>
            <td class="align-middle text-center">
                <p class="text-dark text-sm">${fechaFormateada} <br> 
                <strong>$${cliente.valor_insolvencia.toLocaleString()}</strong></p>
            </td>
        </tr>
        `;
    });

    // Reiniciar DataTable si ya está inicializado
    if ($.fn.DataTable.isDataTable('#tablaClientesDesprendibles')) {
        $('#tablaClientesDesprendibles').DataTable().clear().destroy();
    }

    // Insertar filas en el tbody
    $("#tablaDesprendibleBody").html(resultados);

    // Inicializar DataTable
    $('#tablaClientesDesprendibles').DataTable({
        pageLength: 8,
        lengthMenu: [8, 16, 25, 50],
        order: [[0, 'asc']], // ordenar por ID
        language: {
            sProcessing: "Procesando...",
            sLengthMenu: "Mostrar _MENU_ registros",
            sZeroRecords: "No se encontraron resultados",
            sEmptyTable: "Ningún dato disponible en esta tablaa",
            sInfo: "Mostrando del _START_ al _END_ de _TOTAL_ registros",
            sInfoEmpty: "Mostrando 0 a 0 de 0 registros",
            sInfoFiltered: "(filtrado de un total de _MAX_ registros)",
            sSearch: "Buscar:",
            oPaginate: {
                sNext: "Siguiente",
                sPrevious: "Anterior"
            }
        }
    });
};

