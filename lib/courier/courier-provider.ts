import { CourierTrackingInfo } from '@/types/domain'

export interface CourierProvider {
  createShipment(orderId: string, recipient: { name: string; address: string; phone: string }): Promise<CourierTrackingInfo>
  getTracking(trackingNumber: string): Promise<CourierTrackingInfo>
}

export class ManualCourierProvider implements CourierProvider {
  async createShipment(orderId: string, _recipient: { name: string; address: string; phone: string }): Promise<CourierTrackingInfo> {
    const trackingNumber = `KB-SHIP-${orderId.slice(-6).toUpperCase()}`
    return {
      courierName: 'KichuBanai Express Courier',
      trackingNumber,
      status: 'LABEL_CREATED',
      dispatchedAt: new Date().toISOString(),
      estimatedDelivery: '3-5 business days',
      trackingUrl: `/dashboard/orders`,
    }
  }

  async getTracking(trackingNumber: string): Promise<CourierTrackingInfo> {
    return {
      courierName: 'KichuBanai Express Courier',
      trackingNumber,
      status: 'IN_TRANSIT',
      estimatedDelivery: '2 business days',
    }
  }
}

let activeCourierProvider: CourierProvider = new ManualCourierProvider()

export function getCourierProvider(): CourierProvider {
  return activeCourierProvider
}
