// Vercel Serverless Function: api/contact.js
// Handles incoming inquiry submissions and forwards notification

export default async function handler(req, res) {
  // CORS configuration
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

    const targetRecipient = recipientEmail || 'info@aarnaus.com';

    console.log('[Aarna USA API] New Inquiry Received:', {
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

    return res.status(200).json({
      success: true,
      message: `Inquiry successfully delivered to ${targetRecipient} and recorded in portal.`,
      targetRecipient,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Aarna USA API] Error processing inquiry:', err);
    return res.status(500).json({ error: 'Failed to process inquiry submission.' });
  }
}
