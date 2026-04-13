require('dotenv').config();

const keys = [
  'DATABASE_URL',
  'DIALOG_MERCHANT_ID',
  'DIALOG_PAYMENT_SERVICE_ID',
  'DIALOG_USERNAME',
  'DIALOG_PASSWORD',
  'DIALOG_PRIVATE_KEY',
  'DIALOG_PUBLIC_KEY',
  'DIALOG_DATABASE_NAME',
  'APP_URL',
  'DIALOG_PAYMENT_PROVIDER_ID',
];

keys.forEach(k => {
  const val = process.env[k];
  if (!val) {
    console.log('MISSING  -', k);
  } else {
    console.log('OK       -', k, '=', val.slice(0, 10) + '... (' + val.length + ' chars)');
  }
});
