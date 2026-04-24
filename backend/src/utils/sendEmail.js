const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOrderReceipt({ to, order, items, address, paymentMethod }) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 200;
  const codTax = paymentMethod === 'COD' ? Math.round(subtotal * 0.04) : 0;

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

        <table style="width:100%;margin-top:16px;">
          <tr>
            <td style="padding:6px 8px;color:#666;">Subtotal</td>
            <td style="padding:6px 8px;text-align:right;">Rs ${subtotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:6px 8px;color:#666;">Delivery Fee</td>
            <td style="padding:6px 8px;text-align:right;">Rs ${deliveryFee.toLocaleString()}</td>
          </tr>
          ${codTax > 0 ? `
          <tr>
            <td style="padding:6px 8px;color:#666;">COD Tax (4%)</td>
            <td style="padding:6px 8px;text-align:right;">Rs ${codTax.toLocaleString()}</td>
          </tr>` : ''}
          <tr style="border-top:2px solid #eee;">
            <td style="padding:8px;font-weight:bold;font-size:16px;">Total</td>
            <td style="padding:8px;text-align:right;font-weight:bold;font-size:16px;">Rs ${order.totalAmount.toLocaleString()}</td>
          </tr>
        </table>

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

  await resend.emails.send({
    from: 'Organicles <orders@organicles.pk>',
    to,
    subject: `Order Confirmed #${order.id.substring(0, 8)}`,
    html,
  });
}

module.exports = { sendOrderReceipt };
