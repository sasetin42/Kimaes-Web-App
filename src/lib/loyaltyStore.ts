// Salo-Salo Rewards / Loyalty Program Store & Business Logic Engine
import type {
  LoyaltyTier,
  SukiProfile,
  LoyaltyTransaction,
  LoyaltyVoucher,
  LoyaltySettings,
} from '@/types';
import { toast } from 'sonner';

export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  programName: "Salo-Salo Rewards Program",
  earningRateSpend: 200, // ₱200 spent
  earningRatePoints: 2, // = 2 points
  corporateDoubleEarning: true, // Brigada Corporate double points
  pointMonetaryValue: 2.0, // 1 Point = ₱2
  vipFiestaThreshold: 8000, // ₱8,000 spend in rolling 6 months
  vipFiestaMonths: 6,
  corporateSpendThreshold: 20000, // ₱20,000 or HR/Admin registration
  peakMonths: ['September', 'October', 'November', 'December'],
  minRedemptionPoints: 5, // minimum 5 points = ₱10
};

const STORAGE_KEYS = {
  PROFILES: 'kimaes_suki_profiles',
  TRANSACTIONS: 'kimaes_loyalty_transactions',
  VOUCHERS: 'kimaes_loyalty_vouchers',
  SETTINGS: 'kimaes_loyalty_settings',
};

