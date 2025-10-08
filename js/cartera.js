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
});


const requestOptions = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
};

//VER FOTO
$(document).on('click', '.foto-cliente', function () {
    const src = $(this).data('src');
    $('#imagen-modal').attr('src', src);

    const modal = new bootstrap.Modal(document.getElementById('modalFoto'));
    modal.show();
});



document.addEventListener("DOMContentLoaded", async () => {
    const listaClientes = document.getElementById("lista-clientes");
    const modalTitulo = document.getElementById("modalClienteTitulo");

    try {
        const response = await fetch("http://localhost:3000/api/cuotas/pendientes", {
            ...requestOptions
        });
        const clientes = await response.json();

        // Renderizar filas de clientes
        clientes.forEach(cliente => {
            const cuotasPendientes = Number(cliente.cuotas_pendientes);
            const estadoGeneral = cuotasPendientes === 0 ? "PAGÓ" : "CON DEUDA";
            const colorEstado = cuotasPendientes === 0 ? "bg-success" : "bg-warning";


            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <div class="d-flex align-items-center px-2 py-1">
                        <div>
                            <img src="http://localhost:3000${cliente.foto_perfil || '/uploads/fotoPerfil/default.jpg'}" 
                                class="avatar avatar-lg me-3 foto-cliente" 
                                alt="${cliente.nombres}"
                                data-src="http://localhost:3000${cliente.foto_perfil}">
                        </div>
                        <div class="d-flex flex-column justify-content-center">
                            <h6 class="mb-0 text-sm">${cliente.nombres} ${cliente.apellidos}</h6>
                            <p class="text-sm text-secondary mb-0">C.C: ${cliente.cedula}</p>
                        </div>
                    </div>
                </td>
                <td class="text-center text-dark">${cliente.telefono}</td>
                <td class="text-center text-dark">$${parseFloat(cliente.valor_insolvencia).toLocaleString()}</td>
                <td class="text-center text-dark">${cliente.cuotas_pendientes}</td>
                <td class="text-center">
                        <span class="badge ${colorEstado}">${estadoGeneral}</span>
                </td>
                <td class="text-center">
                    <button class="btn btn-info btn-md ver-mas" data-id="${cliente.id_cliente}">
                        <i class="fas fa-eye me-1"></i> Ver más
                    </button>
                </td>`;
            listaClientes.appendChild(tr);
        });

        // Inicializar DataTable
        $('#tabla-clientes').DataTable({
            pageLength: 5,
            lengthMenu: [5, 15, 20, 50, 100],
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

        // 👉 Evento para abrir modal con detalle
        listaClientes.addEventListener("click", async (e) => {
            if (e.target.classList.contains("ver-mas")) {
                const id = e.target.getAttribute("data-id");

                // Traer detalle de cuotas del cliente seleccionado
                const respDetalle = await fetch(`http://localhost:3000/api/cuotas/pendientes/${id}`, {
                    ...requestOptions
                });
                const cuotas = await respDetalle.json();

                if (!cuotas.length) return;

                const cliente = cuotas[0];
                clienteSeleccionado = cliente;
                modalTitulo.textContent = `Estado de Deuda - ${cliente.nombres} ${cliente.apellidos}`;

                // Calcular totales
                const totalPendiente = cuotas
                    .filter(c => c.estado === "PENDIENTE" || c.estado === "PARCIAL")
                    .reduce((sum, c) => {
                        const valor = c.estado === "PARCIAL" ? parseFloat(c.saldo_pendiente) : parseFloat(c.valor_cuota);
                        return sum + valor;
                    }, 0);

                const cuotasPendientes = cuotas.filter(c => c.estado === "PENDIENTE" || c.estado === "PARCIAL").length;
                const cuotasPagadas = cuotas.filter(c => c.estado === "PAGADA").length;

                // Renderizar contenido del modal
                const contenedor = document.getElementById("contenedorCuotas");
                contenedor.innerHTML = `
                    <div class="cliente-card">
                        <div class="d-flex align-items-center mb-3">
                            <img src="http://localhost:3000${cliente.foto_perfil}" 
                                alt="Foto de ${cliente.nombres}" 
                                class="rounded-circle me-3" 
                                width="90" height="90" 
                                style="object-fit: cover;">
                            <div>
                                <p><strong>Cédula:</strong> ${cliente.cedula}</p>
                                <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                                <p><strong>Valor Insolvencia:</strong> $${parseFloat(cliente.valor_insolvencia).toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div class="resumen-deuda">
                            <h6>Total Pendiente</h6>
                            <div class="total">$${totalPendiente.toLocaleString()}</div>
                        </div>
                    </div>
                    
                    <div class="abono-box my-4">
                        <label for="montoAbono" class="form-label">
                            <i class="fas fa-money-bill-wave"></i> Ingresar Abono
                        </label>
                        <div class="input-group permiso-cartera">
                            <span class="input-group-text">$</span>
                            <input type="text" class="form-control" id="montoAbono" placeholder="0.00">
                            <button class="btn btn-success" id="btnRegistrarAbono">
                                <i class="fas fa-check-circle me-2"></i> Registrar
                            </button>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th># Cuota</th>
                                    <th>Valor</th>
                                    <th>Fecha Pago</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${cuotas.map(c => {
                    let color = "bg-success";
                    if (c.estado === "PENDIENTE") color = "bg-warning";
                    if (c.estado === "PARCIAL") color = "bg-info";

                    let valorMostrar = c.estado === "PARCIAL" ? c.saldo_pendiente : c.valor_cuota;

                    return `
                                        <tr>
                                            <td class="text-dark">${c.numero_cuota}</td>
                                            <td class="text-dark">$${parseFloat(valorMostrar).toLocaleString()}</td>
                                            <td class="text-dark">${formatearFechaSql(c.fecha_programada)}</td>
                                            <td class="text-dark">
                                                <span class="badge ${color}">${c.estado}</span>
                                            </td>
                                            <td class="text-center">
                                                ${c.estado !== "PAGADA" ? `
                                                    <button class="btn btn-md btn-success btnMarcarPagada permiso-cartera" 
                                                        data-id="${c.id_cuota}" 
                                                        data-id-cliente="${cliente.id_cliente}"
                                                        data-valor="${valorMostrar}">
                                                        <i class="fas fa-check"></i> Pagar
                                                    </button>`
                            : ""}
                                            </td>
                                        </tr>
                                    `;
                }).join("")}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="d-flex justify-content-between mt-3 text-center">
                        <div>
                            <div class="fw-bold">${cuotas.length}</div>
                            <small class="text-muted">Total Cuotas</small>
                        </div>
                        <div>
                            <div class="fw-bold text-success">${cuotasPagadas}</div>
                            <small class="text-muted">Pagadas</small>
                        </div>
                        <div>
                            <div class="fw-bold text-warning">${cuotasPendientes}</div>
                            <small class="text-muted">Pendientes</small>
                        </div>
                    </div>
                `;

                aplicarPermisosUI();
                // Mostrar modal
                const modal = new bootstrap.Modal(document.getElementById("modalDetalleCliente"));
                modal.show();
            }
        });

    } catch (error) {
        console.error("Error al cargar clientes:", error);
        listaClientes.innerHTML = `<tr><td colspan="6"><div class="alert alert-danger">No se pudieron cargar los clientes.</div></td></tr>`;
    }
});



