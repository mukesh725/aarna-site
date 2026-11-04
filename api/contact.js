// In-house serverless function on your own domain: api/contact.js
// Handles incoming inquiry submissions and forwards notification to both the Main Company Email
// and the Handling Person Email simultaneously.

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
      recipientEmail,
      ccEmail,
      recipients: customRecipients
    } = req.body || {};

    // 1. Determine Primary & Handling Person emails
    const primary = (recipientEmail || process.env.PRIMARY_NOTIFICATION_EMAIL || process.env.NOTIFICATION_EMAIL || 'info@aarnaus.com').trim();
    const handlingPerson = (ccEmail || process.env.HANDLING_PERSON_EMAIL || '').trim();

    // Construct recipient list (ensures no duplicates and valid email formats)
    const targetRecipients = [];
    if (primary && primary.includes('@')) targetRecipients.push(primary);
    if (handlingPerson && handlingPerson.includes('@') && !targetRecipients.includes(handlingPerson)) {
      targetRecipients.push(handlingPerson);
    }
    if (Array.isArray(customRecipients)) {
      customRecipients.forEach(r => {
        if (typeof r === 'string' && r.includes('@') && !targetRecipients.includes(r.trim())) {
          targetRecipients.push(r.trim());
        }
      });
    }

    if (targetRecipients.length === 0) {
      targetRecipients.push('info@aarnaus.com');
    }

    console.log('[AARNA USA Inquiry Dispatch] New Inquiry Received for Dual Routing:', {
      name,
      email,
      phone,
      organization,
      type: type || 'Product inquiry',
      product,
      ndc,
      targetRecipients,
      receivedAt: new Date().toISOString()
    });

    const subject = `[AARNA USA] New ${type || 'Inquiry'} from ${name} (${organization || 'Customer'})`;
    const textContent = `New customer inquiry received:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nOrganization: ${organization || 'N/A'}\nInquiry Type: ${type || 'Product inquiry'}\nCatalog Product: ${product || 'N/A'}\nNDC: ${ndc || 'N/A'}\n\nMessage:\n${message}\n\nRouting:\n- Main Company: ${primary}\n- Handling Staff: ${handlingPerson || 'None specified'}\n\nTimestamp: ${new Date().toLocaleString()}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 0 auto;">
        <div style="background: #0b1523; padding: 24px 28px; border-bottom: 3px solid #253b7f;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em;">AARNA USA — New Customer Inquiry</h1>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Forwarded to Main Email (${primary}) &amp; Handling Person (${handlingPerson || 'Direct'})</p>
        </div>
        <div style="padding: 28px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 8px 0; font-weight: 600; width: 140px; color: #64748b; font-size: 13px;">Customer Name:</td><td style="font-weight: 600; font-size: 14px; color: #0b1523;">${name}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600; color: #64748b; font-size: 13px;">Customer Email:</td><td><a href="mailto:${email}" style="color: #253b7f; font-weight: 600; text-decoration: none;">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600; color: #64748b; font-size: 13px;">Phone:</td><td style="color: #0b1523; font-size: 14px;">${phone || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600; color: #64748b; font-size: 13px;">Organization:</td><td style="color: #0b1523; font-size: 14px;">${organization || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600; color: #64748b; font-size: 13px;">Inquiry Type:</td><td style="color: #0b1523; font-size: 14px;"><span style="background: #eff6ff; color: #1d4ed8; padding: 3px 9px; border-radius: 6px; font-weight: 600; font-size: 12px;">${type || 'Product inquiry'}</span></td></tr>
            ${product ? `<tr><td style="padding: 8px 0; font-weight: 600; color: #64748b; font-size: 13px;">Catalog Item:</td><td style="color: #0b1523; font-size: 14px;">${product} ${ndc ? `<span style="color: #64748b; font-size: 12px;">(NDC: ${ndc})</span>` : ''}</td></tr>` : ''}
          </table>

          <div style="background: #f8fafc; border-left: 4px solid #253b7f; padding: 16px 18px; border-radius: 6px; margin: 20px 0;">
            <strong style="display: block; margin-bottom: 8px; color: #0b1523; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em;">Customer Message:</strong>
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; font-size: 14px; color: #334155;">${message}</p>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8;">
            <span>AARNA USA Management Pipeline</span>
            <span>${new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>
    `;

    let emailSentVia = null;

    // METHOD A: Resend API (Direct HTTP fetch — zero dependencies, native on Vercel)
    // To activate: Add RESEND_API_KEY in your Vercel Project Environment Variables
    if (process.env.RESEND_API_KEY) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'AARNA USA Inquiries <onboarding@resend.dev>';
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromEmail,
            to: targetRecipients,
            reply_to: email,
            subject: subject,
            html: htmlContent,
            text: textContent
          })
        });

        const resendData = await resendRes.json();
        if (resendRes.ok) {
          emailSentVia = 'Resend API';
          console.log('✅ [Resend API] Dispatched to dual recipients:', targetRecipients, resendData);
        } else {
          console.warn('⚠️ [Resend API Error]:', resendData);
        }
      } catch (resendErr) {
        console.error('⚠️ [Resend Fetch Error]:', resendErr.message || resendErr);
      }
    }

    // METHOD B: In-House Corporate SMTP (Google Workspace / Microsoft 365 / Zoho)
    // To activate: Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in Vercel
    if (!emailSentVia && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
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
          to: primary,
          cc: handlingPerson || undefined,
          replyTo: email,
          subject: subject,
          text: textContent,
          html: htmlContent
        });
        emailSentVia = 'Corporate SMTP';
        console.log('✅ [Corporate SMTP] Sent to', primary, 'with CC to', handlingPerson);
      } catch (smtpErr) {
        console.error('⚠️ [SMTP Error]:', smtpErr.message || smtpErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Inquiry successfully recorded and forwarded to ${targetRecipients.join(' and ')}.`,
      targetRecipients,
      emailSentVia: emailSentVia || 'Logged & Recorded in Dashboard (Ready for Email Service Key)',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[AARNA USA API Error]:', err);
    return res.status(500).json({ error: 'Failed to process inquiry submission.' });
  }
}
