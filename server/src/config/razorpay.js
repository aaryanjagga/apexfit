const Razorpay = require('razorpay');
const crypto = require('crypto');

const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

const isPlaceholderKey =
  !keyId ||
  keyId.includes('PASTE_YOUR_RAZORPAY_KEY_ID_HERE') ||
  !keySecret ||
  keySecret.includes('PASTE_YOUR_RAZORPAY_KEY_SECRET_HERE');

let razorpayInstance = null;

if (!isPlaceholderKey) {
  try {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    console.log('💳 [Razorpay] SDK initialized with configured API keys.');
  } catch (err) {
    console.error('❌ [Razorpay] Failed to initialize Razorpay SDK:', err.message);
  }
} else {
  console.log('⚠️  [Razorpay] API Keys are placeholders in .env.');
  console.log('ℹ️  [Razorpay] Using test simulation mode for order creation & verification until real keys are provided.');
}

/**
 * Verify Razorpay HMAC-SHA256 signature
 *
 * @param {string} orderId - Razorpay order id (order_...)
 * @param {string} paymentId - Razorpay payment id (pay_...)
 * @param {string} signature - Razorpay signature returned by checkout
 * @returns {boolean} - true if signature matches
 */
const verifySignature = (orderId, paymentId, signature) => {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;

  // In production / live test mode with real keys:
  if (secret && !secret.includes('PASTE_YOUR_RAZORPAY_KEY_SECRET_HERE')) {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');
    return generatedSignature === signature;
  }

  // Simulation mode for sandbox testing without live credentials:
  // Signature is generated with fallback secret 'test_secret_simulation'
  const fallbackSecret = 'test_simulation_secret_gymdesk';
  const simulatedExpected = crypto
    .createHmac('sha256', fallbackSecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return signature === simulatedExpected || signature.startsWith('simulated_valid_sig_');
};

/**
 * Helper to generate a valid test signature in simulation mode
 */
const generateSimulatedSignature = (orderId, paymentId) => {
  const secret = (process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_SECRET.includes('PASTE_YOUR_RAZORPAY_KEY_SECRET_HERE'))
    ? process.env.RAZORPAY_KEY_SECRET
    : 'test_simulation_secret_gymdesk';

  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
};

module.exports = {
  razorpayInstance,
  isPlaceholderKey,
  verifySignature,
  generateSimulatedSignature,
};
