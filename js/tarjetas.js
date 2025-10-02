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
    obtenerClientes();
});



async function obtenerClientes() {
    try {
        const token = sessionStorage.getItem('token');
        const url = 'http://localhost:3000/api/clientes-cartera';

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error en la solicitud');

        const resJson = await response.json();
        const clientes = resJson.data;

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

        mostrarClientesEnTabla(clientes);


    } catch (error) {
        console.error('❌ Error en clientes:', error);
        Swal.fire('Error', 'No se pudo obtener la información.', 'error');
    }
}

function mostrarClientesEnTabla(clientes) {
    // Verifica si la tabla ya tiene DataTable inicializado
    if ($.fn.DataTable.isDataTable('#tablaCreditos')) {
        $('#tablaCreditos').DataTable().clear().destroy();
    }

    // Limpiar el tbody
    $("#tablaCreditos tbody").html('');

    let resultados = '';

    clientes.forEach((cliente) => {
        console.log(cliente);

        let fotoPerfil = cliente.foto_perfil
            ? `http://localhost:3000${cliente.foto_perfil}`
            : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

        // 🔹 Verificar fecha
        let fechaFormateada = "Pendiente"; // valor por defecto
        let botonDeshabilitado = "";
        if (cliente.fecha_prestamo) {
            let fecha = new Date(cliente.fecha_prestamo);
            const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
            fechaFormateada = `${String(fecha.getDate()).padStart(2, '0')}/${meses[fecha.getMonth()]}/${fecha.getFullYear()}`;
        } else {
            // 🔹 Si no hay fecha, el botón se deshabilita
            botonDeshabilitado = "disabled";
        }

        resultados += `
    <tr>
        <td>
            <div class="d-flex align-items-center px-2 py-1">
                <div>
                    <img src="${fotoPerfil}" 
                        class="avatar avatar-lg me-3 foto-cliente" 
                        alt="${cliente.nombres}" 
                        data-src="${fotoPerfil}"
                        onerror="this.src='https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'">
                </div>
                <div class="d-flex flex-column justify-content-center">
                    <span class="text-xs font-weight-bold text-dark mb-1">${cliente.nombres} ${cliente.apellidos}</span>
                    <span class="text-xs text-dark">${cliente.telefono}</span>
                </div>
            </div>
        </td>
        <td class="align-middle text-center">
            <p class="text-sm text-dark">${cliente.cedula}</p>
        </td>
        <td class="align-middle text-center">
            <p class="text-sm text-dark">${formatCurrency(cliente.valor_total)}</p>
        </td>
        <td class="align-middle text-center">
            <p class="text-sm text-dark">${fechaFormateada}</p>
        </td>
        <td class="align-middle text-center">
            <button class="btn btn-md btn-info" data-bs-toggle="modal" data-bs-target="#modalCredito"
                onclick="verCredito('${cliente.id_creditos}')" ${botonDeshabilitado}>
                <i class="fas fa-eye"></i> Ver Crédito
            </button>
        </td>
    </tr>`;
    });





    $('#tablaCreditos tbody').html(resultados);

    // Inicializar DataTable
    $('#tablaCreditos').DataTable({
        pageLength: 4,
        lengthMenu: [4, 8, 16, 25, 50, 100],
        order: [[3, 'desc']],
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
}


//VER FOTO
$(document).on('click', '.foto-cliente', function () {
    const src = $(this).data('src');
    $('#imagen-modal').attr('src', src);

    const modal = new bootstrap.Modal(document.getElementById('modalFoto'));
    modal.show();
});


// Función para formatear moneda
function formatCurrency(amount) {
    if (!amount) return '$0';
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Función para calcular valores del crédito
function calcularValoresCredito(valorPrestado, interesPrestado) {
    const valor = Number(valorPrestado);   // ya es entero
    const interes = Number(interesPrestado);

    const interesPagado = valor * (interes / 100);
    const valorTotal = valor + interesPagado;

    // Formatear en pesos colombianos SIN decimales
    const formatoPesos = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    return {
        interesPagado: formatoPesos.format(interesPagado),
        valorTotal: formatoPesos.format(valorTotal)
    };
}


// Función para mostrar u ocultar el modal
function toggleCreditModal(show) {
    const modal = new bootstrap.Modal(document.getElementById('creditCardModal'));
    if (show) {
        modal.show();
    } else {
        modal.hide();
    }
}

// Función principal para cargar datos del crédito
async function verCredito(idCredito) {
    try {
        let response = await fetch(`http://localhost:3000/api/cartera/${idCredito}`,
            { headers: { "Authorization": `Bearer ${token}` } }
        );
        let data = await response.json();



        // Formatear fecha
        let fecha = new Date(data.fecha_prestamo);
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
            "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        let fechaFormateada = `${String(fecha.getDate()).padStart(2, '0')}/${meses[fecha.getMonth()]}/${fecha.getFullYear()}`;

        // Calcular valores financieros
        const valores = calcularValoresCredito(data.valor_prestado, data.interes_prestado);

        // Rellenar la tarjeta
        document.getElementById("numeroCredito").textContent = "CRÉDITO #" + data.id_creditos;
        document.getElementById("numeroTelefono").textContent = "TEL: " + data.telefono;
        document.getElementById("nombreCliente").textContent = data.nombres + " " + data.apellidos;
        document.getElementById("fechaCredito").textContent = fechaFormateada;
        document.getElementById("cedulaCliente").textContent = data.cedula;
        document.getElementById("valorCredito").textContent = valores.valorTotal;
        document.getElementById("obsCredito").innerHTML = `<strong>${data.observacion_opcion}</strong> - ${data.obs_credito}`;

        // Cargar foto del cliente si existe
        if (data.foto_perfil) {
            document.getElementById("fotoCliente").src = "http://localhost:3000" + data.foto_perfil;
        }

        // Rellenar información financiera
        document.getElementById("capitalPrestado").textContent = formatCurrency(data.valor_prestado);
        document.getElementById("interesPrestado").textContent = data.interes_prestado + "%";
        document.getElementById("interesPagado").textContent = valores.interesPagado;
        document.getElementById("valorTotalCredito").textContent = valores.valorTotal;

        // Rellenar información del asesor si existe
        if (data.asesor) {
            document.getElementById("asesorCredito").textContent = data.asesor;
            document.getElementById("comisionAsesor").textContent = formatCurrency(data.comision_asesor);
            document.getElementById("infoAsesor").style.display = 'block';

            // Crear iniciales para el avatar
            const iniciales = data.asesor.split(' ').map(n => n[0]).join('').toUpperCase();
            document.querySelector(".advisor-avatar").textContent = iniciales;
        } else {
            document.getElementById("infoAsesor").style.display = 'none';
        }

        // Mostrar el modal
        toggleCreditModal(true);

    } catch (error) {
        console.error("Error al cargar el crédito:", error);
        alert("Error al cargar la información del crédito");
    }
}

// Añadir evento de cierre al modal
document.getElementById('creditCardModal').addEventListener('hidden.bs.modal', function () {

});



function getRangoFechasMesActual() {
    const hoy = new Date();

    // Primer día del mes (ej: 2025-09-01 00:00:00)
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fechaInicio = `${primerDia.getFullYear()}-${String(primerDia.getMonth() + 1).padStart(2, '0')}-${String(primerDia.getDate()).padStart(2, '0')} 00:00:00`;

    // Día actual (ej: 2025-09-29 23:59:59)
    const fechaFin = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')} 23:59:59`;

    return { fechaInicio, fechaFin };
}


async function cargarComisiones() {
    const { fechaInicio, fechaFin } = getRangoFechasMesActual();

    try {
        const response = await fetch("http://localhost:3000/api/comisiones", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ fechaInicio, fechaFin })
        });

        const result = await response.json();

        if (result.success) {
            const tbody = document.querySelector("#tablaComisiones tbody");
            tbody.innerHTML = ""; // limpiar la tabla

            result.data.forEach(row => {
                // ⚠️ Si el asesor es null, no renderizamos esa fila
                if (!row.asesor) return;

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td class="text-center text-dark">${row.asesor}</td>
                    <td class="text-center text-dark">${row.total_creditos}</td>
                    <td class="text-center text-dark">$ ${new Intl.NumberFormat('es-CO').format(row.total_comision)}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            console.error("Error en backend:", result.message);
        }
    } catch (error) {
        console.error("Error cargando comisiones:", error);
    }
}


// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", cargarComisiones);
