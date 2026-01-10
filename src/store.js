import { create } from 'zustand';

// eslint-disable-next-line import/prefer-default-export
export const useStore = create((set) => ({
  lenis: undefined,
  setLenis: (lenis) => set({ lenis }),
  introOut: false,
  setIntroOut: (introOut) => set({ introOut }),
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
  fluidColor: '#d7d7d4',
  setFluidColor: (fluidColor) => set({ fluidColor }),
  isAbout: false,
  setIsAbout: (isAbout) => set({ isAbout }),
  // Auth modal state
  isAuthModalOpen: false,
  setIsAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),
  authModalTab: 'login', // 'login' or 'register'
  setAuthModalTab: (authModalTab) => set({ authModalTab }),
  // Wishlist and Cart
  wishlist: [],
  setWishlist: (wishlist) => set({ wishlist }),
  cart: [],
  setCart: (cart) => set({ cart }),
  cartTotal: 0,
  setCartTotal: (cartTotal) => set({ cartTotal }),
  // Alert Dialog
  alertDialog: {
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    confirmText: 'OK',
    cancelText: 'Batal',
    showCancel: false,
  },
  setAlertDialog: (alertDialog) => set({ alertDialog }),
  showAlert: ({ title, message, type = 'info', onConfirm, confirmText, cancelText, showCancel }) => {
    // Debug log to verify alert calls
    // eslint-disable-next-line no-console
    console.log('[store.showAlert] title:', title, 'message:', message, 'type:', type);
    return set({
      alertDialog: {
        isOpen: true,
        title,
        message,
        type,
        onConfirm,
        confirmText: confirmText || 'OK',
        cancelText: cancelText || 'Batal',
        showCancel: showCancel !== undefined ? showCancel : type === 'confirm',
      },
    });
  },
  hideAlert: () =>
    set({
      alertDialog: {
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: null,
        confirmText: 'OK',
        cancelText: 'Batal',
        showCancel: false,
      },
    }),
}));
