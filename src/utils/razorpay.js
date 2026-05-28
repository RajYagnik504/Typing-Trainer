export function openRazorpay({ amount, name, email, phone, onSuccess, onFailure }) {
  const options = {
    key: 'YOUR_RAZORPAY_KEY_ID', // Replace with your Razorpay key from razorpay.com dashboard
    amount: amount * 100, // Razorpay takes amount in paise — multiply rupees by 100
    currency: 'INR',
    name: 'TypeCraft Academy',
    description: 'Monthly Subscription',
    image: '/logo.png',
    prefill: {
      name: name || '',
      email: email || '',
      contact: phone || ''
    },
    theme: {
      color: '#7F77DD'
    },
    handler: function(response) {
      if (onSuccess) onSuccess(response);
    },
    modal: {
      ondismiss: function() {
        if (onFailure) onFailure('Payment cancelled');
      }
    }
  };

  if (window.Razorpay) {
    const rzp = new window.Razorpay(options);
    rzp.open();
  } else {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      const rzp = new window.Razorpay(options);
      rzp.open();
    };
    document.body.appendChild(script);
  }
}