// Seed initial Suki Profiles matching the 3 tiers
const INITIAL_PROFILES: SukiProfile[] = [
  {
    id: 'suki-01',
    customerId: 'cust-101',
    firstName: 'Maria',
    lastName: 'Santos',
    name: 'Maria Santos',
    mobile: '0917-123-4567',
    email: 'maria.santos@gmail.com',
    birthday: '1992-10-15',
    customerType: 'individual',
    address: 'BLK 12 Lot 4, Dasmariñas, Cavite',
    city: 'Dasmariñas',
    province: 'Cavite',
    preferredChannel: 'viber',
    currentTier: 'Suki',
    pointsBalance: 120, // 120 pts = ₱240 value
    monetaryValue: 240,
    lifetimePointsEarned: 180,
    lifetimePointsRedeemed: 60,
    qualifyingSpend6Months: 4800,
    lifetimeSpend: 6200,
    orderCount: 5,
    firstPurchaseDate: '2025-06-12',
    lastPurchaseDate: '2026-09-20',
    registrationSource: 'physical_bilao_qr',
    viberNumber: '0917-123-4567',
    createdAt: '2025-06-12T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'suki-02',
    customerId: 'cust-102',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    name: 'Juan Dela Cruz',
    mobile: '0918-987-6543',
    email: 'juan.delacruz@yahoo.com',
    birthday: '1988-11-28',
    customerType: 'individual',
    address: 'Phase 2, Victoria Reyes, Dasmariñas, Cavite',
    city: 'Dasmariñas',
    province: 'Cavite',
    preferredChannel: 'messenger',
    currentTier: 'VIP Fiesta',
    pointsBalance: 310, // 310 pts = ₱620 value
    monetaryValue: 620,
    lifetimePointsEarned: 450,
    lifetimePointsRedeemed: 140,
    qualifyingSpend6Months: 9400, // Reached ₱8,000 threshold
    lifetimeSpend: 14200,
    orderCount: 9,
    firstPurchaseDate: '2025-02-14',
    lastPurchaseDate: '2026-09-28',
    registrationSource: 'messenger',
    messengerId: 'm.me/juandelacruz.cavite',
    createdAt: '2025-02-14T08:30:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'suki-03',
    customerId: 'cust-103',
    firstName: 'Pamela',
    lastName: 'Ramos',
    name: 'Pamela Ramos (Acme BPO)',
    mobile: '0922-334-5566',
    email: 'hr@acmebposolutions.ph',
    birthday: '1985-05-04',
    customerType: 'corporate_hr',
    companyName: 'Acme BPO Solutions Cavite',
    companyRole: 'HR & Employee Engagement Director',
    corporateAccountStatus: 'verified',
    address: 'Cavite Ecozone Tech Park, General Trias',
    city: 'General Trias',
    province: 'Cavite',
    preferredChannel: 'viber',
    currentTier: 'Brigada Corporate',
    pointsBalance: 780, // 780 pts = ₱1,560 value
    monetaryValue: 1560,
    lifetimePointsEarned: 1100,
    lifetimePointsRedeemed: 320,
    qualifyingSpend6Months: 24500, // Corporate tier qualified
    lifetimeSpend: 36000,
    orderCount: 14,
    firstPurchaseDate: '2025-01-20',
    lastPurchaseDate: '2026-09-25',
    registrationSource: 'online',
    viberNumber: '0922-334-5566',
    assignedSalesRep: 'Marvin Kim Morales',
    createdAt: '2025-01-20T14:15:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_VOUCHERS: LoyaltyVoucher[] = [
  {
    id: 'vouch-01',
    code: 'SUKI-SHANGHAI-101',
    customerId: 'cust-101',
    tier: 'Suki',
    title: 'Welcome Suki Gift: Free Lumpiang Shanghai',
    description: 'Free 12-pc Lumpiang Shanghai with your next qualifying party bilao purchase.',
    benefitType: 'free_item',
    benefitValue: 'Lumpiang Shanghai',
    minSpend: 800,
    applicableProduct: 'Lumpiang Shanghai',
    startDate: '2026-01-01',
    expirationDate: '2026-12-31',
    status: 'active',
  },
  {
    id: 'vouch-02',
    code: 'FIESTA-UPGRADE-102',
    customerId: 'cust-102',
    tier: 'VIP Fiesta',
    title: 'VIP Fiesta: Free Bilao Size Upgrade',
    description: 'Complimentary upgrade from Medium to Large Party Bilao on your birthday celebration.',
    benefitType: 'upgrade_bilao',
    benefitValue: 'Medium to Large Upgrade',
    minSpend: 1200,
    startDate: '2026-01-01',
    expirationDate: '2026-12-31',
    status: 'active',
  },
  {
    id: 'vouch-03',
    code: 'SUKI-FREESHIP-OCT',
    title: 'Birthday Month Free Shipping',
    description: 'Enjoy free delivery anywhere within our Cavite service zones during your birthday month!',
    benefitType: 'free_shipping',
    benefitValue: '100% Delivery Fee',
    minSpend: 500,
    startDate: '2026-10-01',
    expirationDate: '2026-10-31',
    status: 'active',
  },
];

const INITIAL_TRANSACTIONS: LoyaltyTransaction[] = [
  {
    id: 'ltx-01',
    customerId: 'cust-101',
    customerName: 'Maria Santos',
    customerMobile: '0917-123-4567',
    orderId: 'ord-001',
    referenceNumber: 'KPB-2026-000123',
    type: 'points_earned',
    qualifyingAmount: 1800,
    pointsEarned: 18, // ₱1,800 / 200 * 2 = 18 pts
    pointsRedeemed: 0,
    balanceBefore: 102,
    balanceAfter: 120,
    tierAtTransaction: 'Suki',
    sourceChannel: 'online',
    createdBy: 'Automated Post-Payment Engine',
    remarks: 'Auto-credited upon payment verification for Order #KPB-2026-000123',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'ltx-02',
    customerId: 'cust-102',
    customerName: 'Juan Dela Cruz',
    customerMobile: '0918-987-6543',
    type: 'tier_upgrade',
    qualifyingAmount: 8200,
    pointsEarned: 0,
    pointsRedeemed: 0,
    balanceBefore: 310,
    balanceAfter: 310,
    tierAtTransaction: 'VIP Fiesta',
    sourceChannel: 'pos',
    createdBy: 'Monthly Rolling Spend Evaluator',
    remarks: 'Upgraded to VIP Fiesta after accumulating ₱9,400 spend within 6 months',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'ltx-03',
    customerId: 'cust-103',
    customerName: 'Pamela Ramos (Acme BPO)',
    customerMobile: '0922-334-5566',
    orderId: 'ord-corp-12',
    referenceNumber: 'CORP-INV-2026-044',
    type: 'points_earned',
    qualifyingAmount: 8500,
    pointsEarned: 170, // ₱8,500 / 200 * 4 (Double points for Brigada Corporate!)
    pointsRedeemed: 0,
    balanceBefore: 610,
    balanceAfter: 780,
    tierAtTransaction: 'Brigada Corporate',
    sourceChannel: 'corporate',
    createdBy: 'Corporate Invoicing Ledger',
    remarks: 'Brigada Corporate Double Points (₱200 = 4 pts) credited for Corporate Salo-Salo feast',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

// In-Memory state with local storage persistence
let inMemoryProfiles: SukiProfile[] = [];
let inMemoryTransactions: LoyaltyTransaction[] = [];
let inMemoryVouchers: LoyaltyVoucher[] = [];
let inMemorySettings: LoyaltySettings = DEFAULT_LOYALTY_SETTINGS;

const loadLoyaltyData = () => {
  if (typeof window === 'undefined') return;
  try {
    const rawProf = localStorage.getItem(STORAGE_KEYS.PROFILES);
    inMemoryProfiles = rawProf ? JSON.parse(rawProf) : INITIAL_PROFILES;

    const rawTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    inMemoryTransactions = rawTx ? JSON.parse(rawTx) : INITIAL_TRANSACTIONS;

    const rawVouch = localStorage.getItem(STORAGE_KEYS.VOUCHERS);
    inMemoryVouchers = rawVouch ? JSON.parse(rawVouch) : INITIAL_VOUCHERS;

    const rawSet = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    inMemorySettings = rawSet ? JSON.parse(rawSet) : DEFAULT_LOYALTY_SETTINGS;
  } catch (err) {
    inMemoryProfiles = INITIAL_PROFILES;
    inMemoryTransactions = INITIAL_TRANSACTIONS;
    inMemoryVouchers = INITIAL_VOUCHERS;
    inMemorySettings = DEFAULT_LOYALTY_SETTINGS;
  }
};

loadLoyaltyData();

const persistLoyalty = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(inMemoryProfiles));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(inMemoryTransactions));
    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(inMemoryVouchers));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(inMemorySettings));
    window.dispatchEvent(new Event('kimae_loyalty_sync'));
  } catch {}
};

