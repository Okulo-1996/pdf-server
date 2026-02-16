const express = require('express');
const pdf = require('html-pdf');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/generate-pdf', (req, res) => {
    const { htmlContent } = req.body;
    
    const options = { format: 'A4' };
    pdf.create(htmlContent, options).toBuffer((err, buffer) => {
        if (err) {
            return res.status(500).send('Error generating PDF');
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.send(buffer);
    });
});

app.listen(port, () => {
    console.log(`PDF server running at http://localhost:${port}`);
});
