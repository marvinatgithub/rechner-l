import React from 'react';
import { X, Settings, Vibrate, Globe, Check, ShieldCheck, Smartphone } from 'lucide-react';
import { NumberLocale, CalculatorSettings } from '../types/calculator';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CalculatorSettings;
  onUpdateSettings: (newSettings: Partial<CalculatorSettings>) => void;
  onTriggerInstall?: () => void;
  isInstallable?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onTriggerInstall,
  isInstallable,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#1E1F24] border border-stone-700/80 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-semibold text-stone-100">
              Einstellungen
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Number Format */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Zahlen- & Dezimalformat</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {/* German Standard */}
            <div
              onClick={() => onUpdateSettings({ locale: 'de-DE' })}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                settings.locale === 'de-DE'
                  ? 'bg-sky-950/40 border-sky-500 text-stone-100'
                  : 'bg-stone-900/40 border-stone-800 hover:border-stone-700 text-stone-400'
              }`}
            >
              <div>
                <div className="text-sm font-medium text-stone-200">
                  Deutsch (DIN 5008 / Standard)
                </div>
                <div className="text-xs text-stone-400 mt-0.5">
                  Komma für Dezimalstellen · z. B. <span className="font-mono text-sky-300">1.234,56</span>
                </div>
              </div>
              {settings.locale === 'de-DE' && (
                <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-white shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* International Standard */}
            <div
              onClick={() => onUpdateSettings({ locale: 'en-US' })}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                settings.locale === 'en-US'
                  ? 'bg-sky-950/40 border-sky-500 text-stone-100'
                  : 'bg-stone-900/40 border-stone-800 hover:border-stone-700 text-stone-400'
              }`}
            >
              <div>
                <div className="text-sm font-medium text-stone-200">
                  International (US / UK)
                </div>
                <div className="text-xs text-stone-400 mt-0.5">
                  Punkt für Dezimalstellen · z. B. <span className="font-mono text-stone-300">1,234.56</span>
                </div>
              </div>
              {settings.locale === 'en-US' && (
                <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-white shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Haptic Vibration */}
        <div className="space-y-2 pt-2 border-t border-stone-800">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-900/40 border border-stone-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-stone-800 text-stone-300">
                <Vibrate className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-stone-200">
                  Haptisches Feedback
                </div>
                <div className="text-xs text-stone-400">
                  Sanfte Vibration beim Tastendruck (Android)
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                onUpdateSettings({ vibrationEnabled: !settings.vibrationEnabled })
              }
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                settings.vibrationEnabled ? 'bg-sky-600' : 'bg-stone-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.vibrationEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Section 3: Android PWA Home Screen */}
        {isInstallable && (
          <div className="space-y-2 pt-2 border-t border-stone-800">
            <div className="p-3 rounded-2xl bg-sky-950/30 border border-sky-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-900/50 text-sky-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-stone-200">
                    Als Android-App installieren
                  </div>
                  <div className="text-xs text-stone-400">
                    Direkt auf Ihren Startbildschirm hinzufügen
                  </div>
                </div>
              </div>
              <button
                onClick={onTriggerInstall}
                className="px-3 py-1.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
              >
                Installieren
              </button>
            </div>
          </div>
        )}

        {/* Section 4: Privacy & Information */}
        <div className="p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800 text-xs text-stone-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-stone-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Lokal & Unbegrenzt</span>
          </div>
          <p className="leading-relaxed">
            Ihre Berechnungshistorie unterliegt keiner Zeitbeschränkung und wird ausschließlich sicher lokal auf Ihrem Gerät gespeichert. Es werden keine Daten an externe Server übertragen.
          </p>
        </div>

        {/* Close Button */}
        <div className="pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};
