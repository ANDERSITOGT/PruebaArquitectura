import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir la carpeta public a la red
app.use(express.static(path.join(__dirname, '../public')));

// Almacenar las PCs conectadas
let usuariosConectados: any[] = [];

io.on('connection', (socket) => {
    console.log(`[+] Nueva conexión detectada. Socket ID: ${socket.id}`);

    // Cuando alguien llena el formulario de conexión
    socket.on('unirse-red', (usuario) => {
        usuario.id = socket.id; // Vinculamos sus datos con su sesión
        usuariosConectados.push(usuario);
        
        // Avisamos a TODOS en la red la nueva lista de topología
        io.emit('actualizar-topologia', usuariosConectados);
        
        // Enviamos el mensaje de sistema a todos
        io.emit('mensaje-sistema', `${usuario.nombre} (${usuario.ip}) se ha unido a la red.`);
    });

    // Cuando alguien envía un mensaje en el chat
    socket.on('enviar-mensaje', (data) => {
        // Retransmitir el mensaje a todas las PCs
        io.emit('nuevo-mensaje', data);
    });

    // Cuando alguien cierra la pestaña o se le va la red
    socket.on('disconnect', () => {
        const usuario = usuariosConectados.find(u => u.id === socket.id);
        if (usuario) {
            usuariosConectados = usuariosConectados.filter(u => u.id !== socket.id);
            io.emit('actualizar-topologia', usuariosConectados);
            io.emit('mensaje-sistema', `${usuario.nombre} (${usuario.ip}) se ha desconectado.`);
        }
        console.log(`[-] Conexión cerrada. Socket ID: ${socket.id}`);
    });
});

// Levantar el servidor en todas las interfaces de red (0.0.0.0)
const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`>> Servidor LAN activo y escuchando en http://0.0.0.0:${PORT}`);
});