// Normalize mobile numbers to match consistently (e.g. +639171234567, 0917-123-4567 -> 09171234567)
export const normalizeMobile = (m: string): string => {
  if (!m) return '';
  let clean = m.replace(/\D/g, '');
  if (clean.startsWith('63') && clean.length === 12) {
    clean = '0' + clean.substring(2);
  }
  return clean;
};

// ==============================================================
// GETTERS & READ FUNCTIONS
// ==============================================================

export const getLoyaltySettings = (): LoyaltySettings => {
  return inMemorySettings;
};

export const updateLoyaltySettings = (newSettings: Partial<LoyaltySettings>) => {
  inMemorySettings = { ...inMemorySettings, ...newSettings };
  persistLoyalty();
  toast.success('Loyalty Program settings updated.');
};

export const getSukiProfiles = (): SukiProfile[] => {
  return inMemoryProfiles;
};

export const getSukiProfileByIdentifier = (identifier?: string): SukiProfile | undefined => {
  if (!identifier) return undefined;
  const cleanId = identifier.trim().toLowerCase();
  const cleanPhone = normalizeMobile(identifier);

  return inMemoryProfiles.find((p) => {
    return (
      p.id === identifier ||
      p.customerId === identifier ||
      (cleanPhone && normalizeMobile(p.mobile) === cleanPhone) ||
      p.email.toLowerCase() === cleanId
    );
  });
};

export const getLoyaltyTransactions = (customerId?: string): LoyaltyTransaction[] => {
  if (!customerId) return inMemoryTransactions;
  return inMemoryTransactions.filter((tx) => tx.customerId === customerId);
};

export const getLoyaltyVouchers = (customerId?: string): LoyaltyVoucher[] => {
  if (!customerId) return inMemoryVouchers;
  return inMemoryVouchers.filter((v) => !v.customerId || v.customerId === customerId);
};

// ==============================================================
// CUSTOMER REGISTRATION & ONBOARDING (Entry A & B)
// ==============================================================

export interface RegisterSukiPayload {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  birthday?: string;
  customerType?: 'individual' | 'corporate_hr';
  companyName?: string;
  companyRole?: string;
  address?: string;
  city?: string;
  province?: string;
  preferredChannel?: 'viber' | 'messenger' | 'sms';
  registrationSource?: 'physical_bilao_qr' | 'messenger' | 'online' | 'pos_walk_in';
}

/**
 * Onboards or updates a customer in the Salo-Salo Rewards Program.
 * Uses mobile number as primary unique matching identifier to prevent duplicates.
 */
