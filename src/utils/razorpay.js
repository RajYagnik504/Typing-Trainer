import { unlockPaid } from './trialManager';

export function openRazorpay({ onSuccess, onFailure }) {
  const options = {
    key: 'rzp_test_YourKeyHere',
    amount: 29900,
    currency: 'INR',
    name: 'TypeCraft Academy',
    description: 'Full Access — Unlimited',
    image: '/logo.png',
    theme: { color: '#7F77DD' },
    handler: function(response) {
      unlockPaid();
      if (onSuccess) onSuccess(response);
    },
    modal: {
      ondismiss: function() {
        if (onFailure) onFailure();
      }
    }
  };
  if (window.Razorpay) {
    new window.Razorpay(options).open();
  } else {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => new window.Razorpay(options).open();
    document.body.appendChild(script);
  }
}
