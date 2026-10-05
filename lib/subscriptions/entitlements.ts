import { Subscription, SubscriptionEntitlements } from '@/types/domain'

export const DEFAULT_FREE_ENTITLEMENTS: SubscriptionEntitlements = {
  highQualityJpg: false,
  watermarkFree: false,
  premiumTemplates: false,
  maxSavedDesigns: 5,
  priorityPrintProcessing: false,
}

export const SUBSCRIBER_PLUS_ENTITLEMENTS: SubscriptionEntitlements = {
  highQualityJpg: true,
  watermarkFree: true,
  premiumTemplates: true,
  maxSavedDesigns: 50,
  priorityPrintProcessing: true,
}

export const SUBSCRIBER_PRO_ENTITLEMENTS: SubscriptionEntitlements = {
  highQualityJpg: true,
  watermarkFree: true,
  premiumTemplates: true,
  maxSavedDesigns: 9999,
  priorityPrintProcessing: true,
}

export class EntitlementService {
  static getEntitlements(subscription?: Subscription | null): SubscriptionEntitlements {
    if (!subscription || subscription.status !== 'ACTIVE') {
      return DEFAULT_FREE_ENTITLEMENTS
    }

    if (subscription.plan === 'PRO') {
      return SUBSCRIBER_PRO_ENTITLEMENTS
    }

    if (subscription.plan === 'PLUS') {
      return SUBSCRIBER_PLUS_ENTITLEMENTS
    }

    return DEFAULT_FREE_ENTITLEMENTS
  }

  static canExportWatermarkFree(subscription?: Subscription | null): boolean {
    return this.getEntitlements(subscription).watermarkFree
  }

  static canAccessTemplate(isPremiumTemplate: boolean, subscription?: Subscription | null): boolean {
    if (!isPremiumTemplate) return true
    return this.getEntitlements(subscription).premiumTemplates
  }
}
