"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lock } from "lucide-react";

const PIN_STORAGE_KEY = "life26-pin";
const SESSION_KEY = "life26-session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function PinLock({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [confirmPin, setConfirmPin] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
    const session = localStorage.getItem(SESSION_KEY);

    if (!storedPin) {
      setIsSetup(true);
      setIsLocked(true);
      return;
    }

    if (session) {
      const sessionTime = parseInt(session, 10);
      if (Date.now() - sessionTime < SESSION_DURATION) {
        setIsLocked(false);
        return;
      }
    }

    setIsLocked(true);
  }, []);

  const handleInput = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(false);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newPin.every(d => d !== "") && index === 3) {
      const fullPin = newPin.join("");

      if (isSetup) {
        if (confirmPin === null) {
          setConfirmPin(fullPin);
          setPin(["", "", "", ""]);
          setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } else if (confirmPin === fullPin) {
          localStorage.setItem(PIN_STORAGE_KEY, fullPin);
          localStorage.setItem(SESSION_KEY, Date.now().toString());
          setIsLocked(false);
          setIsSetup(false);
        } else {
          setError(true);
          setConfirmPin(null);
          setPin(["", "", "", ""]);
          setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
      } else {
        const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
        if (fullPin === storedPin) {
          localStorage.setItem(SESSION_KEY, Date.now().toString());
          setIsLocked(false);
        } else {
          setError(true);
          setPin(["", "", "", ""]);
          setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (!isLocked) return <>{children}</>;

  return (
    <div className="fixed inset-0 bg-black z-[999] flex flex-col items-center justify-center" dir="rtl">
      <div className="flex flex-col items-center gap-8">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${error ? "bg-red-500/20 border border-red-500/40" : "bg-orange-500/10 border border-orange-500/20"}`}>
          <Lock size={28} className={error ? "text-red-400" : "text-orange-500"} />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-black text-white italic tracking-tight">LIFE26</h2>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] mt-1">
            {isSetup
              ? confirmPin === null
                ? "הגדר קוד PIN"
                : "אשר קוד PIN"
              : "הזן קוד PIN"
            }
          </p>
        </div>

        <div className="flex gap-3">
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
              className={`w-14 h-14 text-center text-2xl font-black rounded-xl border outline-none transition-all duration-300 bg-zinc-900/50 ${
                error
                  ? "border-red-500/50 text-red-400 animate-shake"
                  : digit
                    ? "border-orange-500/50 text-orange-500"
                    : "border-zinc-800 text-white focus:border-orange-500/30"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-400 font-mono animate-in fade-in duration-300">
            {isSetup ? "הקודים לא תואמים, נסה שוב" : "קוד שגוי"}
          </p>
        )}
      </div>
    </div>
  );
}
