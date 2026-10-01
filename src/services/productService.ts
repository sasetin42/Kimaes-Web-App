// Firebase Cloud Firestore Product & Category Service
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Product, Category } from '@/types';
import { PRODUCTS, CATEGORIES } from '@/constants/data';
import { INITIAL_CENTRAL_PRODUCTS } from '@/constants/seedData';
import { getLocalAuthUser } from '@/services/authService';

const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';

let isSeedingProducts = false;
let isSeedingCategories = false;
const STABLE_EPOCH_ISO = '2025-01-01T00:00:00.000Z';

/**
 * Format Firestore data to Product object
 */
export function mapDocToProduct(id: string, data: any): Product {
  const createdAtIso = data.createdAt?.toDate 
    ? data.createdAt.toDate().toISOString() 
    : (data.createdAt || STABLE_EPOCH_ISO);

  const updatedAtIso = data.updatedAt?.toDate 
    ? data.updatedAt.toDate().toISOString() 
    : (data.updatedAt || createdAtIso);

  return {
    id,
    name: data.name || '',
    sku: data.sku || '',
    barcode: data.barcode || '',
    category: data.category || '',
    brand: data.brand || "Kimae's Kitchen",
    supplierId: data.supplierId || '',
    description: data.description || '',
    shortDescription: data.shortDescription || '',
    images: data.images || [],
    price: Number(data.price) || 0,
    promoPrice: data.promoPrice ? Number(data.promoPrice) : undefined,
    cost: Number(data.cost) || 0,
    stock: Number(data.stock) || 0,
    minOrder: Number(data.minOrder) || 1,
    maxOrder: Number(data.maxOrder) || 99,
    reorderLevel: Number(data.reorderLevel) || 10,
    unit: data.unit || 'bilao',
    servingSize: data.servingSize || '',
    personsServed: Number(data.personsServed) || 1,
    prepTime: Number(data.prepTime) || 30,
    available: Boolean(data.available),
    featured: Boolean(data.featured),
    bestSeller: Boolean(data.bestSeller),
    isNew: Boolean(data.isNew),
    recommended: Boolean(data.recommended),
    taxConfig: data.taxConfig || 'standard_vat',
    expirationDate: data.expirationDate || '',
    batchNumber: data.batchNumber || '',
    status: data.status || 'active',
    options: data.options || [],
    tags: data.tags || [],
    createdAt: createdAtIso,
    updatedAt: updatedAtIso,
  };
}

/**
 * Real-time listener for all active products
 */
export function subscribeToProducts(callback: (products: Product[]) => void): () => void {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      // If collection is empty, trigger auto-seed once in background
      seedProductsIfEmpty();
    }
    const products: Product[] = [];
    snapshot.forEach((docSnap) => {
      products.push(mapDocToProduct(docSnap.id, docSnap.data()));
    });
    callback(products);
  }, (error) => {
    console.error('Error listening to products:', error);
  });
}

/**
 * Real-time listener for categories
 */
export function subscribeToCategories(callback: (categories: Category[]) => void): () => void {
  const colRef = collection(db, CATEGORIES_COLLECTION);
  const q = query(colRef, orderBy('sortOrder', 'asc'));

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      seedCategoriesIfEmpty();
    }
    const cats: Category[] = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      cats.push({
        id: docSnap.id,
        name: d.name || '',
        slug: d.slug || '',
        description: d.description || '',
        image: d.image || '',
        sortOrder: Number(d.sortOrder) || 0,
        active: Boolean(d.active),
      });
    });
    callback(cats);
  }, (error) => {
    console.error('Error listening to categories:', error);
  });
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return mapDocToProduct(snap.id, snap.data());
}

/**
 * Create or update product in Firestore
 */
export async function saveProductToFirestore(product: Partial<Product> & { name: string; price: number }): Promise<string> {
  const id = product.id || `prod-${Date.now()}`;
  const docRef = doc(db, PRODUCTS_COLLECTION, id);

  const payload: any = {
    ...product,
    id,
    updatedAt: serverTimestamp(),
  };

  if (!product.id) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(docRef, payload, { merge: true });
  return id;
}

/**
 * Update stock level directly in Firestore
 */
export async function updateProductStock(id: string, newStock: number): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(docRef, {
    stock: newStock,
    available: newStock > 0,
    status: newStock === 0 ? 'out_of_stock' : 'active',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete / Archive product
 */
export async function archiveProduct(id: string): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(docRef, {
    status: 'archived',
    available: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Helper: Seed initial products into Firestore if database is fresh
 */
export async function seedProductsIfEmpty(): Promise<void> {
  if (isSeedingProducts) return;
  
  // Products table write permission requires an authenticated staff/admin session according to firestore.rules
  // If the user is unauthenticated or has insufficient permissions, do not bombard the server
  const localUser = getLocalAuthUser();
  const isStaffRole = localUser && ['admin', 'super_admin', 'manager', 'cashier', 'inventory_staff', 'kitchen', 'rider'].includes(localUser.role);
  if (!auth.currentUser && !isStaffRole) {
    return;
  }

  isSeedingProducts = true;
  try {
    const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (!snap.empty) return;

    const batch = writeBatch(db);
    const sourceProducts = INITIAL_CENTRAL_PRODUCTS.length > 0 ? INITIAL_CENTRAL_PRODUCTS : PRODUCTS;

    sourceProducts.forEach((p) => {
      const docRef = doc(db, PRODUCTS_COLLECTION, p.id);
      batch.set(docRef, {
        ...p,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    console.log('Seeded initial products into Firestore!');
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
      // Expected when client is not logged into Firebase Auth with staff/admin role; silence noisy error
      console.info('Client has read-only access to products collection; using static fallback catalog.');
    } else {
      console.warn('Failed to seed products:', err);
    }
  } finally {
    isSeedingProducts = false;
  }
}

/**
 * Helper: Seed initial categories into Firestore if empty
 */
export async function seedCategoriesIfEmpty(): Promise<void> {
  if (isSeedingCategories) return;

  const localUser = getLocalAuthUser();
  const isAdminRole = localUser && ['admin', 'super_admin'].includes(localUser.role);
  if (!auth.currentUser && !isAdminRole) {
    return;
  }

  isSeedingCategories = true;
  try {
    const snap = await getDocs(collection(db, CATEGORIES_COLLECTION));
    if (!snap.empty) return;

    const batch = writeBatch(db);
    CATEGORIES.forEach((c) => {
      const docRef = doc(db, CATEGORIES_COLLECTION, c.id);
      batch.set(docRef, {
        ...c,
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();
    console.log('Seeded initial categories into Firestore!');
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
      console.info('Client has read-only access to categories collection; using static fallback catalog.');
    } else {
      console.warn('Failed to seed categories:', err);
    }
  } finally {
    isSeedingCategories = false;
  }
}