function formatearFechaSql(fechaStr) {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const fecha = new Date(fechaStr);
    const dia = fecha.getDate().toString().padStart(2, "0");
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}


// Función para formatear a pesos
function formatearPesos(valor) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0
    }).format(valor);
}

// Formatear input de abono en tiempo real
document.addEventListener("input", (e) => {
    if (e.target && e.target.id === "montoAbono") {
        let valor = e.target.value.replace(/\D/g, "");
        if (valor === "") {
            e.target.value = "";
            return;
        }
        e.target.value = formatearPesos(valor);
    }
});



// Variable global para guardar el cliente abierto en modal
let clienteSeleccionado = null;

//Registrar abono
document.addEventListener("click", async (e) => {
    if (e.target && e.target.id === "btnRegistrarAbono") {

        if (!clienteSeleccionado) {
            return Swal.fire({
                icon: "warning",
                title: "Atención",
                text: "No hay cliente seleccionado."
            });
        }

        let raw = document.getElementById("montoAbono")?.value || "";
        let limpio = raw.replace(/[^\d]/g, "");
        let monto = parseFloat(limpio);

        if (!monto || isNaN(monto) || monto <= 0) {
            return Swal.fire({
                icon: "error",
                title: "Monto inválido",
                text: "Ingrese un monto válido."
            });
        }

        const payload = {
            id_cliente: clienteSeleccionado.id_cliente,
            monto: monto
        };

        try {
            const resp = await fetch("http://localhost:3000/api/cartera/abonar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await resp.json();

            if (data.success) {
                Swal.fire({
                    icon: "success",
                    title: "¡Éxito!",
                    text: "Abono registrado correctamente",
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false
                }).then(() => {
                    // ✅ Usar clienteSeleccionado para recargar
                    recargarCuotasCliente(clienteSeleccionado.id_cliente);

                    // ✅ Limpiar input después del abono
                    const inputAbono = document.getElementById("montoAbono");
                    if (inputAbono) inputAbono.value = "";
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: data.message || "Error al registrar abono"
                });
            }

        } catch (err) {
            console.error("Error al procesar el abono:", err);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Error al procesar el abono."
            });
        }
    }
});

