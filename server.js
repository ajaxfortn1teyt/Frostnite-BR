const express = require('express');
const server = express();

server.all(`/`, (req, res) => {
    res.send(`!`);
});

function keepAlive() {
    server.listen(3000, () => {
        console.log('Creators:frostnite and moon')
    });
}

module.exports = keepAlive;