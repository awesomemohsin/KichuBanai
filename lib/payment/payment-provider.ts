export type PaymentMethod = 'COD' | 'BKASH' | 'NAGAD' | 'CARD'

export interface PaymentIntent {
  id: string
  orderId: string
  amount: number
  currency: 'BDT' | 'USD'
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'COD_CONFIRMED'
  method: PaymentMethod
}

export interface PaymentProvider {
  createPaymentIntent(orderId: string, amount: number, currency: 'BDT' | 'USD', method: PaymentMethod): Promise<PaymentIntent>
  verifyPayment(intentId: string): Promise<boolean>
}

export class ManualPaymentProvider implements PaymentProvider {
  async createPaymentIntent(orderId: string, amount: number, currency: 'BDT' | 'USD', method: PaymentMethod): Promise<PaymentIntent> {
    return {
      id: `PAY-${Date.now()}-${orderId.slice(-4)}`,
      orderId,
      amount,
      currency,
      status: method === 'COD' ? 'COD_CONFIRMED' : 'PENDING',
      method,
    }
  }

  async verifyPayment(_intentId: string): Promise<boolean> {
    return true
  }
}

let activePaymentProvider: PaymentProvider = new ManualPaymentProvider()

export function getPaymentProvider(): PaymentProvider {
  return activePaymentProvider
}