export const registerSukiProfile = (payload: RegisterSukiPayload): SukiProfile => {
  const normPhone = normalizeMobile(payload.mobile);
  const fullName = `${payload.firstName} ${payload.lastName}`.trim();

  // Search for existing profile to avoid duplicates
  const existingIdx = inMemoryProfiles.findIndex(
    (p) => normalizeMobile(p.mobile) === normPhone || (payload.email && p.email.toLowerCase() === payload.email.toLowerCase())
  );

  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    // Merge & update existing profile
    const existing = inMemoryProfiles[existingIdx];
    const isCorp = payload.customerType === 'corporate_hr';
    const upgradedTier: LoyaltyTier = isCorp ? 'Brigada Corporate' : existing.currentTier;

    const updated: SukiProfile = {
      ...existing,
      firstName: payload.firstName || existing.firstName,
      lastName: payload.lastName || existing.lastName,
      name: fullName || existing.name,
      email: payload.email || existing.email,
      birthday: payload.birthday || existing.birthday,
      customerType: payload.customerType || existing.customerType,
      companyName: payload.companyName || existing.companyName,
      companyRole: payload.companyRole || existing.companyRole,
      corporateAccountStatus: isCorp ? 'verified' : existing.corporateAccountStatus,
      address: payload.address || existing.address,
      city: payload.city || existing.city,
      province: payload.province || existing.province,
      preferredChannel: payload.preferredChannel || existing.preferredChannel,
      currentTier: upgradedTier,
      updatedAt: now,
    };

    inMemoryProfiles[existingIdx] = updated;
    persistLoyalty();
    toast.success(`Welcome back, ${existing.firstName}! Salo-Salo Rewards profile linked.`);
    return updated;
  }

  // Create new Unified Suki Profile
  const isCorporate = payload.customerType === 'corporate_hr';
  const assignedTier: LoyaltyTier = isCorporate ? 'Brigada Corporate' : 'Suki';
  const newId = `suki-${Date.now()}`;
  const custId = `cust-${Math.floor(1000 + Math.random() * 9000)}`;

  const newProfile: SukiProfile = {
    id: newId,
    customerId: custId,
    firstName: payload.firstName,
    lastName: payload.lastName,
    name: fullName,
    mobile: payload.mobile,
    email: payload.email,
    birthday: payload.birthday,
    customerType: payload.customerType || 'individual',
    companyName: payload.companyName,
    companyRole: payload.companyRole,
    corporateAccountStatus: isCorporate ? 'verified' : undefined,
    address: payload.address,
    city: payload.city || 'Dasmariñas',
    province: payload.province || 'Cavite',
    preferredChannel: payload.preferredChannel || 'viber',
    currentTier: assignedTier,
    pointsBalance: 0,
    monetaryValue: 0,
    lifetimePointsEarned: 0,
    lifetimePointsRedeemed: 0,
    qualifyingSpend6Months: 0,
    lifetimeSpend: 0,
    orderCount: 0,
    registrationSource: payload.registrationSource || 'online',
    viberNumber: payload.mobile,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryProfiles.unshift(newProfile);

  // 1. Issue Welcome Voucher: Free Lumpiang Shanghai on next order
  const welcomeCode = `SUKI-SHANGHAI-${Math.floor(1000 + Math.random() * 9000)}`;
  const welcomeVoucher: LoyaltyVoucher = {
    id: `vouch-${Date.now()}`,
    code: welcomeCode,
    customerId: custId,
    tier: 'Suki',
    title: 'Welcome Suki Gift: Free Lumpiang Shanghai',
    description: 'Enjoy a free 12-pc Lumpiang Shanghai on your next qualifying party bilao purchase!',
    benefitType: 'free_item',
    benefitValue: 'Free Lumpiang Shanghai (12 pcs)',
    minSpend: 800,
    applicableProduct: 'Lumpiang Shanghai',
    startDate: now.split('T')[0],
    expirationDate: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
    status: 'active',
  };

  inMemoryVouchers.unshift(welcomeVoucher);

  // Record voucher in ledger
  inMemoryTransactions.unshift({
    id: `ltx-${Date.now()}`,
    customerId: custId,
    customerName: fullName,
    customerMobile: payload.mobile,
    type: 'voucher_issued',
    qualifyingAmount: 0,
    pointsEarned: 0,
    pointsRedeemed: 0,
    balanceBefore: 0,
    balanceAfter: 0,
    tierAtTransaction: assignedTier,
    sourceChannel: payload.registrationSource === 'physical_bilao_qr' ? 'pos' : 'online',
    createdBy: 'Salo-Salo Onboarding Bot',
    remarks: `Welcome Voucher issued: ${welcomeCode} (Free Lumpiang Shanghai)`,
    createdAt: now,
  });

  persistLoyalty();
  toast.success(`Mabuhay ${payload.firstName}! You are now registered in Salo-Salo Rewards. Welcome gift added! 🎉`);
  return newProfile;
};

// ==============================================================
// POINT ACCUMULATION (AFTER CONFIRMED PAYMENT)
// ==============================================================

/**
 * Calculates points earned:
 * Standard rule: ₱200 Spent = 2 Points (1 point = ₱2 value)
 * Brigada Corporate: Double Earning = 4 Points per ₱200
 */
export const calculatePointsEarned = (qualifyingAmount: number, tier: LoyaltyTier): number => {
  const unitsOf200 = Math.floor(Math.max(0, qualifyingAmount) / 200);
  if (tier === 'Brigada Corporate') {
    return unitsOf200 * 4; // Double points
  }
  return unitsOf200 * 2;
};

export interface AwardOrderPointsPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  totalPaid: number;
  sourceChannel?: 'online' | 'pos' | 'messenger' | 'viber' | 'corporate';
}

/**
 * Credits loyalty points to a customer's unified Suki profile after payment.
 * Automatically checks and applies VIP Fiesta (₱8,000 / 6mo) or Corporate tier upgrades.
 */
