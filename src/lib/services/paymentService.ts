import { apiClient } from './apiClient';

// Payment types
export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'upi' | 'wallet';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  upiId?: string;
  walletType?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled' | 'requires_capture';
  clientSecret?: string;
  paymentMethodId?: string;
  description?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'canceled' | 'expired' | 'past_due' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialStart?: string;
  trialEnd?: string;
  paymentMethodId?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  dueDate: string;
  paidAt?: string;
  pdfUrl?: string;
  items: InvoiceItem[];
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  currency: string;
  quantity: number;
}

export interface PaymentMethodSetup {
  type: 'card' | 'bank_account' | 'upi' | 'wallet';
  card?: {
    number: string;
    expiryMonth: number;
    expiryYear: number;
    cvc: string;
    name: string;
  };
  bankAccount?: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
  };
  upi?: {
    upiId: string;
  };
  wallet?: {
    type: 'paytm' | 'phonepe' | 'gpay';
    phoneNumber: string;
  };
}

export interface RefundRequest {
  paymentIntentId: string;
  amount?: number; // Partial refund amount
  reason: string;
}

export interface Refund {
  id: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'canceled';
  reason: string;
  createdAt: string;
}

class PaymentService {
  private stripe: any = null; // Will be initialized with Stripe.js

  constructor() {
    this.initializeStripe();
  }

  private async initializeStripe() {
    // Load Stripe.js dynamically
    if (typeof window !== 'undefined') {
      const { loadStripe } = await import('@stripe/stripe-js');
      const response = await apiClient.get('/payment/config');
      
      if (response.success && response.data?.publishableKey) {
        this.stripe = await loadStripe(response.data.publishableKey);
      }
    }
  }

  // Payment Methods
  async createPaymentMethod(setup: PaymentMethodSetup): Promise<ApiResponse<PaymentMethod>> {
    if (setup.type === 'card' && this.stripe) {
      // Use Stripe.js for card payments
      const { card } = setup;
      const { error, paymentMethod } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: {
          number: card.number,
          exp_month: card.expiryMonth,
          exp_year: card.expiryYear,
          cvc: card.cvc,
        },
        billing_details: {
          name: card.name,
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      }

      // Save payment method to our backend
      const response = await apiClient.post('/payment/methods', {
        stripePaymentMethodId: paymentMethod.id,
        type: setup.type,
        isDefault: false,
      });

      return response;
    }

    // For other payment methods, use our backend
    return apiClient.post('/payment/methods', setup);
  }

  async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    return apiClient.get('/payment/methods');
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete(`/payment/methods/${paymentMethodId}`);
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<ApiResponse<boolean>> {
    return apiClient.put(`/payment/methods/${paymentMethodId}/default`);
  }

