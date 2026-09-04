const PDFDocument = require("pdfkit");

function generateInvoiceBuffer(booking, customer, provider, service) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on("error", reject);

    // Header
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor("#FF6A00")
      .text("FixIt", { align: "center" })
      .moveDown(0.5);
    doc
      .fontSize(16)
      .font("Helvetica")
      .fillColor("#000000")
      .text("INVOICE", { align: "center" })
      .moveDown(1);

    const invoiceNumber = booking.invoiceNumber || "N/A";
    const generatedDate = booking.invoiceGeneratedAt
      ? new Date(booking.invoiceGeneratedAt).toLocaleDateString("en-BD", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";

    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Invoice Number: ${invoiceNumber}`, { align: "right" })
      .text(`Date: ${generatedDate}`, { align: "right" })
      .moveDown(1);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("Bill To:", { underline: true })
      .moveDown(0.5);
    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`Name: ${customer.name || "N/A"}`)
      .text(`Email: ${customer.email || "N/A"}`)
      .text(`Address: ${booking.address || "N/A"}`)
      .moveDown(1);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("Service Provider:", { underline: true })
      .moveDown(0.5);
    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`Name: ${provider.name || "N/A"}`)
      .text(`Email: ${provider.email || "N/A"}`)
      .moveDown(1);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("Service Details:", { underline: true })
      .moveDown(0.5);
    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`Service: ${booking.service || "N/A"}`)
      .text(`Description: ${service && service.description ? service.description : "N/A"}`)
      .text(`Booking Date: ${booking.date || "N/A"} at ${booking.time || "N/A"}`)
      .text(`Completion Date: ${booking.completedAt ? new Date(booking.completedAt).toLocaleDateString("en-BD") : "N/A"}`)
      .text(`Payment Date: ${booking.paidAt ? new Date(booking.paidAt).toLocaleDateString("en-BD") : "N/A"}`)
      .moveDown(1);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("Payment Details:", { underline: true })
      .moveDown(0.5);
    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`Amount: ৳${booking.amount.toFixed(2)}`)
      .text(`Payment Method: ${booking.paymentMethod || "Online Payment"}`)
      .text(`Payment Status: ${booking.paymentStatus || "Pending"}`)
      .moveDown(2);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666666")
      .text("Thank you for choosing FixIt!", { align: "center" })
      .text("This is a system-generated invoice.", { align: "center" });

    doc.end();
  });
}

module.exports = { generateInvoiceBuffer };