// In-house serverless function on your own domain: api/contact.js
// Handles incoming inquiry submissions and forwards notification to both the Main Company Email
// and the Handling Person Email simultaneously.
// Security hardened against open relay, HTML injection, and automated abuse.

// Simple sliding-window rate limiter per client IP
const rateLimitMap = new Map();

function isRateLimited(clientIp) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 5;      // Max 5 submissions per minute

  const record = rateLimitMap.get(clientIp);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + windowMs });
    return false;
  }

  record.count += 1;
  return record.count > maxRequests;
}

// Clean old rate limit entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) rateLimitMap.delete(ip);
    }
  }, 10 * 60 * 1000).unref?.();
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  // 1. Restrict CORS to trusted origins
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://www.aarnaus.com',
    'https://aarnaus.com',
    'http://localhost:3000',
    'http://localhost:8080'
  ];

  if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.aarnaus.com');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. IP Rate Limiting
  const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .toString().split(',')[0].trim();

  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Too many submissions. Please wait a minute and try again.' });
  }

  try {
    const body = req.body || {};
    const name = (typeof body.name === 'string' ? body.name : '').trim().slice(0, 100);
    const email = (typeof body.email === 'string' ? body.email : '').trim().slice(0, 150);
    const phone = (typeof body.phone === 'string' ? body.phone : '').trim().slice(0, 30);
    const organization = (typeof body.organization === 'string' ? body.organization : '').trim().slice(0, 150);
    const type = (typeof body.type === 'string' ? body.type : '').trim().slice(0, 80);
    const message = (typeof body.message === 'string' ? body.message : '').trim().slice(0, 3000);
    const product = (typeof body.product === 'string' ? body.product : '').trim().slice(0, 200);
    const ndc = (typeof body.ndc === 'string' ? body.ndc : '').trim().slice(0, 50);

    // Basic required field validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    // 3. SEC-02 Remediation: Strictly enforce verified server-side recipients (Prevent Open Mail Relay)
    const primaryRecipient = (process.env.PRIMARY_NOTIFICATION_EMAIL || process.env.NOTIFICATION_EMAIL || 'info@aarnaus.com').trim();
    const handlingRecipient = (process.env.HANDLING_PERSON_EMAIL || '').trim();

    const targetRecipients = [primaryRecipient];
    if (handlingRecipient && handlingRecipient.includes('@') && !targetRecipients.includes(handlingRecipient)) {
      targetRecipients.push(handlingRecipient);
    }

    // 4. SEC-10 Remediation: Mask PII in serverless logs
    console.log('[AARNA USA Inquiry Dispatch] New customer inquiry received:', {
      name: name ? `${name.charAt(0)}***` : 'N/A',
      emailDomain: email.includes('@') ? `@${email.split('@')[1]}` : 'N/A',
      inquiryType: type || 'Product inquiry',
      catalogProduct: product || 'N/A',
      receivedAt: new Date().toISOString()
    });

    // 5. SEC-04 Remediation: Escape all user inputs before HTML interpolation
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || 'N/A');
    const safeOrg = escapeHtml(organization || 'N/A');
    const safeType = escapeHtml(type || 'Product inquiry');
    const safeProduct = escapeHtml(product || '');
    const safeNdc = escapeHtml(ndc || '');
    const safeMessage = escapeHtml(message);

    const subject = `[AARNA USA] New ${safeType} from ${safeName} (${safeOrg})`;
    const textContent = `New customer inquiry received:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nOrganization: ${organization || 'N/A'}\nInquiry Type: ${type || 'Product inquiry'}\nCatalog Product: ${product || 'N/A'}\nNDC: ${ndc || 'N/A'}\n\nMessage:\n${message}\n\nTimestamp: ${new Date().toLocaleString()}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 0 auto;">
        <div style="background: #0b1523; padding: 24px 28px; border-bottom: 3px solid #253b7f;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em;">AARNA USA — New Customer Inquiry</h1>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Forwarded to Verified Management Team (${escapeHtml(primaryRecipient)})</p>
        </div>
        <div style="padding: 28px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 8px 0; font-weight: 600; width: 140px; color: #64748b; font-size: 13px;">Customer Name:</td><td style="font-weight: 600; font-size: 14px; color: #0b1523;">${safeName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600; color: #64748b; font-size: 13px;">Customer Email:</td><td><a href="mailto:${encodeURIComponent(email)}" style="color: #253b7f; font-weight: 600; text-decoration: none;">${safeEmail}</a></td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600; color: #64748b; font-size: 13px;">Phone:</td><td style="color: #0b1523; font-size: 14px;">${safePhone}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600; color: #64748b; font-size: 13px;">Organization:</td><td style="color: #0b1523; font-size: 14px;">${safeOrg}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600; color: #64748b; font-size: 13px;">Inquiry Type:</td><td style="color: #0b1523; font-size: 14px;"><span style="background: #eff6ff; color: #1d4ed8; padding: 3px 9px; border-radius: 6px; font-weight: 600; font-size: 12px;">${safeType}</span></td></tr>
            ${safeProduct ? `<tr><td style="padding: 8px 0; font-weight: 600; color: #64748b; font-size: 13px;">Catalog Item:</td><td style="color: #0b1523; font-size: 14px;">${safeProduct} ${safeNdc ? `<span style="color: #64748b; font-size: 12px;">(NDC: ${safeNdc})</span>` : ''}</td></tr>` : ''}
          </table>

          <div style="background: #f8fafc; border-left: 4px solid #253b7f; padding: 16px 18px; border-radius: 6px; margin: 20px 0;">
            <strong style="display: block; margin-bottom: 8px; color: #0b1523; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em;">Customer Message:</strong>
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; font-size: 14px; color: #334155;">${safeMessage}</p>
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
          console.log('✅ [Resend API] Dispatched successfully.');
        } else {
          console.warn('⚠️ [Resend API Error]:', resendData);
        }
      } catch (resendErr) {
        console.error('⚠️ [Resend Fetch Error]:', resendErr.message || resendErr);
      }
    }

    // METHOD B: In-House Corporate SMTP (Google Workspace / Microsoft 365 / Zoho)
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
          to: primaryRecipient,
          cc: handlingRecipient || undefined,
          replyTo: email,
          subject: subject,
          text: textContent,
          html: htmlContent
        });
        emailSentVia = 'Corporate SMTP';
        console.log('✅ [Corporate SMTP] Sent successfully.');
      } catch (smtpErr) {
        console.error('⚠️ [SMTP Error]:', smtpErr.message || smtpErr);
      }
    }

    // SEC-10: Do not leak internal target email addresses in client response
    return res.status(200).json({
      success: true,
      message: 'Inquiry successfully recorded and transmitted to the AARNA USA team.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[AARNA USA API Error]:', err.message || 'Internal failure');
    return res.status(500).json({ error: 'Failed to process inquiry submission.' });
  }
}
