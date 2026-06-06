// Función para generar contenido dinámico según la página
function showPage(pageId) {
    const area = document.getElementById('content-area');
    area.innerHTML = ''; // Limpiar contenido actual

    if(pageId === 'code') {
        let html = '<h1>Centro de Códigos</h1>';
        appData.codes.forEach(c => {
            html += `
                <div class="glass-card">
                    <h3>${c.desc}</h3>
                    <div class="code-box">
                        <code>${c.name}</code>
                        <button onclick="copyCode('${c.name}')">COPIAR</button>
                    </div>
                </div>`;
        });
        area.innerHTML = html;
    } else if (pageId === 'seller') {
        let html = '<h1>Vendedores Verificados</h1>';
        appData.sellers.forEach(s => {
            html += `<div class="glass-card"><p>${s.name} - <strong>${s.status}</strong></p></div>`;
        });
        area.innerHTML = html;
    } else {
        area.innerHTML = `<h1>Página: ${pageId.toUpperCase()}</h1><div class="glass-card"><p>Contenido en desarrollo...</p></div>`;
    }

    // Cerrar menú tras hacer clic
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

// Lógica de Copiado
function copyCode(c) {
    navigator.clipboard.writeText(c);
    alert("Código copiado: " + c);
}

// Inicialización del Menú
document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.getElementById('menu-items');
    const pages = ['inicio', 'venta', 'code', 'seller', 'helpgate', 'builds'];
    
    pages.forEach(p => {
        menuItems.innerHTML += `<li><a href="#" onclick="showPage('${p}')">${p.toUpperCase()}</a></li>`;
    });
});
