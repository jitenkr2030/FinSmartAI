"use client";

import { useState } from "react";
import SubscriptionManager from "@/components/billing/SubscriptionManager";
import { EnhancedPaymentIntegration } from "@/components/payment/EnhancedPaymentIntegration";

export default function BillingPage() {
  const [showEnhancedPayment, setShowEnhancedPayment] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Billing & Payments</h1>
        <button
          onClick={() => setShowEnhancedPayment(!showEnhancedPayment)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showEnhancedPayment ? 'Show Simple View' : 'Show Enhanced Payment'}
        </button>
      </div>
      
      {showEnhancedPayment ? (
        <EnhancedPaymentIntegration 
          userId="current-user"
          showInvoices={true}
          showRefunds={true}
          showPaymentMethods={true}
          enableRazorpay={true}
          enableStripe={true}
          enableUpi={true}
          enableWallets={true}
        />
      ) : (
        <SubscriptionManager />
      )}
    </div>
  );
}