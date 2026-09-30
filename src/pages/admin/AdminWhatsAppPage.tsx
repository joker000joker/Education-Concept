import React, { useState, useEffect } from 'react';
import { BackButton } from '../../components/common/BackButton';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { MessageCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Validates whether the given string is a valid WhatsApp Channel URL.
 * Accepts formats like:
 * - https://whatsapp.com/channel/0029Va...
 * - https://www.whatsapp.com/channel/0029Va...
 * - whatsapp.com/channel/0029Va...
 */
export function validateWhatsAppChannelUrl(url: string): {
  isValid: boolean;
  normalizedUrl?: string;
  error?: string;
} {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'Please enter a WhatsApp Channel URL.' };
  }

  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (host !== 'whatsapp.com' && host !== 'www.whatsapp.com') {
      return {
        isValid: false,
        error: 'URL must be a whatsapp.com channel link (e.g. https://whatsapp.com/channel/...)',
      };
    }

    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2 || pathParts[0].toLowerCase() !== 'channel' || !pathParts[1].trim()) {
      return {
        isValid: false,
        error: 'URL must include /channel/ followed by the channel identifier (e.g. https://whatsapp.com/channel/...)',
      };
    }

    return { isValid: true, normalizedUrl: trimmed };
  } catch {
    return {
      isValid: false,
      error: 'Please enter a valid URL (e.g. https://whatsapp.com/channel/...)',
    };
  }
}

export const AdminWhatsAppPage: React.FC = () => {
  const toast = useToast();
  const [channelUrl, setChannelUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load existing saved WhatsApp Channel URL
  useEffect(() => {
    let isMounted = true;

    const loadExistingUrl = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        // Query primary key 'whatsapp_channel_url'
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'whatsapp_channel_url')
          .maybeSingle();

        if (!error && data?.value && isMounted) {
          setChannelUrl(data.value);
          return;
        }

        // Fallback: check 'whatsapp_number' if it contains a channel link
        const { data: legacyData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'whatsapp_number')
          .maybeSingle();

        if (legacyData?.value && legacyData.value.includes('whatsapp.com/channel') && isMounted) {
          setChannelUrl(legacyData.value);
          return;
        }

        // Fallback: check local storage cache
        const cached = localStorage.getItem('ec_whatsapp_channel_url');
        if (cached && isMounted) {
          setChannelUrl(cached);
        }
      } catch (err: any) {
        console.error('Failed to load saved WhatsApp Channel URL:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadExistingUrl();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const validation = validateWhatsAppChannelUrl(channelUrl);
    if (!validation.isValid || !validation.normalizedUrl) {
      const err = validation.error || 'Please enter a valid WhatsApp Channel URL.';
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    const finalUrl = validation.normalizedUrl;
    setSaving(true);

    try {
      // 1. Save to database using app_settings table under 'whatsapp_channel_url'
      const { error: upsertError } = await supabase
        .from('app_settings')
        .upsert(
          {
            key: 'whatsapp_channel_url',
            value: finalUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (upsertError) {
        throw upsertError;
      }

      // 2. Also keep 'whatsapp_number' aligned in case any legacy component reads it
      try {
        await supabase
          .from('app_settings')
          .upsert(
            {
              key: 'whatsapp_number',
              value: finalUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          );
      } catch {
        // Safe to ignore legacy sync failure
      }

      // 3. Cache locally so the mobile bottom navigation immediately updates
      try {
        localStorage.setItem('ec_whatsapp_channel_url', finalUrl);
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'ec_whatsapp_channel_url',
            newValue: finalUrl,
          })
        );
      } catch {}

      setChannelUrl(finalUrl);
      setSuccessMsg('WhatsApp Channel URL saved successfully!');
      toast.success('WhatsApp Channel URL saved successfully!');
    } catch (err: any) {
      const msg = err?.message || 'Failed to save WhatsApp Channel URL. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <BackButton to="/admin" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <MessageCircle className="w-6 h-6 text-emerald-600" />
            WhatsApp
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage the WhatsApp Channel destination URL used by the website's WhatsApp navigation button.
          </p>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label
              htmlFor="whatsapp-channel-url"
              className="block text-sm font-semibold text-slate-800 mb-2"
            >
              WhatsApp Channel URL
            </label>
            {loading ? (
              <div className="flex items-center gap-3 h-11 px-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                <span>Loading saved URL...</span>
              </div>
            ) : (
              <input
                id="whatsapp-channel-url"
                type="text"
                value={channelUrl}
                onChange={(e) => {
                  setChannelUrl(e.target.value);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                placeholder="https://whatsapp.com/channel/..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-hidden transition-all text-sm text-slate-800 placeholder-slate-400"
                disabled={saving}
              />
            )}
          </div>

          {/* Error Feedback Banner */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Success Feedback Banner */}
          {successMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{successMsg}</span>
            </div>
          )}

          {/* Save Action */}
          <div>
            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save / Update URL</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