export const awardOrderPointsAfterPayment = (payload: AwardOrderPointsPayload): {
  success: boolean;
  pointsEarned: number;
  newBalance: number;
  tier: LoyaltyTier;
  upgraded: boolean;
} => {
  loadLoyaltyData();
  const normPhone = normalizeMobile(payload.customerMobile);

  let profile = inMemoryProfiles.find(
    (p) => normalizeMobile(p.mobile) === normPhone || (payload.customerEmail && p.email.toLowerCase() === payload.customerEmail.toLowerCase())
  );

  const now = new Date().toISOString();

  // If customer is not yet registered, auto-create a Suki profile so points aren't lost
  if (!profile) {
    const names = payload.customerName.trim().split(' ');
    const firstName = names[0] || 'Customer';
    const lastName = names.slice(1).join(' ') || 'Suki';

    profile = registerSukiProfile({
      firstName,
      lastName,
      mobile: payload.customerMobile,
      email: payload.customerEmail || `${normPhone || 'guest'}@kimaes.ph`,
      registrationSource: payload.sourceChannel === 'pos' ? 'pos_walk_in' : 'online',
    });
  }

  const qualifyingSpend = payload.totalPaid;
  const pointsEarned = calculatePointsEarned(qualifyingSpend, profile.currentTier);
  const balanceBefore = profile.pointsBalance;
  const balanceAfter = balanceBefore + pointsEarned;

  const newLifetimeSpend = profile.lifetimeSpend + qualifyingSpend;
  const new6MonthSpend = profile.qualifyingSpend6Months + qualifyingSpend;
  const newOrderCount = profile.orderCount + 1;

  // Evaluate Tier Upgrades
  let newTier = profile.currentTier;
  let tierUpgraded = false;

  if (profile.currentTier === 'Suki' && new6MonthSpend >= inMemorySettings.vipFiestaThreshold) {
    newTier = 'VIP Fiesta';
    tierUpgraded = true;
  } else if (newLifetimeSpend >= inMemorySettings.corporateSpendThreshold && profile.currentTier !== 'Brigada Corporate') {
    newTier = 'Brigada Corporate';
    tierUpgraded = true;
  }

  // Update Profile
  profile.pointsBalance = balanceAfter;
  profile.monetaryValue = balanceAfter * inMemorySettings.pointMonetaryValue;
  profile.lifetimePointsEarned += pointsEarned;
  profile.lifetimeSpend = newLifetimeSpend;
  profile.qualifyingSpend6Months = new6MonthSpend;
  profile.orderCount = newOrderCount;
  profile.currentTier = newTier;
  profile.lastPurchaseDate = now;
  profile.updatedAt = now;

  // Record Point Accumulation in Ledger
  inMemoryTransactions.unshift({
    id: `ltx-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    customerId: profile.customerId,
    customerName: profile.name,
    customerMobile: profile.mobile,
    orderId: payload.orderId,
    referenceNumber: payload.orderNumber,
    type: 'points_earned',
    qualifyingAmount: qualifyingSpend,
    pointsEarned,
    pointsRedeemed: 0,
    balanceBefore,
    balanceAfter,
    tierAtTransaction: profile.currentTier,
    sourceChannel: payload.sourceChannel || 'online',
    createdBy: 'Automated Post-Payment Point Credit',
    remarks: `Earned +${pointsEarned} points on Order #${payload.orderNumber} (₱${qualifyingSpend} spent)`,
    createdAt: now,
  });

  // If tier was upgraded, record milestone & issue VIP voucher
  if (tierUpgraded) {
    const upgradeCode = `FIESTA-UPGRADE-${Math.floor(1000 + Math.random() * 9000)}`;
    inMemoryVouchers.unshift({
      id: `vouch-${Date.now()}`,
      code: upgradeCode,
      customerId: profile.customerId,
      tier: 'VIP Fiesta',
      title: 'VIP Fiesta Milestone Gift: Free Bilao Upgrade',
      description: 'Congratulations on reaching VIP Fiesta! Enjoy a free size upgrade on your next party bilao.',
      benefitType: 'upgrade_bilao',
      benefitValue: 'Medium to Large Upgrade',
      minSpend: 1000,
      startDate: now.split('T')[0],
      expirationDate: new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0],
      status: 'active',
    });

    inMemoryTransactions.unshift({
      id: `ltx-${Date.now()}-upg`,
      customerId: profile.customerId,
      customerName: profile.name,
      customerMobile: profile.mobile,
      type: 'tier_upgrade',
      qualifyingAmount: new6MonthSpend,
      pointsEarned: 0,
      pointsRedeemed: 0,
      balanceBefore: balanceAfter,
      balanceAfter,
      tierAtTransaction: newTier,
      sourceChannel: payload.sourceChannel || 'online',
      createdBy: 'Real-time Tier Milestone Engine',
      remarks: `Upgraded to ${newTier} after reaching ₱${new6MonthSpend.toLocaleString()} spend!`,
      createdAt: now,
    });

    toast.success(`🎉 Congratulations ${profile.firstName}! You have been promoted to ${newTier}!`);
  }

  persistLoyalty();
  return {
    success: true,
    pointsEarned,
    newBalance: balanceAfter,
    tier: newTier,
    upgraded: tierUpgraded,
  };
};

