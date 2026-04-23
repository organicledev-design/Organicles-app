const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOrderReceipt({ to, order, items, address }) {
  const itemRows = items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">Rs ${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#2E7D32;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;">Organicles</h1>
        <p style="color:#a5d6a7;margin:4px 0 0;">Order Confirmation</p>
      </div>
      <div style="padding:24px;">
        <p>Hi <strong>${address.fullName}</strong>,</p>
        <p>Thank you for your order! Here's your receipt:</p>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Payment:</strong> ${order.paymentMethod}</p>
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-PK')}</p>

        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:8px;text-align:left;">Item</th>
              <th style="padding:8px;text-align:center;">Qty</th>
              <th style="padding:8px;text-align:right;">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div style="text-align:right;margin-top:16px;font-size:18px;">
          <strong>Total: Rs ${order.totalAmount.toLocaleString()}</strong>
        </div>

        <div style="margin-top:24px;padding:16px;background:#f9f9f9;border-radius:8px;">
          <strong>Shipping Address:</strong><br/>
          ${address.fullName}<br/>
          ${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}<br/>
          ${address.city}, ${address.state}<br/>
          Phone: ${address.phone}
        </div>

        <p style="margin-top:24px;color:#666;">
          If you have any questions, reply to this email or contact us.
        </p>
      </div>
      <div style="background:#f5f5f5;padding:16px;text-align:center;color:#999;font-size:12px;">
        © ${new Date().getFullYear()} Organicles. All rights reserved.
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Organicles" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Order Confirmed #${order.id.substring(0, 8)}`,
    html,
  });
}

module.exports = { sendOrderReceipt };
