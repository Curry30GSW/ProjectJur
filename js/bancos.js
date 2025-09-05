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
        const url = 'http://localhost:3000/api/clientes-cartera-banco';

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
    if ($.fn.DataTable.isDataTable('#tablaCreditosBancos')) {
        $('#tablaCreditosBancos').DataTable().clear().destroy();
    }

    // Limpiar el tbody
    $("#tablaCreditosBancos tbody").html('');

    let resultados = '';

    clientes.forEach((cliente) => {


        let fotoPerfil = cliente.foto_perfil ?
            `http://localhost:3000${cliente.foto_perfil}` :
            'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

        // 🔹 Formatear fecha a dd/Mmm/yyyy
        let fecha = new Date(cliente.fecha_banco);
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
            "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        let fechaFormateada = `${String(fecha.getDate()).padStart(2, '0')}/${meses[fecha.getMonth()]}/${fecha.getFullYear()}`;

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
            <p class="text-sm text-dark">${formatCurrency(cliente.monto_aprobado)}</p>
        </td>
        <td class="align-middle text-center">
            <p class="text-sm text-dark">${cliente.banco}</p>
        </td>
        <td class="align-middle text-center">
            <p class="text-sm text-dark">${fechaFormateada}</p>
        </td>
        <td class="align-middle text-center">
    <button class="btn btn-md btn-info" data-bs-toggle="modal" data-bs-target="#modalCredito"
            onclick="verCreditoBanco('${cliente.id_banco}')">
        <i class="fas fa-eye"></i> Ver Crédito
    </button>
</td>

    </tr>`;
    });



    $('#tablaCreditosBancos tbody').html(resultados);

    // Inicializar DataTable
    $('#tablaCreditosBancos').DataTable({
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





// Función principal para cargar datos del crédito bancario
async function verCreditoBanco(idBanco) {
    try {
        let response = await fetch(`http://localhost:3000/api/cartera-banco/${idBanco}`);
        let data = await response.json();

        console.log(data);

        // Formatear fecha
        let fecha = new Date(data.fecha_banco);
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
            "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        let fechaFormateada = `${String(fecha.getDate()).padStart(2, '0')}/${meses[fecha.getMonth()]}/${fecha.getFullYear()}`;

        // 🧑‍💼 Info del cliente
        document.getElementById("nombreCliente").textContent = `${data.nombres} ${data.apellidos}`;
        document.getElementById("cedulaCliente").textContent = data.cedula;
        document.getElementById("telefonoCliente").textContent = data.telefono;
        document.getElementById("bancoCliente").textContent = data.banco;
        document.getElementById("fechaBanco").textContent = fechaFormateada;

        // Foto de perfil
        if (data.foto_perfil) {
            document.getElementById("fotoPerfil").src = "http://localhost:3000" + data.foto_perfil;
        }

        // 💰 Detalles financieros
        document.getElementById("montoSolicitado").textContent = formatCurrency(data.monto_solicitado);
        document.getElementById("montoAprobado").textContent = formatCurrency(data.monto_aprobado);
        document.getElementById("negociacion").textContent = data.negociacion;

        // 👔 Info del asesor
        if (data.asesor_banco) {
            document.getElementById("asesorBanco").textContent = data.asesor_banco;

            // Iniciales para el avatar
            const iniciales = data.asesor_banco
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase();

            document.querySelector(".advisor-avatar").textContent = iniciales;
        }

        // Mostrar modal
        toggleCreditModal(true);

    } catch (error) {
        console.error("Error al cargar el crédito:", error);
        alert("Error al cargar la información del crédito");
    }
}



function toggleCreditModal(show) {
    const modal = new bootstrap.Modal(document.getElementById('bankCreditModal'));
    if (show) {
        modal.show();
    } else {
        modal.hide();
    }
}