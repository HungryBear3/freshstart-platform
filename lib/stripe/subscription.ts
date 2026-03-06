/**
 * Get user's subscription status
 */
export async function getUserSubscription(userId: string) {
  try {
    // Lazy import Prisma to avoid initialization issues
    const { prisma } = await import("@/lib/db")
    
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    })

    if (!subscription) {
      return null
    }

    return {
      id: subscription.id,
      status: subscription.status,
      plan: subscription.plan,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      trialEnd: subscription.trialEnd,
      isActive: subscription.status === "active" || subscription.status === "trialing",
    }
  } catch (error) {
    console.error("Error fetching subscription:", error)
    return null
  }
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId)
  return subscription?.isActive ?? false
}
