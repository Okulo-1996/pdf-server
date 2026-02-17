const express = require('express');
const PDFDocument = require('pdfkit');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
    const stampPath = path.join(__dirname, 'public', 'stamp.png');
    const stampAvailable = fs.existsSync(stampPath);
    
    console.log('📋 Health check:', {
        stampAvailable,
        stampPath,
        files: fs.readdirSync(__dirname),
        publicFiles: fs.existsSync(path.join(__dirname, 'public')) ? 
                    fs.readdirSync(path.join(__dirname, 'public')) : []
    });
    
    res.json({ 
        status: 'online', 
        message: 'I&L PDF Server is running',
        stampAvailable: stampAvailable,
        serverTime: new Date().toISOString()
    });
});

// Debug endpoint to test stamp
app.get('/debug/stamp', (req, res) => {
    const stampPath = path.join(__dirname, 'public', 'stamp.png');
    
    try {
        const exists = fs.existsSync(stampPath);
        
        if (!exists) {
            return res.json({
                error: 'Stamp not found',
                path: stampPath,
                rootFiles: fs.readdirSync(__dirname),
                publicFiles: fs.existsSync(path.join(__dirname, 'public')) ? 
                            fs.readdirSync(path.join(__dirname, 'public')) : []
            });
        }
        
        const stats = fs.statSync(stampPath);
        const imageBuffer = fs.readFileSync(stampPath);
        const base64Image = imageBuffer.toString('base64').substring(0, 50) + '...';
        
        res.json({
            success: true,
            message: 'Stamp found',
            path: stampPath,
            size: stats.size,
            exists: true,
            isFile: stats.isFile(),
            preview: base64Image
        });
        
    } catch (error) {
        res.json({
            error: error.message,
            path: stampPath
        });
    }
});

