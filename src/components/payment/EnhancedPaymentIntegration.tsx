'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { 
  paymentService, 
  PaymentMethod, 
  PaymentIntent, 
  Subscription, 
  Invoice,
  PaymentMethodSetup,
  Refund
} from '@/lib/services/paymentService';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Wallet, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Plus,
  Trash2,
  Settings,
  RefreshCw,
  IndianRupee,
  Banknote,
  QrCode,
  Smartphone as PhoneIcon
} from 'lucide-react';

interface EnhancedPaymentIntegrationProps {
  userId?: string;
  showInvoices?: boolean;
  showRefunds?: boolean;
  showPaymentMethods?: boolean;
  enableRazorpay?: boolean;
  enableStripe?: boolean;
  enableUpi?: boolean;
  enableWallets?: boolean;
}

const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 999,
    period: '/month',
    description: 'Individual Traders',
    features: [
      'Access to 3 AI Models', 
      '100 Predictions Daily', 
      'Email Support', 
      'Basic Data Access',
      'Mobile App Access'
    ],
    popular: false
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 4999,
    period: '/month',
    description: 'Professional Traders',
    features: [
      'Access to 8 AI Models', 
      'Unlimited Predictions', 
      'Priority Support', 
      'Real-time Data', 
      'API Access',
      'Advanced Analytics'
    ],
    popular: true
  },
  {
    id: 'institutional',
    name: 'Institutional',
    price: 24999,
    period: '/month',
    description: 'Financial Institutions',
    features: [
      'All 12 AI Models', 
      'White-label Solution', 
      'Dedicated Support', 
      'Custom Integration', 
      'Advanced Analytics',
      'On-premise Deployment'
    ],
    popular: false
  }
];