// ==============================================================
// REWARD REDEMPTION AT CHECKOUT (1 Point = ₱2)
// ==============================================================

/**
 * Validates and redeems customer loyalty points for a cash discount at checkout.
 * 1 Point = ₱2
 */
export const redeemPointsAtCheckout = (
  customerId: string,
  pointsToRedeem: number,
  orderRef?: string
): { success: boolean; discountAmount: number; error?: string } => {
  loadLoyaltyData();
  const profile = inMemoryProfiles.find((p) => p.customerId === customerId || p.id === customerId);

  if (!profile) {
    return { success: false, discountAmount: 0, error: 'Suki profile not found' };
  }

  if (pointsToRedeem <= 0) {
    return { success: false, discountAmount: 0, error: 'Please specify points to redeem' };
  }

  if (pointsToRedeem < inMemorySettings.minRedemptionPoints) {
    return {
      success: false,
      discountAmount: 0,
      error: `Minimum redemption is ${inMemorySettings.minRedemptionPoints} points (₱${inMemorySettings.minRedemptionPoints * 2})`,
    };
  }

  if (profile.pointsBalance < pointsToRedeem) {
    return {
      success: false,
      discountAmount: 0,
      error: `Insufficient balance. You currently have ${profile.pointsBalance} points (₱${profile.pointsBalance * 2}).`,
    };
  }

  const discountAmount = pointsToRedeem * inMemorySettings.pointMonetaryValue; // 1 pt = ₱2
  const balanceBefore = profile.pointsBalance;
  const balanceAfter = balanceBefore - pointsToRedeem;

  profile.pointsBalance = balanceAfter;
  profile.monetaryValue = balanceAfter * inMemorySettings.pointMonetaryValue;
  profile.lifetimePointsRedeemed += pointsToRedeem;
  profile.updatedAt = new Date().toISOString();

  // Record in immutable ledger
  inMemoryTransactions.unshift({
    id: `ltx-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    customerId: profile.customerId,
    customerName: profile.name,
    customerMobile: profile.mobile,
    referenceNumber: orderRef || 'Checkout Redemption',
    type: 'points_redeemed',
    qualifyingAmount: 0,
    pointsEarned: 0,
    pointsRedeemed: pointsToRedeem,
    balanceBefore,
    balanceAfter,
    tierAtTransaction: profile.currentTier,
    sourceChannel: 'online',
    createdBy: 'Checkout Reward Redemption Engine',
    remarks: `Redeemed ${pointsToRedeem} points for ₱${discountAmount} discount on ${orderRef || 'order'}`,
    createdAt: new Date().toISOString(),
  });

  persistLoyalty();
  return { success: true, discountAmount };
};

/**
 * Restores redeemed points if an order is cancelled or aborted
 */
export const restorePointsOnCancellation = (
  customerId: string,
  pointsToRestore: number,
  orderRef?: string
) => {
  loadLoyaltyData();
  const profile = inMemoryProfiles.find((p) => p.customerId === customerId || p.id === customerId);
  if (!profile || pointsToRestore <= 0) return;

  const balanceBefore = profile.pointsBalance;
  const balanceAfter = balanceBefore + pointsToRestore;

  profile.pointsBalance = balanceAfter;
  profile.monetaryValue = balanceAfter * inMemorySettings.pointMonetaryValue;
  profile.lifetimePointsRedeemed = Math.max(0, profile.lifetimePointsRedeemed - pointsToRestore);
  profile.updatedAt = new Date().toISOString();

  inMemoryTransactions.unshift({
    id: `ltx-${Date.now()}-reversal`,
    customerId: profile.customerId,
    customerName: profile.name,
    customerMobile: profile.mobile,
    referenceNumber: orderRef,
    type: 'reversal',
    qualifyingAmount: 0,
    pointsEarned: pointsToRestore,
    pointsRedeemed: 0,
    balanceBefore,
    balanceAfter,
    tierAtTransaction: profile.currentTier,
    sourceChannel: 'admin',
    createdBy: 'Order Cancellation Reversal Engine',
    remarks: `Restored ${pointsToRestore} points from cancelled order ${orderRef || ''}`,
    createdAt: new Date().toISOString(),
  });

  persistLoyalty();
};

// ==============================================================
// BIRTHDAY & MILESTONE PERKS
// ==============================================================

export const claimBirthdayBenefit = (
  customerId: string
): { success: boolean; voucher?: LoyaltyVoucher; message: string } => {
  loadLoyaltyData();
  const profile = inMemoryProfiles.find((p) => p.customerId === customerId || p.id === customerId);

  if (!profile) return { success: false, message: 'Profile not found' };

  const currentYear = new Date().getFullYear();
  if (profile.birthdayBenefitClaimedYear === currentYear) {
    return { success: false, message: `Birthday perk has already been claimed for ${currentYear}.` };
  }

  const now = new Date().toISOString();
  let code = '';
  let title = '';
  let desc = '';
  let benefitType: LoyaltyVoucher['benefitType'] = 'free_shipping';
  let benefitValue: string | number = '100% Free Shipping';

  if (profile.currentTier === 'VIP Fiesta' || profile.currentTier === 'Brigada Corporate') {
    code = `BDAY-UPGRADE-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;
    title = 'VIP Birthday Perk: Free Bilao Size Upgrade!';
    desc = 'Free upgrade from Medium to Large Party Bilao for your birthday celebration feast.';
    benefitType = 'upgrade_bilao';
    benefitValue = 'Medium to Large Upgrade';
  } else {
    // Suki: Free Shipping in birthday month
    code = `BDAY-SHIP-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;
    title = 'Suki Birthday Month Free Shipping Perk!';
    desc = 'Free delivery for all your birthday month gathering orders anywhere in our service area.';
    benefitType = 'free_shipping';
    benefitValue = 'Free Delivery';
  }

  const voucher: LoyaltyVoucher = {
    id: `vouch-${Date.now()}`,
    code,
    customerId: profile.customerId,
    tier: profile.currentTier,
    title,
    description: desc,
    benefitType,
    benefitValue,
    minSpend: 600,
    startDate: now.split('T')[0],
    expirationDate: new Date(Date.now() + 86400000 * 35).toISOString().split('T')[0],
    status: 'active',
  };

  profile.birthdayBenefitClaimedYear = currentYear;
  inMemoryVouchers.unshift(voucher);

  inMemoryTransactions.unshift({
    id: `ltx-${Date.now()}-bday`,
    customerId: profile.customerId,
    customerName: profile.name,
    customerMobile: profile.mobile,
    type: 'birthday_benefit',
    qualifyingAmount: 0,
    pointsEarned: 0,
    pointsRedeemed: 0,
    balanceBefore: profile.pointsBalance,
    balanceAfter: profile.pointsBalance,
    tierAtTransaction: profile.currentTier,
    sourceChannel: 'online',
    createdBy: 'Automated Birthday Perk Dispatcher',
    remarks: `Claimed ${profile.currentTier} Birthday Benefit: ${code}`,
    createdAt: now,
  });

  persistLoyalty();
  return { success: true, voucher, message: `Maligayang Kaarawan! ${title} has been added to your vouchers.` };
};

// ==============================================================
// ADMIN CONTROLS & MANUAL ADJUSTMENT WITH AUDIT
// ==============================================================

export const adminAdjustPoints = (
  customerId: string,
  pointsDelta: number,
  reason: string,
  adminUser: string
) => {
  loadLoyaltyData();
  const profile = inMemoryProfiles.find((p) => p.customerId === customerId || p.id === customerId);
  if (!profile) throw new Error('Customer not found');

  const balanceBefore = profile.pointsBalance;
  const balanceAfter = Math.max(0, balanceBefore + pointsDelta);

  profile.pointsBalance = balanceAfter;
  profile.monetaryValue = balanceAfter * inMemorySettings.pointMonetaryValue;
  if (pointsDelta > 0) {
    profile.lifetimePointsEarned += pointsDelta;
  }
  profile.updatedAt = new Date().toISOString();

  inMemoryTransactions.unshift({
    id: `ltx-${Date.now()}-adj`,
    customerId: profile.customerId,
    customerName: profile.name,
    customerMobile: profile.mobile,
    type: 'points_adjusted',
    qualifyingAmount: 0,
    pointsEarned: pointsDelta > 0 ? pointsDelta : 0,
    pointsRedeemed: pointsDelta < 0 ? Math.abs(pointsDelta) : 0,
    balanceBefore,
    balanceAfter,
    tierAtTransaction: profile.currentTier,
    sourceChannel: 'admin',
    createdBy: adminUser,
    remarks: `Manual Admin Adjustment: ${reason}`,
    createdAt: new Date().toISOString(),
  });

  persistLoyalty();
};

export const adminMergeProfiles = (
  primaryId: string,
  secondaryId: string,
  adminUser: string
) => {
  loadLoyaltyData();
  const primIdx = inMemoryProfiles.findIndex((p) => p.id === primaryId || p.customerId === primaryId);
  const secIdx = inMemoryProfiles.findIndex((p) => p.id === secondaryId || p.customerId === secondaryId);

  if (primIdx < 0 || secIdx < 0) throw new Error('Profiles not found');
  if (primIdx === secIdx) throw new Error('Cannot merge profile with itself');

  const prim = inMemoryProfiles[primIdx];
  const sec = inMemoryProfiles[secIdx];

  // Combine points and orders
  prim.pointsBalance += sec.pointsBalance;
  prim.monetaryValue = prim.pointsBalance * inMemorySettings.pointMonetaryValue;
  prim.lifetimePointsEarned += sec.lifetimePointsEarned;
  prim.lifetimePointsRedeemed += sec.lifetimePointsRedeemed;
  prim.qualifyingSpend6Months += sec.qualifyingSpend6Months;
  prim.lifetimeSpend += sec.lifetimeSpend;
  prim.orderCount += sec.orderCount;

  // Upgrade tier if merged spend qualifies
  if (prim.qualifyingSpend6Months >= inMemorySettings.vipFiestaThreshold && prim.currentTier === 'Suki') {
    prim.currentTier = 'VIP Fiesta';
  }

  // Point transactions and vouchers to primary
  inMemoryTransactions.forEach((tx) => {
    if (tx.customerId === sec.customerId) {
      tx.customerId = prim.customerId;
    }
  });

  inMemoryVouchers.forEach((v) => {
    if (v.customerId === sec.customerId) {
      v.customerId = prim.customerId;
    }
  });

  inMemoryTransactions.unshift({
    id: `ltx-${Date.now()}-merge`,
    customerId: prim.customerId,
    customerName: prim.name,
    customerMobile: prim.mobile,
    type: 'points_adjusted',
    qualifyingAmount: 0,
    pointsEarned: sec.pointsBalance,
    pointsRedeemed: 0,
    balanceBefore: prim.pointsBalance - sec.pointsBalance,
    balanceAfter: prim.pointsBalance,
    tierAtTransaction: prim.currentTier,
    sourceChannel: 'admin',
    createdBy: adminUser,
    remarks: `Merged profile from ${sec.name} (${sec.mobile}) into ${prim.name}`,
    createdAt: new Date().toISOString(),
  });

  // Remove secondary
  inMemoryProfiles.splice(secIdx, 1);
  persistLoyalty();
};

// ==============================================================
// KPI TARGETS (35% Repeat, 4.8★ CSAT, 20% B2B)
// ==============================================================

export const getLoyaltyKPIMetrics = () => {
  loadLoyaltyData();
  const totalMembers = inMemoryProfiles.length;
  const sukiCount = inMemoryProfiles.filter((p) => p.currentTier === 'Suki').length;
  const vipCount = inMemoryProfiles.filter((p) => p.currentTier === 'VIP Fiesta').length;
  const corpCount = inMemoryProfiles.filter((p) => p.currentTier === 'Brigada Corporate').length;

  const repeatCustomers = inMemoryProfiles.filter((p) => p.orderCount > 1).length;
  const repeatRate = totalMembers > 0 ? Math.round((repeatCustomers / totalMembers) * 100) : 0;

  const totalPointsIssued = inMemoryProfiles.reduce((s, p) => s + p.lifetimePointsEarned, 0);
  const totalPointsRedeemed = inMemoryProfiles.reduce((s, p) => s + p.lifetimePointsRedeemed, 0);
  const totalLiability = inMemoryProfiles.reduce((s, p) => s + p.monetaryValue, 0);

  const corpSpend = inMemoryProfiles
    .filter((p) => p.currentTier === 'Brigada Corporate')
    .reduce((s, p) => s + p.lifetimeSpend, 0);
  const totalSpendAll = inMemoryProfiles.reduce((s, p) => s + p.lifetimeSpend, 0);
  const b2bShare = totalSpendAll > 0 ? Math.round((corpSpend / totalSpendAll) * 100) : 0;

  return {
    totalMembers,
    sukiCount,
    vipCount,
    corpCount,
    repeatCustomers,
    repeatRate,
    repeatTarget: 35, // 35% documented target
    csatScore: 4.8, // 4.8★ documented target
    b2bShare,
    b2bTarget: 20, // 20% documented target
    totalPointsIssued,
    totalPointsRedeemed,
    totalLiability,
    activeVouchersCount: inMemoryVouchers.filter((v) => v.status === 'active').length,
  };
};
