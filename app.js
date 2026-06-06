// ... (mantiene las funciones anteriores) ...

// Eventos de cierre
document.getElementById('close-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
});

// Función de navegación con más secciones
function showPage(pageId) {
    const area = document.getElementById('content-area');
    area.innerHTML = `<h1>${pageId.toUpperCase()}</h1>`;
    
    if(pageId === 'code') {
        appData.codes.forEach(c => {
            area.innerHTML += `<div class="glass-card"><h3>${c.desc}</h3><div class="code-box"><code>${c.name}</code><button onclick="copyCode('${c.name}')">COPIAR</button></div></div>`;
        });
    } else if (pageId === 'seller') {
        appData.sellers.forEach(s => {
            area.innerHTML += `<div class="glass-card"><p>Vendedor: <strong>${s.name}</strong><br>Estado: ${s.status}</p></div>`;
        });
    } else {
        area.innerHTML += `<div class="glass-card"><p>Contenido para ${pageId} próximamente...</p></div>`;
    }

    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}