// Generate PDF endpoint
app.post('/generate-pdf', (req, res) => {
    try {
        const { customer, loans, payments, company } = req.body;
        
        // Create a PDF document
        const doc = new PDFDocument({ 
            margin: 50, 
            size: 'A4',
            bufferPages: true,
            autoFirstPage: true
        });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=statement_${customer.name.replace(/\s+/g, '_')}.pdf`);
        
        // Pipe the PDF to the response
        doc.pipe(res);
        
        // ========== HEADER SECTION ==========
        doc.fontSize(22)
           .fillColor('#2563eb')
           .font('Helvetica-Bold')
           .text(company.name, { align: 'center' });
        
        doc.moveDown(0.5);
        doc.fontSize(12)
           .fillColor('#64748b')
           .font('Helvetica-Oblique')
           .text(company.slogan, { align: 'center' });
        
        doc.moveDown(0.5);
        doc.fontSize(10)
           .fillColor('#1e293b')
           .font('Helvetica')
           .text(`Contact: ${company.contacts.join(' | ')}`, { align: 'center' })
           .text(`Email: ${company.email}`, { align: 'center' });
        
        // Decorative line
        doc.moveDown(0.5)
           .strokeColor('#2563eb')
           .lineWidth(1)
           .moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke();
        
        doc.moveDown(1);
        doc.fontSize(10)
           .fillColor('#64748b')
           .text(`Statement Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, { align: 'center' });
        
        // ========== CUSTOMER INFORMATION ==========
        doc.moveDown(1);
        doc.fontSize(14)
           .fillColor('#1e293b')
           .font('Helvetica-Bold')
           .text('CUSTOMER INFORMATION', { align: 'center' });
        
        doc.moveDown(0.5);
        doc.fontSize(10)
           .font('Helvetica');
        
        // Create two columns for customer info
        const startY = doc.y;
        doc.text(`Full Name: ${customer.name}`, 50, startY)
           .text(`Phone Number: ${customer.phone}`, 50, startY + 20)
           .text(`National ID: ${customer.idNumber}`, 50, startY + 40);
        
        doc.text(`Email: ${customer.email}`, 300, startY)
           .text(`Address: ${customer.address}`, 300, startY + 20);
        
        doc.y = startY + 70;
        
        // ========== LOAN SUMMARY ==========
        let totalBorrowed = 0;
        let totalPaid = 0;
        let totalDue = 0;
        let totalInterest = 0;
        
        loans.forEach(loan => {
            totalBorrowed += loan.amount;
            totalInterest += loan.totalInterest || 0;
            totalPaid += ((loan.totalRepayment || loan.amount + (loan.amount * 0.2 * loan.term)) - loan.balance);
            totalDue += loan.balance;
        });
        
        doc.moveDown(1);
        doc.fontSize(14)
           .fillColor('#1e293b')
           .font('Helvetica-Bold')
           .text('LOAN SUMMARY', { align: 'center' });
        
        doc.moveDown(0.5);
        
        const summaryY = doc.y;
        const summaryData = [
            ['Total Loans:', loans.length.toString()],
            ['Total Borrowed:', formatCurrency(totalBorrowed)],
            ['Total Interest:', formatCurrency(totalInterest)],
            ['Total Paid:', formatCurrency(totalPaid)],
            ['Total Due:', formatCurrency(totalDue)]
        ];
        
        // Draw summary box
        doc.rect(50, summaryY, 500, 120).stroke('#e2e8f0');
        
        summaryData.forEach((item, index) => {
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .fillColor('#1e293b')
               .text(item[0], 70, summaryY + 15 + (index * 20))
               .font('Helvetica')
               .fillColor('#2563eb')
               .text(item[1], 200, summaryY + 15 + (index * 20));
        });
        
        doc.y = summaryY + 140;
        
        // ========== LOAN DETAILS TABLE ==========
        if (loans.length > 0) {
            doc.moveDown(1);
            doc.fontSize(14)
               .fillColor('#1e293b')
               .font('Helvetica-Bold')
               .text('LOAN DETAILS', { align: 'center' });
            
            doc.moveDown(0.5);
            
            const tableTop = doc.y;
            const headers = ['Loan ID', 'Amount', 'Term', 'Monthly', 'Balance', 'Status'];
            const colWidths = [80, 90, 60, 90, 90, 80];
            
            // Draw header background
            doc.rect(50, tableTop - 5, 500, 20).fill('#2563eb');
            
            // Draw headers
            let xPos = 55;
            headers.forEach((header, i) => {
                doc.fillColor('#ffffff')
                   .font('Helvetica-Bold')
                   .fontSize(9)
                   .text(header, xPos, tableTop, { width: colWidths[i], align: 'left' });
                xPos += colWidths[i];
            });
            
            // Draw rows
            let yPos = tableTop + 20;
            loans.forEach((loan, index) => {
                if (index % 2 === 0) {
                    doc.rect(50, yPos - 5, 500, 20).fill('#f8fafc');
                }
                
                xPos = 55;
                const rowData = [
                    `L${loan.id.toString().slice(-4)}`,
                    formatCurrency(loan.amount),
                    `${loan.term} months`,
                    formatCurrency(loan.monthlyPayment),
                    formatCurrency(loan.balance),
                    loan.status.toUpperCase()
                ];
                
                rowData.forEach((data, i) => {
                    doc.fillColor('#1e293b')
                       .font('Helvetica')
                       .fontSize(9)
                       .text(data, xPos, yPos, { width: colWidths[i], align: 'left' });
                    xPos += colWidths[i];
                });
                
                yPos += 20;
            });
            
            doc.y = yPos + 20;
        }
        
        // ========== PAYMENT HISTORY ==========
        if (payments.length > 0) {
            doc.moveDown(1);
            doc.fontSize(14)
               .fillColor('#1e293b')
               .font('Helvetica-Bold')
               .text('PAYMENT HISTORY', { align: 'center' });
            
            doc.moveDown(0.5);
            
            const tableTop = doc.y;
            const payHeaders = ['Date', 'Amount', 'Method', 'Reference'];
            const payColWidths = [120, 120, 120, 140];
            
            // Draw header background
            doc.rect(50, tableTop - 5, 500, 20).fill('#0891b2');
            
            // Draw headers
            xPos = 55;
            payHeaders.forEach((header, i) => {
                doc.fillColor('#ffffff')
                   .font('Helvetica-Bold')
                   .fontSize(9)
                   .text(header, xPos, tableTop, { width: payColWidths[i], align: 'left' });
                xPos += payColWidths[i];
            });
            
            // Draw payment rows
            yPos = tableTop + 20;
            payments.forEach((payment, index) => {
                if (index % 2 === 0) {
                    doc.rect(50, yPos - 5, 500, 20).fill('#f8fafc');
                }
                
                xPos = 55;
                const payData = [
                    new Date(payment.date).toLocaleDateString(),
                    formatCurrency(payment.amount),
                    payment.method.toUpperCase(),
                    payment.reference
                ];
                
                payData.forEach((data, i) => {
                    doc.fillColor('#1e293b')
                       .font('Helvetica')
                       .fontSize(9)
                       .text(data, xPos, yPos, { width: payColWidths[i], align: 'left' });
                    xPos += payColWidths[i];
                });
                
                yPos += 20;
            });
            
            doc.y = yPos + 20;
        }
        
        // ========== COMPANY STAMP AND SIGNATURE ==========
        // Add some space
        doc.moveDown(3);
        
        // Save current Y position
        const stampAreaY = doc.y;
        
        // Draw signature line on left
        doc.moveTo(50, stampAreaY + 40)
           .lineTo(200, stampAreaY + 40)
           .stroke();
        
        doc.fontSize(10)
           .fillColor('#1e293b')
           .text('Authorized Signature', 50, stampAreaY + 45)
           .text('Managing Director', 50, stampAreaY + 55);
        
        // Add date stamp
        doc.fontSize(9)
           .fillColor('#64748b')
           .text(`Digitally Generated: ${new Date().toLocaleString()}`, 50, stampAreaY + 70);
        
        // ========== STAMP IMAGE ON RIGHT SIDE ==========
        const stampPath = path.join(__dirname, 'public', 'stamp.png');
        
        // Check if stamp exists
        if (fs.existsSync(stampPath)) {
            try {
                console.log('✅ Found stamp at:', stampPath);
                
                // Get image dimensions
                const stampImage = doc.openImage(stampPath);
                console.log('📏 Stamp dimensions:', stampImage.width, 'x', stampImage.height);
                
                // Draw stamp box background
                doc.rect(400, stampAreaY, 150, 120)
                   .fillOpacity(0.05)
                   .fill('#2563eb')
                   .fillOpacity(1)
                   .stroke('#2563eb');
                
                // Add "OFFICIAL STAMP" text
                doc.fontSize(10)
                   .fillColor('#2563eb')
                   .font('Helvetica-Bold')
                   .text('OFFICIAL STAMP', 420, stampAreaY + 5, {
                       width: 110,
                       align: 'center'
                   });
                
                // Add the actual stamp image - positioned in the center of the box
                doc.image(stampPath, 435, stampAreaY + 25, {
                    width: 80,
                    height: 80,
                    align: 'center',
                    valign: 'center'
                });
                
                console.log('✅ Stamp added at position:', 435, stampAreaY + 25);
                
            } catch (err) {
                console.error('❌ Error adding stamp:', err);
                // Fallback text stamp
                doc.rect(400, stampAreaY, 150, 120).stroke('#dc2626');
                doc.fontSize(14)
                   .fillColor('#dc2626')
                   .font('Helvetica-Bold')
                   .text('OFFICIAL', 430, stampAreaY + 30)
                   .text('STAMP', 440, stampAreaY + 50)
                   .text('(MISSING)', 430, stampAreaY + 70);
            }
        } else {
            console.log('❌ Stamp not found at:', stampPath);
            // Draw placeholder
            doc.rect(400, stampAreaY, 150, 120).stroke('#dc2626');
            doc.fontSize(14)
               .fillColor('#dc2626')
               .font('Helvetica-Bold')
               .text('STAMP', 440, stampAreaY + 40)
               .text('NOT', 450, stampAreaY + 60)
               .text('FOUND', 440, stampAreaY + 80);
        }
        
        // ========== FOOTER ==========
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            
            // Footer line
            doc.strokeColor('#e2e8f0')
               .lineWidth(1)
               .moveTo(50, 780)
               .lineTo(550, 780)
               .stroke();
            
            // Footer text
            doc.fontSize(8)
               .fillColor('#64748b')
               .text('I&L Lending Services - Official Statement', 50, 790)
               .text(`Page ${i + 1} of ${pages.count}`, 500, 790)
               .text('Confidential - For Internal Use Only', 50, 800);
        }
        
        // Finalize PDF
        doc.end();
        console.log('✅ PDF generated successfully');
        
    } catch (error) {
        console.error('❌ PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
    }
});

// Helper function to format currency
function formatCurrency(amount) {
    return 'UGX ' + amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('=================================');
    console.log('🚀 I&L PDF Server starting...');
    console.log('=================================');
    console.log(`📡 Port: ${PORT}`);
    console.log(`📁 Directory: ${__dirname}`);
    console.log(`🔍 Looking for stamp at: ${path.join(__dirname, 'public', 'stamp.png')}`);
    
    // Check if stamp exists
    const stampPath = path.join(__dirname, 'public', 'stamp.png');
    if (fs.existsSync(stampPath)) {
        const stats = fs.statSync(stampPath);
        console.log('✅ STAMP FOUND!');
        console.log(`📏 Size: ${stats.size} bytes`);
    } else {
        console.log('❌ STAMP NOT FOUND!');
        console.log('📂 Files in directory:', fs.readdirSync(__dirname));
        if (fs.existsSync(path.join(__dirname, 'public'))) {
            console.log('📂 Files in public:', fs.readdirSync(path.join(__dirname, 'public')));
        } else {
            console.log('📂 Public folder does not exist!');
        }
    }
    console.log('=================================');
});