export function EnhancedPaymentIntegration({ 
  userId = 'demo-user',
  showInvoices = true, 
  showRefunds = true, 
  showPaymentMethods = true,
  enableRazorpay = true,
  enableStripe = true,
  enableUpi = true,
  enableWallets = true
}: EnhancedPaymentIntegrationProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });
  const [upiDetails, setUpiDetails] = useState({
    upiId: '',
  });
  const [walletDetails, setWalletDetails] = useState({
    type: 'paytm' as 'paytm' | 'phonepe' | 'gpay',
    phoneNumber: '',
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'razorpay'>('stripe');
  const [upiTransactionId, setUpiTransactionId] = useState<string>('');
  const [walletTransactionId, setWalletTransactionId] = useState<string>('');
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);
  const [isVerifyingWallet, setIsVerifyingWallet] = useState(false);

  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Load payment methods
      if (showPaymentMethods) {
        const methodsResponse = await paymentService.getPaymentMethods();
        if (methodsResponse.success && methodsResponse.data) {
          setPaymentMethods(methodsResponse.data);
          const defaultMethod = methodsResponse.data.find(m => m.isDefault);
          if (defaultMethod) {
            setSelectedPaymentMethod(defaultMethod.id);
          }
        }
      }

      // Load subscription
      const subscriptionResponse = await paymentService.getSubscription();
      if (subscriptionResponse.success && subscriptionResponse.data) {
        setSubscription(subscriptionResponse.data);
      }

      // Load invoices
      if (showInvoices) {
        const invoicesResponse = await paymentService.getInvoices();
        if (invoicesResponse.success && invoicesResponse.data) {
          setInvoices(invoicesResponse.data);
        }
      }

      // Load refunds
      if (showRefunds) {
        const refundsResponse = await paymentService.getRefunds();
        if (refundsResponse.success && refundsResponse.data) {
          setRefunds(refundsResponse.data);
        }
      }
    } catch (error) {
      console.error('Failed to load payment data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [showPaymentMethods, showInvoices, showRefunds, toast]);

  const handleAddPaymentMethod = useCallback(async (type: 'card' | 'upi' | 'wallet') => {
    setIsProcessing(true);
    
    try {
      let setup: PaymentMethodSetup;
      
      if (type === 'card') {
        const [expiryMonth, expiryYear] = cardDetails.expiry.split('/');
        setup = {
          type: 'card',
          card: {
            number: cardDetails.number,
            expiryMonth: parseInt(expiryMonth),
            expiryYear: parseInt('20' + expiryYear),
            cvc: cardDetails.cvc,
            name: cardDetails.name,
          },
        };
      } else if (type === 'upi') {
        setup = {
          type: 'upi',
          upi: {
            upiId: upiDetails.upiId,
          },
        };
      } else {
        setup = {
          type: 'wallet',
          wallet: {
            type: walletDetails.type,
            phoneNumber: walletDetails.phoneNumber,
          },
        };
      }

      const response = await paymentService.createPaymentMethod(setup);
      
      if (response.success && response.data) {
        setPaymentMethods(prev => [...prev, response.data!]);
        setShowAddPaymentMethod(false);
        setCardDetails({ number: '', expiry: '', cvc: '', name: '' });
        setUpiDetails({ upiId: '' });
        setWalletDetails({ type: 'paytm', phoneNumber: '' });
        
        toast({
          title: 'Success',
          description: 'Payment method added successfully',
        });
      } else {
        throw new Error(response.error || 'Failed to add payment method');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add payment method',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [cardDetails, upiDetails, walletDetails, toast]);

  const handleDeletePaymentMethod = useCallback(async (paymentMethodId: string) => {
    try {
      const response = await paymentService.deletePaymentMethod(paymentMethodId);
      
      if (response.success) {
        setPaymentMethods(prev => prev.filter(m => m.id !== paymentMethodId));
        if (selectedPaymentMethod === paymentMethodId) {
          setSelectedPaymentMethod('');
        }
        
        toast({
          title: 'Success',
          description: 'Payment method deleted successfully',
        });
      } else {
        throw new Error(response.error || 'Failed to delete payment method');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete payment method',
        variant: 'destructive',
      });
    }
  }, [selectedPaymentMethod, toast]);

  const handleSetDefaultPaymentMethod = useCallback(async (paymentMethodId: string) => {
    try {
      const response = await paymentService.setDefaultPaymentMethod(paymentMethodId);
      
      if (response.success) {
        setPaymentMethods(prev => 
          prev.map(m => ({
            ...m,
            isDefault: m.id === paymentMethodId
          }))
        );
        setSelectedPaymentMethod(paymentMethodId);
        
        toast({
          title: 'Success',
          description: 'Default payment method updated',
        });
      } else {
        throw new Error(response.error || 'Failed to set default payment method');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to set default payment method',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleMakePayment = useCallback(async () => {
    if (!selectedPaymentMethod || !paymentAmount) {
      toast({
        title: 'Error',
        description: 'Please select a payment method and enter an amount',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const amount = parseFloat(paymentAmount) * 100; // Convert to cents
      const response = await paymentService.createPaymentIntent(
        amount,
        'inr',
        selectedPaymentMethod,
        paymentDescription
      );
      
      if (response.success && response.data) {
        const confirmResponse = await paymentService.confirmPaymentIntent(
          response.data.id,
          selectedPaymentMethod
        );
        
        if (confirmResponse.success && confirmResponse.data?.status === 'succeeded') {
          toast({
            title: 'Success',
            description: 'Payment processed successfully',
          });
          setPaymentAmount('');
          setPaymentDescription('');
          loadPaymentData(); // Refresh data
        } else {
          throw new Error('Payment confirmation failed');
        }
      } else {
        throw new Error(response.error || 'Failed to create payment intent');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process payment',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPaymentMethod, paymentAmount, paymentDescription, toast, loadPaymentData]);

  const handleSubscribeToPlan = useCallback(async (planId: string) => {
    if (!selectedPaymentMethod) {
      toast({
        title: 'Error',
        description: 'Please select a payment method first',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await paymentService.createSubscription(
        planId,
        selectedPaymentMethod,
        7 // 7-day trial
      );
      
      if (response.success && response.data) {
        setSubscription(response.data);
        toast({
          title: 'Success',
          description: 'Subscription created successfully with 7-day trial',
        });
        loadPaymentData(); // Refresh data
      } else {
        throw new Error(response.error || 'Failed to create subscription');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create subscription',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPaymentMethod, toast, loadPaymentData]);

  const handleCancelSubscription = useCallback(async () => {
    if (!subscription) return;
    
    try {
      const response = await paymentService.cancelSubscription(subscription.id, true);
      
      if (response.success && response.data) {
        setSubscription(response.data);
        toast({
          title: 'Success',
          description: 'Subscription will be cancelled at the end of the current billing period',
        });
      } else {
        throw new Error(response.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel subscription',
        variant: 'destructive',
      });
    }
  }, [subscription, toast]);

  const handleInitiateUpiPayment = useCallback(async () => {
    if (!upiDetails.upiId || !paymentAmount) {
      toast({
        title: 'Error',
        description: 'Please enter UPI ID and amount',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await paymentService.initiateUpiPayment(
        upiDetails.upiId,
        parseFloat(paymentAmount),
        paymentDescription
      );
      
      if (response.success && response.data) {
        setUpiTransactionId(response.data.transactionId);
        
        // Open UPI URL in new window
        window.open(response.data.upiUrl, '_blank');
        
        toast({
          title: 'UPI Payment Initiated',
          description: 'Please complete the payment in your UPI app',
        });
      } else {
        throw new Error(response.error || 'Failed to initiate UPI payment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to initiate UPI payment',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [upiDetails.upiId, paymentAmount, paymentDescription, toast]);

  const handleVerifyUpiPayment = useCallback(async () => {
    if (!upiTransactionId) return;
    
    setIsVerifyingUpi(true);
    
    try {
      const response = await paymentService.verifyUpiPayment(upiTransactionId);
      
      if (response.success && response.data) {
        if (response.data.status === 'succeeded') {
          toast({
            title: 'Payment Successful',
            description: 'UPI payment completed successfully',
          });
          setUpiTransactionId('');
          setPaymentAmount('');
          setPaymentDescription('');
          loadPaymentData(); // Refresh data
        } else {
          toast({
            title: 'Payment Pending',
            description: 'UPI payment is still being processed',
          });
        }
      } else {
        throw new Error(response.error || 'Failed to verify UPI payment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to verify UPI payment',
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingUpi(false);
    }
  }, [upiTransactionId, toast, loadPaymentData]);

  const handleInitiateWalletPayment = useCallback(async () => {
    if (!walletDetails.phoneNumber || !paymentAmount) {
      toast({
        title: 'Error',
        description: 'Please enter phone number and amount',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await paymentService.initiateWalletPayment(
        walletDetails.type,
        walletDetails.phoneNumber,
        parseFloat(paymentAmount),
        paymentDescription
      );
      
      if (response.success && response.data) {
        setWalletTransactionId(response.data.transactionId);
        
        // Open redirect URL in new window
        window.open(response.data.redirectUrl, '_blank');
        
        toast({
          title: 'Wallet Payment Initiated',
          description: 'Please complete the payment in your wallet app',
        });
      } else {
        throw new Error(response.error || 'Failed to initiate wallet payment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to initiate wallet payment',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [walletDetails.type, walletDetails.phoneNumber, paymentAmount, paymentDescription, toast]);

  const handleVerifyWalletPayment = useCallback(async () => {
    if (!walletTransactionId) return;
    
    setIsVerifyingWallet(true);
    
    try {
      const response = await paymentService.verifyWalletPayment(walletTransactionId);
      
      if (response.success && response.data) {
        if (response.data.status === 'succeeded') {
          toast({
            title: 'Payment Successful',
            description: 'Wallet payment completed successfully',
          });
          setWalletTransactionId('');
          setPaymentAmount('');
          setPaymentDescription('');
          loadPaymentData(); // Refresh data
        } else {
          toast({
            title: 'Payment Pending',
            description: 'Wallet payment is still being processed',
          });
        }
      } else {
        throw new Error(response.error || 'Failed to verify wallet payment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to verify wallet payment',
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingWallet(false);
    }
  }, [walletTransactionId, toast, loadPaymentData]);

  const handleDownloadInvoice = useCallback(async (invoiceId: string) => {
    try {
      const blob = await paymentService.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Success',
        description: 'Invoice downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const formatAmount = paymentService.formatAmount;
  const formatCardNumber = paymentService.formatCardNumber;
  const formatExpiryDate = paymentService.formatExpiryDate;
  const getPaymentMethodIcon = paymentService.getPaymentMethodIcon;
  const getSubscriptionStatusColor = paymentService.getSubscriptionStatusColor;
  const getPaymentStatusColor = paymentService.getPaymentStatusColor;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {showPaymentMethods && <TabsTrigger value="methods">Payment Methods</TabsTrigger>}
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          {showInvoices && <TabsTrigger value="invoices">Invoices</TabsTrigger>}
          {showRefunds && <TabsTrigger value="refunds">Refunds</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Payment Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Payment Provider</span>
                <Settings className="w-5 h-5 text-gray-500" />
              </CardTitle>
              <CardDescription>
                Choose your preferred payment provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enableStripe && (
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentProvider === 'stripe' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setPaymentProvider('stripe')}
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">Stripe</h3>
                        <p className="text-sm text-gray-600">International card payments</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {enableRazorpay && (
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentProvider === 'razorpay' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                    onClick={() => setPaymentProvider('razorpay')}
                  >
                    <div className="flex items-center space-x-3">
                      <Banknote className="w-6 h-6 text-orange-600" />
                      <div>
                        <h3 className="font-semibold">Razorpay</h3>
                        <p className="text-sm text-gray-600">Indian payment gateway</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          {subscription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Current Subscription</span>
                  <Badge className={getSubscriptionStatusColor(subscription.status)}>
                    {subscription.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {subscription.planName} • {subscription.cancelAtPeriodEnd ? 'Cancels at period end' : 'Active'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Period</p>
                    <p className="font-medium">
                      {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {' '}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Features</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {subscription.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                  <div className="mt-4">
                    <Button 
                      onClick={handleCancelSubscription}
                      variant="outline"
                      size="sm"
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Make Payment</CardTitle>
              <CardDescription>Quick payment for additional services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (INR)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Payment description"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.type === 'card' ? 
                          `${method.brand} **** ${method.last4}` : 
                          `${method.type} ${method.upiId || method.phoneNumber || ''}`
                        }
                        {method.isDefault && ' (Default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleMakePayment}
                disabled={!selectedPaymentMethod || !paymentAmount || isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : `Pay ₹${paymentAmount || '0'}`}
              </Button>
            </CardContent>
          </Card>

          {/* UPI Payment */}
          {enableUpi && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="w-5 h-5" />
                  <span>UPI Payment</span>
                </CardTitle>
                <CardDescription>Pay using any UPI app</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="upi-id">UPI ID</Label>
                    <Input
                      id="upi-id"
                      placeholder="your@upi"
                      value={upiDetails.upiId}
                      onChange={(e) => setUpiDetails({ upiId: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="upi-amount">Amount (INR)</Label>
                    <Input
                      id="upi-amount"
                      type="number"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleInitiateUpiPayment}
                    disabled={!upiDetails.upiId || !paymentAmount || isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? 'Processing...' : 'Pay with UPI'}
                  </Button>
                  
                  {upiTransactionId && (
                    <Button 
                      onClick={handleVerifyUpiPayment}
                      disabled={isVerifyingUpi}
                      variant="outline"
                    >
                      {isVerifyingUpi ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wallet Payment */}
          {enableWallets && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PhoneIcon className="w-5 h-5" />
                  <span>Wallet Payment</span>
                </CardTitle>
                <CardDescription>Pay using mobile wallets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="wallet-type">Wallet Type</Label>
                    <Select value={walletDetails.type} onValueChange={(value: any) => setWalletDetails(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paytm">Paytm</SelectItem>
                        <SelectItem value="phonepe">PhonePe</SelectItem>
                        <SelectItem value="gpay">Google Pay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="wallet-phone">Phone Number</Label>
                    <Input
                      id="wallet-phone"
                      placeholder="9876543210"
                      value={walletDetails.phoneNumber}
                      onChange={(e) => setWalletDetails(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="wallet-amount">Amount (INR)</Label>
                    <Input
                      id="wallet-amount"
                      type="number"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleInitiateWalletPayment}
                    disabled={!walletDetails.phoneNumber || !paymentAmount || isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? 'Processing...' : `Pay with ${walletDetails.type}`}
                  </Button>
                  
                  {walletTransactionId && (
                    <Button 
                      onClick={handleVerifyWalletPayment}
                      disabled={isVerifyingWallet}
                      variant="outline"
                    >
                      {isVerifyingWallet ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payment Methods Tab */}
        {showPaymentMethods && (
          <TabsContent value="methods" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Payment Methods</h3>
              <Button 
                onClick={() => setShowAddPaymentMethod(true)}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </div>

            {/* Add Payment Method Form */}
            {showAddPaymentMethod && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs defaultValue="card" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="card">Card</TabsTrigger>
                      {enableUpi && <TabsTrigger value="upi">UPI</TabsTrigger>}
                      {enableWallets && <TabsTrigger value="wallet">Wallet</TabsTrigger>}
                    </TabsList>
                    
                    <TabsContent value="card" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="card-number">Card Number</Label>
                          <Input
                            id="card-number"
                            placeholder="1234 5678 9012 3456"
                            value={cardDetails.number}
                            onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="card-name">Cardholder Name</Label>
                          <Input
                            id="card-name"
                            placeholder="John Doe"
                            value={cardDetails.name}
                            onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="card-expiry">Expiry Date</Label>
                          <Input
                            id="card-expiry"
                            placeholder="MM/YY"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="card-cvc">CVC</Label>
                          <Input
                            id="card-cvc"
                            placeholder="123"
                            value={cardDetails.cvc}
                            onChange={(e) => setCardDetails(prev => ({ ...prev, cvc: e.target.value }))}
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleAddPaymentMethod('card')}
                        disabled={isProcessing}
                        className="w-full"
                      >
                        {isProcessing ? 'Adding...' : 'Add Card'}
                      </Button>
                    </TabsContent>
                    
                    {enableUpi && (
                      <TabsContent value="upi" className="space-y-4">
                        <div>
                          <Label htmlFor="upi-id-new">UPI ID</Label>
                          <Input
                            id="upi-id-new"
                            placeholder="your@upi"
                            value={upiDetails.upiId}
                            onChange={(e) => setUpiDetails({ upiId: e.target.value })}
                          />
                        </div>
                        <Button 
                          onClick={() => handleAddPaymentMethod('upi')}
                          disabled={isProcessing}
                          className="w-full"
                        >
                          {isProcessing ? 'Adding...' : 'Add UPI ID'}
                        </Button>
                      </TabsContent>
                    )}
                    
                    {enableWallets && (
                      <TabsContent value="wallet" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="wallet-type-new">Wallet Type</Label>
                            <Select value={walletDetails.type} onValueChange={(value: any) => setWalletDetails(prev => ({ ...prev, type: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="paytm">Paytm</SelectItem>
                                <SelectItem value="phonepe">PhonePe</SelectItem>
                                <SelectItem value="gpay">Google Pay</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="wallet-phone-new">Phone Number</Label>
                            <Input
                              id="wallet-phone-new"
                              placeholder="9876543210"
                              value={walletDetails.phoneNumber}
                              onChange={(e) => setWalletDetails(prev => ({ ...prev, phoneNumber: e.target.value }))}
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleAddPaymentMethod('wallet')}
                          disabled={isProcessing}
                          className="w-full"
                        >
                          {isProcessing ? 'Adding...' : 'Add Wallet'}
                        </Button>
                      </TabsContent>
                    )}
                  </Tabs>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddPaymentMethod(false)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Existing Payment Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentMethods.map((method) => (
                <Card key={method.id} className="relative">
                  {method.isDefault && (
                    <Badge className="absolute top-2 right-2 bg-green-500">
                      Default
                    </Badge>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      {method.type === 'card' && <CreditCard className="w-6 h-6 text-blue-600" />}
                      {method.type === 'upi' && <QrCode className="w-6 h-6 text-purple-600" />}
                      {method.type === 'wallet' && <PhoneIcon className="w-6 h-6 text-green-600" />}
                      <div>
                        <p className="font-medium">
                          {method.type === 'card' ? `${method.brand} **** ${method.last4}` : 
                           method.type === 'upi' ? method.upiId : 
                           `${method.walletType} • ${method.phoneNumber}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {method.type === 'card' && `Expires ${method.expiryMonth}/${method.expiryYear}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {!method.isDefault && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSetDefaultPaymentMethod(method.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeletePaymentMethod(method.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        {/* Subscription Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Choose Your Plan</h3>
            <p className="text-gray-600">Select the perfect plan for your trading needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 border-2' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    ₹{plan.price}
                    <span className="text-lg font-normal text-gray-600">{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSubscribeToPlan(plan.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : `Subscribe to ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        {showInvoices && (
          <TabsContent value="invoices" className="space-y-4">
            <h3 className="text-lg font-semibold">Invoices</h3>
            
            {invoices.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No invoices found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <Card key={invoice.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Invoice #{invoice.id}</p>
                          <p className="text-sm text-gray-500">
                            Due: {new Date(invoice.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium">{formatAmount(invoice.amount, invoice.currency)}</p>
                            <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                              {invoice.status}
                            </Badge>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadInvoice(invoice.id)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Refunds Tab */}
        {showRefunds && (
          <TabsContent value="refunds" className="space-y-4">
            <h3 className="text-lg font-semibold">Refunds</h3>
            
            {refunds.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No refunds found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {refunds.map((refund) => (
                  <Card key={refund.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Refund #{refund.id}</p>
                          <p className="text-sm text-gray-500">
                            {refund.reason} • {new Date(refund.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatAmount(refund.amount, refund.currency)}</p>
                          <Badge variant={refund.status === 'succeeded' ? 'default' : 'secondary'}>
                            {refund.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}