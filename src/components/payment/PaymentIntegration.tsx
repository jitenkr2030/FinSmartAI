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
import { useToast } from '@/hooks/use-toast';
import { 
  paymentService, 
  PaymentMethod, 
  PaymentIntent, 
  Subscription, 
  Invoice,
  PaymentMethodSetup,
  Refund
} from '@/lib/services/paymentService';
import { loadStripe } from '@stripe/stripe-js';

interface PaymentIntegrationProps {
  userId?: string;
  showInvoices?: boolean;
  showRefunds?: boolean;
  showPaymentMethods?: boolean;
}

export function PaymentIntegration({ 
  userId, 
  showInvoices = true, 
  showRefunds = true, 
  showPaymentMethods = true 
}: PaymentIntegrationProps) {
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
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

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

  const handleAddPaymentMethod = useCallback(async (type: 'card' | 'upi') => {
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
      } else {
        setup = {
          type: 'upi',
          upi: {
            upiId: upiDetails.upiId,
          },
        };
      }

      const response = await paymentService.createPaymentMethod(setup);
      
      if (response.success && response.data) {
        setPaymentMethods(prev => [...prev, response.data!]);
        setShowAddPaymentMethod(false);
        setCardDetails({ number: '', expiry: '', cvc: '', name: '' });
        setUpiDetails({ upiId: '' });
        
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
  }, [cardDetails, upiDetails, toast]);

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {showPaymentMethods && <TabsTrigger value="methods">Payment Methods</TabsTrigger>}
          {showInvoices && <TabsTrigger value="invoices">Invoices</TabsTrigger>}
          {showRefunds && <TabsTrigger value="refunds">Refunds</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Subscription Status */}
          {subscription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Subscription</span>
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
                          `${method.type} ${method.upiId || ''}`
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
                {isProcessing ? 'Processing...' : `Pay ${paymentAmount ? formatAmount(parseFloat(paymentAmount) * 100) : ''}`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {showPaymentMethods && (
          <TabsContent value="methods" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Payment Methods</h3>
              <Button 
                onClick={() => setShowAddPaymentMethod(true)}
                variant="outline"
              >
                Add Payment Method
              </Button>
            </div>

            {/* Add Payment Method Form */}
            {showAddPaymentMethod && (
              <Card>
                <CardHeader>
                  <CardTitle>Add Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs defaultValue="card">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="card">Card</TabsTrigger>
                      <TabsTrigger value="upi">UPI</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="card" className="space-y-4">
                      <div>
                        <Label htmlFor="card-number">Card Number</Label>
                        <Input
                          id="card-number"
                          placeholder="1234 5678 9012 3456"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiry">Expiry</Label>
                          <Input
                            id="expiry"
                            placeholder="MM/YY"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvc">CVC</Label>
                          <Input
                            id="cvc"
                            placeholder="123"
                            value={cardDetails.cvc}
                            onChange={(e) => setCardDetails(prev => ({ ...prev, cvc: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="card-name">Name on Card</Label>
                        <Input
                          id="card-name"
                          placeholder="John Doe"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="upi" className="space-y-4">
                      <div>
                        <Label htmlFor="upi-id">UPI ID</Label>
                        <Input
                          id="upi-id"
                          placeholder="your@upi"
                          value={upiDetails.upiId}
                          onChange={(e) => setUpiDetails(prev => ({ ...prev, upiId: e.target.value }))}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => handleAddPaymentMethod('card')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Adding...' : 'Add Card'}
                    </Button>
                    <Button 
                      onClick={() => handleAddPaymentMethod('upi')}
                      disabled={isProcessing}
                      variant="outline"
                    >
                      {isProcessing ? 'Adding...' : 'Add UPI'}
                    </Button>
                    <Button 
                      onClick={() => setShowAddPaymentMethod(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Methods List */}
            <div className="space-y-2">
              {paymentMethods.map(method => (
                <Card key={method.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {method.type === 'card' ? method.brand?.charAt(0) : 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {method.type === 'card' ? 
                              `${method.brand} ${formatCardNumber(method.last4 || '')}` : 
                              `UPI ${method.upiId}`
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Added {new Date(method.createdAt).toLocaleDateString()}
                            {method.isDefault && ' • Default'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!method.isDefault && (
                          <Button
                            onClick={() => handleSetDefaultPaymentMethod(method.id)}
                            variant="outline"
                            size="sm"
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          variant="outline"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {paymentMethods.length === 0 && (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">No payment methods added</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}

        {showInvoices && (
          <TabsContent value="invoices" className="space-y-4">
            <h3 className="text-lg font-semibold">Invoices</h3>
            
            <div className="space-y-2">
              {invoices.map(invoice => (
                <Card key={invoice.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Invoice #{invoice.id.slice(-8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.dueDate).toLocaleDateString()} • {formatAmount(invoice.amount)}
                        </p>
                        <Badge 
                          variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                          className="mt-1"
                        >
                          {invoice.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {invoice.pdfUrl && (
                          <Button
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            variant="outline"
                            size="sm"
                          >
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {invoices.length === 0 && (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">No invoices available</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}

        {showRefunds && (
          <TabsContent value="refunds" className="space-y-4">
            <h3 className="text-lg font-semibold">Refunds</h3>
            
            <div className="space-y-2">
              {refunds.map(refund => (
                <Card key={refund.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Refund #{refund.id.slice(-8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(refund.createdAt).toLocaleDateString()} • {formatAmount(refund.amount)}
                        </p>
                        <Badge 
                          variant={refund.status === 'succeeded' ? 'default' : 'secondary'}
                          className="mt-1"
                        >
                          {refund.status.toUpperCase()}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Reason: {refund.reason}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {refunds.length === 0 && (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">No refunds available</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}