// Función para recargar cuotas de un cliente específico
async function recargarCuotasCliente(id_cliente) {
    try {
        const resp = await fetch(`http://localhost:3000/api/cuotas/pendientes/${id_cliente}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                }
            });
        const cuotas = await resp.json();


        if (!cuotas.length) return;

        // Construir objeto cliente
        const cliente = {
            id_cliente,
            nombres: cuotas[0].nombres,
            apellidos: cuotas[0].apellidos,
            cedula: cuotas[0].cedula,
            telefono: cuotas[0].telefono,
            valor_insolvencia: cuotas[0].valor_insolvencia,
            foto_perfil: cuotas[0].foto_perfil || "/uploads/fotoPerfil/default.jpg",
            cuotas
        };

        // Ordenar cuotas
        cliente.cuotas.sort((a, b) => a.numero_cuota - b.numero_cuota);

        // Actualizar contenido del modal
        const contenedor = document.getElementById("contenedorCuotas");

        // Total pendiente considerando PENDIENTE y PARCIAL
        const totalPendiente = cliente.cuotas
            .filter(c => c.estado === "PENDIENTE" || c.estado === "PARCIAL")
            .reduce((sum, c) => {
                const valor = c.estado === "PARCIAL" ? parseFloat(c.saldo_pendiente) : parseFloat(c.valor_cuota);
                return sum + valor;
            }, 0);

        const cuotasPendientes = cliente.cuotas.filter(c => c.estado === "PENDIENTE").length;
        const cuotasPagadas = cliente.cuotas.filter(c => c.estado === "PAGADA").length;

        contenedor.innerHTML = `
            <div class="cliente-card">
                <div class="d-flex align-items-center mb-3">
                    <img src="http://localhost:3000${cliente.foto_perfil}" 
                        alt="Foto de ${cliente.nombres}" 
                        class="rounded-circle me-3" 
                        width="90" height="90" 
                        style="object-fit: cover;">
                    <div>
                        <p><strong>Cédula:</strong> ${cliente.cedula}</p>
                        <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                        <p><strong>Valor Insolvencia:</strong> $${parseFloat(cliente.valor_insolvencia).toLocaleString()}</p>
                    </div>
                </div>
                
                <div class="resumen-deuda">
                    <h6>Total Pendiente</h6>
                    <div class="total">$${totalPendiente.toLocaleString()}</div>
                </div>
            </div>
            
            <div class="abono-box my-4">
                <label for="montoAbono" class="form-label">
                    <i class="fas fa-money-bill-wave"></i> Ingresar Abono
                </label>
                <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input type="text" class="form-control" id="montoAbono" placeholder="0.00">
                    <button class="btn btn-success" id="btnRegistrarAbono">
                        <i class="fas fa-check-circle me-2"></i> Registrar
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th># Cuota</th>
                            <th>Valor</th>
                            <th>Fecha Pago</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cliente.cuotas.map(c => {
            let color = "bg-success";
            if (c.estado === "PENDIENTE") color = "bg-warning";
            if (c.estado === "PARCIAL") color = "bg-info";
            let valorMostrar = c.estado === "PARCIAL" ? c.saldo_pendiente : c.valor_cuota;
            return `
                                <tr>
                                    <td class="text-dark">${c.numero_cuota}</td>
                                    <td class="text-dark">$${parseFloat(valorMostrar).toLocaleString()}</td>
                                    <td class="text-dark">${formatearFechaSql(c.fecha_programada)}</td>
                                    <td class="text-dark">
                                        <span class="badge ${color}">${c.estado}</span>
                                    </td>
                                    <td class="text-center">
                                        ${c.estado !== "PAGADA" ? `
                                            <button class="btn btn-md btn-success btnMarcarPagada" 
                                                data-id="${c.id_cuota}" 
                                                data-valor="${valorMostrar}">
                                                <i class="fas fa-check"></i> Pagar
                                            </button>`
                    : ""}
                                    </td>
                                </tr>
                            `;
        }).join("")}
                    </tbody>
                </table>
            </div>
            
            <div class="d-flex justify-content-between mt-3 text-center">
                <div>
                    <div class="fw-bold">${cliente.cuotas.length}</div>
                    <small class="text-muted">Total Cuotas</small>
                </div>
                <div>
                    <div class="fw-bold text-success">${cuotasPagadas}</div>
                    <small class="text-muted">Pagadas</small>
                </div>
                <div>
                    <div class="fw-bold text-warning">${cuotasPendientes}</div>
                    <small class="text-muted">Pendientes</small>
                </div>
            </div>
        `;
    } catch (err) {
        console.error("Error al recargar cuotas del cliente:", err);
    }
}

// Marcar cuota como pagada
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("btnMarcarPagada")) {
        const id_cuota = e.target.getAttribute("data-id");
        const valor = e.target.getAttribute("data-valor");

        Swal.fire({
            title: "Confirmar pago",
            text: `¿Desea marcar esta cuota como PAGADA? (Valor: $${parseFloat(valor).toLocaleString()})`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, pagar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#28a745",
            cancelButtonColor: "#6c757d",
            focusCancel: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const resp = await fetch("http://localhost:3000/api/cuota/actualizar", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            id_cuota: id_cuota,
                            estado: "PAGADA",
                            saldo_pendiente: 0
                        })
                    });

                    const data = await resp.json();
                    if (data.success) {
                        Swal.fire({
                            icon: "success",
                            title: "Éxito",
                            text: "Cuota marcada como pagada"
                        }).then(() => {
                            recargarCuotasCliente(parseInt(e.target.closest("button").getAttribute("data-id-cliente")));
                        });
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Error",
                            text: data.message || "No se pudo actualizar la cuota"
                        });
                    }
                } catch (err) {
                    console.error("Error:", err);
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "Error en el servidor"
                    });
                }
            }
        });
    }
});
