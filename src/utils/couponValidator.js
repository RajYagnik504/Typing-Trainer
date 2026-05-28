const VALID_COUPONS = {
  '@Monday504': {
    discount: 100,        // 100% off
    type: 'forever',      // permanent, not one-time
    label: 'Owner Access'
  }
};

export function validateCoupon(code) {
  if (!code) return { valid: false, message: 'Invalid coupon code' };
  const coupon = VALID_COUPONS[code.trim()];
  if (!coupon) return { valid: false, message: 'Invalid coupon code' };
  return { 
    valid: true, 
    discount: coupon.discount, 
    type: coupon.type,
    message: coupon.discount === 100 ? '🎉 Free access applied!' : `${coupon.discount}% off applied!`
  };
}
