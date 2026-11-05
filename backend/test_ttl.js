const tls = require('node:tls');

const host = 'ac-6umu7mb-shard-00-00.w1ameut.mongodb.net';

const socket = tls.connect({
    host,
    port: 27017,
    servername: host,
    rejectUnauthorized: true
});

socket.on('secureConnect', () => {
    console.log('TLS connection successful!');
    console.log('Protocol:', socket.getProtocol());
    socket.end();
});

socket.on('error', (error) => {
    console.error('TLS connection failed:', error);
});