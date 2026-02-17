const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "I&L Lending PDF Server Running",
    time: new Date().toISOString(),
  });
});

// PDF Endpoint
app.post("/generate-pdf", (req, res) => {
  try {
    const { customer, loans = [], payments = [] } = req.body;

    if (!customer || !customer.name) {
      return res.status(400).json({ error: "Customer name is required" });
    }

    // ✅ Enable page buffering for footer support
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      bufferPages: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="statement-${customer.name
        .replace(/\s+/g, "_")
        .toLowerCase()}.pdf"`
    );

    doc.pipe(res);

    // ========== HEADER ==========
    doc
      .fontSize(22)
      .fillColor("#2563eb")
      .font("Helvetica-Bold")
      .text("I&L LENDING SERVICES", { align: "center" });

    doc
      .fontSize(12)
      .fillColor("#64748b")
      .font("Helvetica-Oblique")
      .text("We Are Dedicated To Serve You", { align: "center" });

    doc.moveDown();

    doc
      .fontSize(10)
      .fillColor("#1e293b")
      .font("Helvetica")
      .text("Contact: 0775 109 046 | 0750 263 691", { align: "center" })
      .text("Email: okuloisaac46@gmail.com", { align: "center" });

    doc.moveDown();

    doc
      .strokeColor("#2563eb")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();

    doc.moveDown(2);

    // ========== CUSTOMER ==========
    doc
      .fontSize(14)
      .fillColor("#1e293b")
      .font("Helvetica-Bold")
      .text("CUSTOMER INFORMATION", { align: "center" });

    doc.moveDown();

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Name: ${customer.name}`)
      .text(`Phone: ${customer.phone || "N/A"}`)
      .text(`Email: ${customer.email || "N/A"}`)
      .text(`Address: ${customer.address || "N/A"}`);

    doc.moveDown(2);

    // ========== LOANS ==========
    if (loans.length > 0) {
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("LOAN SUMMARY", { align: "center" });

      doc.moveDown();

      loans.forEach((loan, i) => {
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(
            `${i + 1}. Loan Amount: UGX ${(loan.amount || 0).toLocaleString()}`
          )
          .text(
            `   Balance: UGX ${(loan.balance || 0).toLocaleString()}`
          )
          .text(`   Status: ${loan.status || "N/A"}`);

        doc.moveDown();
      });
    }

    // ========== PAYMENTS ==========
    if (payments.length > 0) {
      doc.addPage();

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("PAYMENT HISTORY", { align: "center" });

      doc.moveDown();

      payments.slice(0, 10).forEach((pay, i) => {
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(
            `${i + 1}. ${new Date(pay.date).toLocaleDateString()} - UGX ${(
              pay.amount || 0
            ).toLocaleString()} (${pay.method || "N/A"})`
          );
      });
    }

    // ========== FOOTER FIX ==========
    const range = doc.bufferedPageRange();

    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      doc.fontSize(8).fillColor("#64748b").text(
        `I&L Lending Services Statement | Page ${i + 1} of ${range.count}`,
        50,
        770,
        { align: "center", width: 500 }
      );
    }

    doc.end();
  } catch (err) {
    console.error("PDF Error:", err);
    res.status(500).json({
      error: "PDF generation failed",
      details: err.message,
    });
  }
});

// PORT Fix for Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("✅ PDF Server Running on Port:", PORT);
});

