import {
  authStorageEventName,
  authStorageKey,
  clearAuthState,
  emptyAuthState,
  legacyAuthStorageKey,
  readAuthState,
  subscribeAuthState,
  writeAuthState,
  type AuthState,
} from "@/features/auth/auth-storage";

const sampleState: AuthState = {
  session: {
    user_id: "user-1",
    username: "admin",
    full_name: "Admin User",
    role: "ADMIN",
    active_shift_id: "shift-101",
  },
  activeShift: {
    shift_id: "shift-101",
    opened_at: "2026-03-10T08:00:00.000Z",
    starting_cash: 500,
  },
  lastClosedShift: null,
};

describe("auth-storage", () => {
  beforeEach(() => {
    localStorage.clear();
    clearAuthState();
  });

  // Test 1 — Round-trip
  it("writeAuthState → readAuthState round-trips all fields correctly", () => {
    writeAuthState(sampleState);
    expect(readAuthState()).toEqual(sampleState);
  });

  // Test 2 — Legacy key removed on write
  it("writeAuthState removes legacy key after writing new key", () => {
    localStorage.setItem(legacyAuthStorageKey, JSON.stringify(sampleState));
    writeAuthState(sampleState);
    expect(localStorage.getItem(legacyAuthStorageKey)).toBeNull();
    expect(localStorage.getItem(authStorageKey)).not.toBeNull();
  });

  // Test 3 — clearAuthState removes both keys
  it("clearAuthState removes both new and legacy keys", () => {
    localStorage.setItem(authStorageKey, JSON.stringify(sampleState));
    localStorage.setItem(legacyAuthStorageKey, JSON.stringify(sampleState));
    clearAuthState();
    expect(localStorage.getItem(authStorageKey)).toBeNull();
    expect(localStorage.getItem(legacyAuthStorageKey)).toBeNull();
  });

  // Test 4 — Empty localStorage returns emptyAuthState (SSR guard proxy: empty storage path)
  it("returns emptyAuthState when localStorage is empty", () => {
    // localStorage.clear() + clearAuthState() in beforeEach ensures clean state
    expect(readAuthState()).toEqual(emptyAuthState);
  });

  // Test 5 — Corrupted JSON returns emptyAuthState without throw
  it("returns emptyAuthState and does not throw on corrupted JSON", () => {
    localStorage.setItem(authStorageKey, "{{not-valid-json}}");
    expect(() => readAuthState()).not.toThrow();
    expect(readAuthState()).toEqual(emptyAuthState);
  });

  // Test 6 — writeAuthState dispatches custom event
  it("writeAuthState dispatches the auth-session.changed custom event", () => {
    const handler = vi.fn();
    window.addEventListener(authStorageEventName, handler);
    writeAuthState(sampleState);
    window.removeEventListener(authStorageEventName, handler);
    expect(handler).toHaveBeenCalledOnce();
  });

  // Test 7a — subscribeAuthState responds to authStorageEventName
  it("subscribeAuthState fires callback on auth-session.changed event", () => {
    const callback = vi.fn();
    const unsubscribe = subscribeAuthState(callback);
    window.dispatchEvent(new Event(authStorageEventName));
    unsubscribe();
    expect(callback).toHaveBeenCalledOnce();
  });

  // Test 7b — subscribeAuthState responds to native storage event
  it("subscribeAuthState fires callback on native storage event", () => {
    const callback = vi.fn();
    const unsubscribe = subscribeAuthState(callback);
    window.dispatchEvent(new Event("storage"));
    unsubscribe();
    expect(callback).toHaveBeenCalledOnce();
  });

  // Test 8 — Legacy key fallback
  it("reads from legacy key when new key is absent", () => {
    const legacyState: AuthState = {
      session: {
        user_id: "user-2",
        username: "cashier",
        full_name: "Cashier User",
        role: "CASHIER",
        active_shift_id: null,
      },
      activeShift: null,
      lastClosedShift: null,
    };
    localStorage.setItem(legacyAuthStorageKey, JSON.stringify(legacyState));
    expect(readAuthState()).toEqual(legacyState);
  });
});
