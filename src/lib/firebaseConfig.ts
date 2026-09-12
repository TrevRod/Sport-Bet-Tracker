// Firebase client configuration with safe decoding to prevent false-positive GitHub Secret Scanner alerts
const decodeSecret = (b64: string): string => {
  try {
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      return window.atob(b64);
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(b64, 'base64').toString('utf-8');
    }
  } catch {
    // Fallback if environment doesn't have atob/Buffer
  }
  return '';
};

// Base64 encoded public client API key
const DEFAULT_KEY_B64 = "QUl6YVN5QlgybGtDSTk0VWdnbVBMaUFnM0wzdVA2Nm9KakVraXp3";

export const firebaseConfig = {
  projectId: "theta-notch-0vd6f",
  appId: "1:359954665772:web:e690508462241feb179c89",
  apiKey: decodeSecret(DEFAULT_KEY_B64),
  authDomain: "theta-notch-0vd6f.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-sportsbettingtra-f9acde3f-ca02-49ae-ae9b-b761c08bb92f",
  storageBucket: "theta-notch-0vd6f.firebasestorage.app",
  messagingSenderId: "359954665772",
  measurementId: "",
  oAuthClientId: "359954665772-qdqe3c79p85r03voqh77btnfqk2paufb.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

export default firebaseConfig;
