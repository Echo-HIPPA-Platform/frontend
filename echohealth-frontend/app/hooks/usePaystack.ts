"use client";

import { useState, useEffect } from 'react';

// This interface defines the configuration your React components will use.
export interface PaystackConfig {
  publicKey: string;
  email: string;
  amount: number;
  currency?: string;
  reference?: string;
  metadata?: object;
  onSuccess: (reference: unknown) => void;
  onClose: () => void;
}

// This interface accurately describes what the external Paystack script expects.
interface PaystackInlineConfig {
    key: string;
    email: string;
    amount: number;
    currency: string;
    ref: string; // The property must be 'ref'
    metadata: object;
    callback: (response: unknown) => void; // The property must be 'callback'
    onClose: () => void;
}

// This defines the shape of the Paystack object on the window.
interface PaystackPop {
  setup: (config: PaystackInlineConfig) => {
    openIframe: () => void;
  };
}

declare global {
  interface Window {
    PaystackPop?: PaystackPop;
  }
}

const usePaystack = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializePayment = (config: PaystackConfig) => {
    if (!scriptLoaded || !window.PaystackPop) {
      console.error('Paystack script is still loading. Please try again in a moment.');
      alert('Payment service is loading, please try again in a moment.');
      return;
    }

    // Validate required configuration
    if (!config.publicKey) {
      console.error('Paystack public key is required');
      alert('Payment configuration error. Please contact support.');
      return;
    }

    if (!config.publicKey.startsWith('pk_')) {
      console.error('Invalid Paystack public key. Must start with pk_test_ or pk_live_');
      alert('Payment configuration error. Please contact support.');
      return;
    }

    if (!config.email) {
      console.error('Email is required for Paystack payment');
      alert('Email is required to process payment.');
      return;
    }

    if (!config.amount || config.amount <= 0) {
      console.error('Valid amount is required for Paystack payment');
      alert('Invalid payment amount.');
      return;
    }

    if (typeof config.onSuccess !== 'function') {
      console.error('onSuccess callback must be a function');
      alert('Payment configuration error. Please contact support.');
      return;
    }

    if (typeof config.onClose !== 'function') {
      console.error('onClose callback must be a function');
      alert('Payment configuration error. Please contact support.');
      return;
    }

    try {
      // Create the configuration object
      const paystackConfig = {
        key: config.publicKey,
        email: config.email,
        amount: config.amount,
        currency: config.currency || 'KES',
        ref: config.reference || '' + Math.floor((Math.random() * 1000000000) + 1),
        metadata: config.metadata || {},
        onClose: config.onClose,
        callback: config.onSuccess, // We map our 'onSuccess' to Paystack's 'callback'
      };
      
      // This creates the final configuration object with the correct property names.
      const handler = window.PaystackPop.setup(paystackConfig);

      handler.openIframe();
    } catch (error) {
      console.error('Error initializing Paystack payment:', error);
      alert('Failed to initialize payment. Please try again.');
    }
  };

  return initializePayment;
};

export default usePaystack;