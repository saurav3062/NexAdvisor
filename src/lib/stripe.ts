import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export const createPaymentIntent = async (amount: number, currency: string = 'usd') => {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, currency }),
  });

  const { clientSecret } = await response.json();
  return clientSecret;
};

export const processPayment = async (paymentMethodId: string, amount: number) => {
  const response = await fetch('/api/process-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentMethodId,
      amount,
    }),
  });

  if (!response.ok) {
    throw new Error('Payment failed');
  }

  return response.json();
};

export const createSubscription = async (priceId: string) => {
  const response = await fetch('/api/create-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create subscription');
  }

  return response.json();
};

export const cancelSubscription = async (subscriptionId: string) => {
  const response = await fetch(`/api/cancel-subscription/${subscriptionId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to cancel subscription');
  }

  return response.json();
};

export const updateSubscription = async (subscriptionId: string, newPriceId: string) => {
  const response = await fetch(`/api/update-subscription/${subscriptionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newPriceId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update subscription');
  }

  return response.json();
};

export const getCustomerPortalLink = async () => {
  const response = await fetch('/api/customer-portal', {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to get customer portal link');
  }

  const { url } = await response.json();
  return url;
};