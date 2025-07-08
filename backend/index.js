const express = require('express');
const app = express();
const PORT = 5000;

app.use(express.json());

app.get('/api', (req, res) => {
    res.json({ message: 'API funcionando!' });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