  // Payment Intents
  async createPaymentIntent(
    amount: number,
    currency: string = 'inr',
    paymentMethodId?: string,
    description?: string
  ): Promise<ApiResponse<PaymentIntent>> {
    return apiClient.post('/payment/intents', {
      amount,
      currency,
      paymentMethodId,
      description,
    });
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<ApiResponse<PaymentIntent>> {
    return apiClient.post(`/payment/intents/${paymentIntentId}/confirm`, {
      paymentMethodId,
    });
  }

  async getPaymentIntent(paymentIntentId: string): Promise<ApiResponse<PaymentIntent>> {
    return apiClient.get(`/payment/intents/${paymentIntentId}`);
  }

  // Subscriptions
  async createSubscription(
    planId: string,
    paymentMethodId?: string,
    trialPeriodDays?: number
  ): Promise<ApiResponse<Subscription>> {
    return apiClient.post('/payment/subscriptions', {
      planId,
      paymentMethodId,
      trialPeriodDays,
    });
  }

  async getSubscription(subscriptionId?: string): Promise<ApiResponse<Subscription>> {
    const url = subscriptionId ? `/payment/subscriptions/${subscriptionId}` : '/payment/subscriptions';
    return apiClient.get(url);
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<ApiResponse<Subscription>> {
    return apiClient.post(`/payment/subscriptions/${subscriptionId}/cancel`, {
      cancelAtPeriodEnd,
    });
  }

  async updateSubscription(
    subscriptionId: string,
    planId: string,
    paymentMethodId?: string
  ): Promise<ApiResponse<Subscription>> {
    return apiClient.put(`/payment/subscriptions/${subscriptionId}`, {
      planId,
      paymentMethodId,
    });
  }

  async reactivateSubscription(subscriptionId: string): Promise<ApiResponse<Subscription>> {
    return apiClient.post(`/payment/subscriptions/${subscriptionId}/reactivate`);
  }

  // Invoices
  async getInvoices(subscriptionId?: string): Promise<ApiResponse<Invoice[]>> {
    const params = subscriptionId ? { subscriptionId } : {};
    return apiClient.get('/payment/invoices', { params });
  }

  async getInvoice(invoiceId: string): Promise<ApiResponse<Invoice>> {
    return apiClient.get(`/payment/invoices/${invoiceId}`);
  }

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await fetch(`/api/payment/invoices/${invoiceId}/download`, {
      headers: {
        Authorization: `Bearer ${apiClient.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }

    return response.blob();
  }

  // Refunds
  async createRefund(request: RefundRequest): Promise<ApiResponse<Refund>> {
    return apiClient.post('/payment/refunds', request);
  }

  async getRefunds(paymentIntentId?: string): Promise<ApiResponse<Refund[]>> {
    const params = paymentIntentId ? { paymentIntentId } : {};
    return apiClient.get('/payment/refunds', { params });
  }

  async getRefund(refundId: string): Promise<ApiResponse<Refund>> {
    return apiClient.get(`/payment/refunds/${refundId}`);
  }

  // Stripe Elements integration
  async createStripeElements(elements: any): Promise<any> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    return this.stripe.elements(elements);
  }

  async confirmCardPayment(
    clientSecret: string,
    cardElement: any,
    billingDetails?: any
  ): Promise<ApiResponse<{ paymentIntent: any; error?: any }>> {
    if (!this.stripe) {
      return {
        success: false,
        error: 'Stripe not initialized',
        timestamp: new Date().toISOString(),
      };
    }

    const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: { paymentIntent },
      timestamp: new Date().toISOString(),
    };
  }

  // UPI Payment handling
  async initiateUpiPayment(
    upiId: string,
    amount: number,
    description?: string
  ): Promise<ApiResponse<{ transactionId: string; upiUrl: string }>> {
    return apiClient.post('/payment/upi/initiate', {
      upiId,
      amount,
      description,
    });
  }

  async verifyUpiPayment(transactionId: string): Promise<ApiResponse<{ status: string; paymentIntent?: any }>> {
    return apiClient.get(`/payment/upi/verify/${transactionId}`);
  }

  // Wallet payments
  async initiateWalletPayment(
    walletType: 'paytm' | 'phonepe' | 'gpay',
    phoneNumber: string,
    amount: number,
    description?: string
  ): Promise<ApiResponse<{ transactionId: string; redirectUrl: string }>> {
    return apiClient.post('/payment/wallet/initiate', {
      walletType,
      phoneNumber,
      amount,
      description,
    });
  }

  async verifyWalletPayment(transactionId: string): Promise<ApiResponse<{ status: string; paymentIntent?: any }>> {
    return apiClient.get(`/payment/wallet/verify/${transactionId}`);
  }

  // Utility methods
  formatAmount(amount: number, currency: string = 'inr'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Stripe amounts are in cents
  }

  formatCardNumber(cardNumber: string): string {
    return `**** **** **** ${cardNumber.slice(-4)}`;
  }

  formatExpiryDate(expiryMonth: number, expiryYear: number): string {
    return `${expiryMonth.toString().padStart(2, '0')}/${expiryYear.toString().slice(-2)}`;
  }

  getPaymentMethodIcon(type: string): string {
    switch (type) {
      case 'card':
        return 'credit-card';
      case 'bank_account':
        return 'building-2';
      case 'upi':
        return 'smartphone';
      case 'wallet':
        return 'wallet';
      default:
        return 'credit-card';
    }
  }

  getSubscriptionStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'canceled':
        return 'text-red-600';
      case 'expired':
        return 'text-gray-600';
      case 'past_due':
        return 'text-yellow-600';
      case 'unpaid':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'succeeded':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'requires_payment_method':
        return 'text-yellow-600';
      case 'requires_action':
        return 'text-orange-600';
      case 'canceled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export class for custom instances
export { PaymentService };

// React hook for payment service
export const usePaymentService = () => {
  return paymentService;
};