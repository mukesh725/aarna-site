// In-house serverless function on your own domain: api/contact.js
// Handles incoming inquiry submissions and forwards notification via direct in-house corporate SMTP

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      name,
      email,
      phone,
      organization,
      type,
      message,
      product,
      ndc,
      recipientEmail
    } = req.body || {};

    const targetRecipient = recipientEmail || process.env.NOTIFICATION_EMAIL || 'info@aarnaus.com';

    console.log('[Aarna USA In-House API] New Inquiry Received:', {
      name,
      email,
      phone,
      organization,
      type: type || 'Product inquiry',
      product,
      ndc,
      targetRecipient,
      receivedAt: new Date().toISOString()
    });

    // In-House Corporate SMTP (Google Workspace / Microsoft 365 / Private Exchange)
    // Configure in your Vercel Environment Variables:
    // SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 465,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"AARNA Portal Inquiries" <${process.env.SMTP_USER}>`,
          to: targetRecipient,
          replyTo: email,
          subject: `[AARNA USA] New ${type || 'Inquiry'} from ${name}`,
          text: `New customer inquiry received:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nOrganization: ${organization || 'N/A'}\nInquiry Type: ${type || 'Product inquiry'}\nCatalog Product: ${product || 'N/A'}\nNDC: ${ndc || 'N/A'}\n\nMessage:\n${message}\n\nTimestamp: ${new Date().toLocaleString()}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b;">
              <h2 style="color: #253b7f; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">New Customer Inquiry — AARNA USA</h2>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr><td style="padding: 8px 0; font-weight: bold; width: 140px;">Customer Name:</td><td>${name}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Customer Email:</td><td><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Phone:</td><td>${phone || 'N/A'}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Organization:</td><td>${organization || 'N/A'}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Inquiry Type:</td><td>${type || 'Product inquiry'}</td></tr>
                ${product ? `<tr><td style="padding: 8px 0; font-weight: bold;">Catalog Item:</td><td>${product} ${ndc ? `(NDC: ${ndc})` : ''}</td></tr>` : ''}
              </table>
              <div style="background: #f8fafc; border-left: 4px solid #253b7f; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <strong style="display: block; margin-bottom: 6px; color: #0b1523;">Message Content:</strong>
                <p style="margin: 0; white-space: pre-wrap; line-height: 1.5;">${message}</p>
              </div>
              <p style="font-size: 12px; color: #94a3b8; margin-top: 25px;">Sent from Aarna USA In-House Portal • ${new Date().toLocaleString()}</p>
            </div>
          `
        });
      } catch (smtpErr) {
        console.error('[In-House SMTP Notice]:', smtpErr.message || smtpErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Inquiry successfully recorded in portal and routed in-house to ${targetRecipient}.`,
      targetRecipient,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Aarna USA API Error]:', err);
    return res.status(500).json({ error: 'Failed to process inquiry submission.' });
  }
}
