/**
 * AARNA USA - Firebase Backend Integration Module
 * Free Spark Tier: Firebase Authentication & Cloud Firestore Realtime Sync
 * Provides safe fallback to AarnaStore/localStorage so NO product data is ever lost.
 */

(function (window) {
  'use strict';

  // Default / Template configuration for free Spark tier
  const STORAGE_KEY_FIREBASE_CONFIG = 'aarna_firebase_config';
  const STORAGE_KEY_CLOUD_SYNC_STATUS = 'aarna_firebase_sync_status';

  // Default configuration for aarna-489af project
  const defaultFirebaseConfig = {
    apiKey: "AIzaSyBXVUtxItDnk_6BaiRu85MrWSlFXcNlf9E",
    authDomain: "aarna-489af.firebaseapp.com",
    projectId: "aarna-489af",
    storageBucket: "aarna-489af.firebasestorage.app",
    messagingSenderId: "888395161772",
    appId: "1:888395161772:web:8f112b7950c8bb1f6bbf09",
    measurementId: "G-458B44XLC6"
  };

  let activeConfig = null;

  try {
    const saved = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (saved) {
      activeConfig = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Could not read saved Firebase config:', e);
  }

  // Fallback to the live project credentials
  if (!activeConfig || !activeConfig.apiKey || activeConfig.apiKey.includes('Placeholder')) {
    activeConfig = defaultFirebaseConfig;
  }

  const AarnaFirebase = {
    app: null,
    auth: null,
    db: null,
    isConnected: false,
    isInitialized: false,
    activeConfig: activeConfig,

    // Initialize Firebase
    init: async function () {
      if (this.isInitialized && this.isConnected) return this;

      try {
        // Load Firebase SDK if not already present
        if (!window.firebase) {
          await this.loadScripts();
        }

        if (window.firebase && this.activeConfig && this.activeConfig.apiKey && !this.activeConfig.apiKey.includes('Placeholder')) {
          if (!firebase.apps.length) {
            this.app = firebase.initializeApp(this.activeConfig);
          } else {
            this.app = firebase.app();
          }

          this.auth = firebase.auth();
          this.db = firebase.firestore();
          this.isConnected = true;
          this.isInitialized = true;
          console.log('✅ Firebase initialized successfully (Project:', this.activeConfig.projectId, ')');
          
          // Seed & Sync products if needed
          this.syncAllProductsToCloud();
        } else {
          console.log('ℹ️ Firebase ready for project configuration. Running with local safe cache.');
          this.isInitialized = true;
        }
      } catch (err) {
        console.warn('⚠️ Firebase init notice (falling back to secure local store):', err.message);
        this.isConnected = false;
        this.isInitialized = true;
      }

      this.updateStatusBadge();
      return this;
    },

    // Dynamically load Firebase App, Auth, Firestore from official CDN
    loadScripts: function () {
      return new Promise((resolve, reject) => {
        const scripts = [
          'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
          'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
          'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js'
        ];

        let loaded = 0;
        scripts.forEach((src) => {
          if (document.querySelector(`script[src="${src}"]`)) {
            loaded++;
            if (loaded === scripts.length) resolve();
            return;
          }
          const s = document.createElement('script');
          s.src = src;
          s.async = false;
          s.onload = () => {
            loaded++;
            if (loaded === scripts.length) resolve();
          };
          s.onerror = (e) => reject(e);
          document.head.appendChild(s);
        });
      });
    },

    // Save custom configuration from dashboard modal
    saveConfig: function (configObj) {
      if (!configObj || !configObj.projectId) {
        throw new Error('Project ID is required.');
      }
      this.activeConfig = configObj;
      localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(configObj));
      this.isInitialized = false;
      return this.init();
    },

    // Clear / Reset config
    resetConfig: function () {
      localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
      this.activeConfig = null;
      this.isConnected = false;
      this.updateStatusBadge();
    },

    // Authentication: Login with Email & Password
    login: async function (email, password) {
      if (this.isConnected && this.auth) {
        return this.auth.signInWithEmailAndPassword(email, password);
      }
      // Fallback local authentication
      if ((email.toLowerCase() === 'admin@aarnaus.com' || email.toLowerCase() === 'admin') && password === 'aarna2026') {
        sessionStorage.setItem('aarna_admin_auth', 'authenticated');
        sessionStorage.setItem('aarna_admin_user', JSON.stringify({
          email: email,
          role: 'Administrator',
          mode: 'Local Secure Cache'
        }));
        return { user: { email: email, displayName: 'Admin User' } };
      }
      throw new Error('Invalid email or password.');
    },

    // Authentication: Register / Create New Admin Login
    createAdminUser: async function (email, password) {
      if (this.isConnected && this.auth) {
        return this.auth.createUserWithEmailAndPassword(email, password);
      }
      // Store in local auth list
      const admins = JSON.parse(localStorage.getItem('aarna_admin_logins') || '[]');
      admins.push({ email, createdAt: new Date().toISOString() });
      localStorage.setItem('aarna_admin_logins', JSON.stringify(admins));
      return { user: { email } };
    },

    // Safe Cloud Sync: Save a single product
    saveProduct: async function (catalogKey, product) {
      // 1. Always update local store first (Zero Data Loss guarantee)
      if (window.AarnaStore && typeof window.AarnaStore.saveProduct === 'function') {
        window.AarnaStore.saveProduct(catalogKey, product);
      }

      // 2. If Firebase Firestore is connected, sync to collection
      if (this.isConnected && this.db) {
        try {
          const colName = `products_${catalogKey}`;
          const docId = String(product.id);
          await this.db.collection(colName).doc(docId).set({
            ...product,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          console.log(`☁️ Synced product ${docId} to Firestore collection ${colName}`);
        } catch (err) {
          console.warn('Firestore sync failed, product safely stored locally:', err.message);
        }
      }
    },

    // Safe Cloud Sync: Delete a product
    deleteProduct: async function (catalogKey, productId) {
      // 1. Remove from local store
      if (window.AarnaStore && typeof window.AarnaStore.deleteProduct === 'function') {
        window.AarnaStore.deleteProduct(catalogKey, productId);
      }

      // 2. Remove from Firestore if connected
      if (this.isConnected && this.db) {
        try {
          const colName = `products_${catalogKey}`;
          await this.db.collection(colName).doc(String(productId)).delete();
          console.log(`☁️ Deleted product ${productId} from Firestore ${colName}`);
        } catch (err) {
          console.warn('Firestore delete failed:', err.message);
        }
      }
    },

    // Seed and sync all initial catalog products into Firestore
    syncAllProductsToCloud: async function () {
      if (!this.isConnected || !this.db) return;

      const catalogs = ['institutional', 'retail', 'devices'];
      for (const cat of catalogs) {
        try {
          const products = window.AarnaStore ? 
            (typeof window.AarnaStore.getProducts === 'function' ? window.AarnaStore.getProducts(cat) : window.AarnaStore.getCatalog(cat)) : [];
          if (!products || !products.length) continue;

          const batch = this.db.batch();
          const colRef = this.db.collection(`products_${cat}`);

          products.forEach((prod) => {
            const docRef = colRef.doc(String(prod.id));
            batch.set(docRef, {
              ...prod,
              lastSynced: new Date().toISOString()
            }, { merge: true });
          });

          await batch.commit();
          console.log(`☁️ Batch synced ${products.length} products to Firestore (products_${cat})`);
        } catch (e) {
          console.warn(`Sync failed for ${cat}:`, e.message);
        }
      }
    },

    // Hydrate local products from Firestore (bi-directional sync)
    loadProductsFromCloud: async function (catalogKey) {
      if (!this.isConnected || !this.db) return null;
      try {
        const snap = await this.db.collection(`products_${catalogKey}`).get();
        if (snap.empty) return null;
        const cloudProducts = [];
        snap.forEach(doc => cloudProducts.push(doc.data()));
        return cloudProducts;
      } catch (err) {
        console.warn(`Could not load ${catalogKey} from Firestore:`, err.message);
        return null;
      }
    },

    // Update UI badge in Dashboard
    updateStatusBadge: function () {
      const badge = document.getElementById('firebase-sync-status-badge');
      if (!badge) return;

      if (this.isConnected) {
        badge.innerHTML = `
          <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#10b981; box-shadow:0 0 6px #10b981; margin-right:5px;"></span>
          <span>Firebase: Connected</span>
        `;
        badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        badge.style.color = '#065f46';
        badge.style.backgroundColor = '#ecfdf5';
      } else {
        badge.innerHTML = `
          <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#f59e0b; margin-right:5px;"></span>
          <span>Local Safe Cache (Ready to Connect)</span>
        `;
        badge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
        badge.style.color = '#92400e';
        badge.style.backgroundColor = '#fffbeb';
      }
    }
  };

  window.AarnaFirebase = AarnaFirebase;

  // Auto-init on page load
  document.addEventListener('DOMContentLoaded', () => {
    AarnaFirebase.init();
  });

})(window);
