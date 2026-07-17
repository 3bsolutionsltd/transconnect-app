import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Save, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle, 
  Image as ImageIcon,
  Palette,
  Eye,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface PortalConfig {
  slug: string;
  brandLogoUrl: string;
  heroImageUrl: string;
  brandColor: string;
  tagline: string;
  description: string;
  portalEnabled: boolean;
}

interface PortalConfigResponse {
  success: boolean;
  slug?: string;
  brandLogoUrl?: string;
  heroImageUrl?: string;
  brandColor?: string;
  tagline?: string;
  description?: string;
  portalEnabled?: boolean;
  portalUrl?: string;
  isConfigured?: boolean;
}

const OperatorPortalConfig = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<PortalConfig>({
    slug: '',
    brandLogoUrl: '',
    heroImageUrl: '',
    brandColor: '#16a34a',
    tagline: '',
    description: '',
    portalEnabled: false
  });
  const [originalSlug, setOriginalSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '') + '/api';
  const WEB_BASE_URL = process.env.REACT_APP_WEB_URL || 'http://localhost:3000';

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(`${API_BASE_URL}/operator-management/portal-config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data: PortalConfigResponse = await response.json();
        
        const loadedConfig = {
          slug: data.slug || '',
          brandLogoUrl: data.brandLogoUrl || '',
          heroImageUrl: data.heroImageUrl || '',
          brandColor: data.brandColor || '#16a34a',
          tagline: data.tagline || '',
          description: data.description || '',
          portalEnabled: data.portalEnabled || false
        };

        setConfig(loadedConfig);
        setOriginalSlug(data.slug || '');
        setIsConfigured(data.isConfigured || false);

        if (data.isConfigured && data.slug) {
          setMessage({
            type: 'info',
            text: `Your portal is live at: ${WEB_BASE_URL}/operator/${data.slug}`
          });
        }
      } else {
        console.error('Failed to load config:', response.status);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to load portal configuration. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    // Validation
    if (config.slug && !/^[a-z0-9-]{3,50}$/.test(config.slug)) {
      setMessage({ 
        type: 'error', 
        text: 'Slug must be 3-50 characters, lowercase letters, numbers, and hyphens only' 
      });
      return;
    }

    if (config.brandColor && !/^#[0-9A-Fa-f]{6}$/.test(config.brandColor)) {
      setMessage({ 
        type: 'error', 
        text: 'Brand color must be a valid hex color (e.g., #FF5722)' 
      });
      return;
    }

    if (config.tagline && config.tagline.length > 100) {
      setMessage({ 
        type: 'error', 
        text: 'Tagline must be 100 characters or less' 
      });
      return;
    }

    if (config.description && config.description.length > 500) {
      setMessage({ 
        type: 'error', 
        text: 'Description must be 500 characters or less' 
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/operator-management/portal-config`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const data: PortalConfigResponse = await response.json();

      if (response.ok) {
        setOriginalSlug(data.slug || config.slug);
        setIsConfigured(true);
        setMessage({ 
          type: 'success', 
          text: `Portal configuration saved successfully! ${data.portalUrl ? `Your portal URL: ${data.portalUrl}` : ''}` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: (data as any).error || 'Failed to save configuration' 
        });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please check your connection and try again.' 
      });
    } finally {
      setSaving(false);
    }
  }

  function handleSlugChange(value: string) {
    // Auto-format slug: lowercase, replace spaces with hyphens, remove invalid chars
    const formatted = value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 50);
    setConfig({ ...config, slug: formatted });
  }

  const portalUrl = config.slug 
    ? `${WEB_BASE_URL}/operator/${config.slug}`
    : '';

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading portal configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-green-100 p-2 rounded-lg">
            <Globe className="h-6 w-6 text-green-700" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">My Operator Portal</h2>
        </div>
        <p className="text-gray-600">
          Customize your passenger-facing booking portal. Share your unique URL with customers to promote your routes!
        </p>
      </div>

      {/* Status Message */}
      {message && (
        <div 
          className={`mb-6 p-4 rounded-lg flex items-start ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : message.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
          ) : message.type === 'error' ? (
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
          ) : (
            <Info className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
          )}
          <span className="flex-1">{message.text}</span>
        </div>
      )}

      {/* Configuration Form */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Enable Portal Toggle */}
        <div className="flex items-center justify-between pb-6 border-b">
          <div className="flex-1">
            <label className="font-medium text-gray-900 text-lg">Enable Operator Portal</label>
            <p className="text-sm text-gray-600 mt-1">
              Make your branded portal visible to passengers. You can disable it anytime.
            </p>
          </div>
          <button
            onClick={() => setConfig({ ...config, portalEnabled: !config.portalEnabled })}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              config.portalEnabled ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                config.portalEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Portal URL Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Portal URL Slug <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-sm rounded-l-md">
                {WEB_BASE_URL}/operator/
              </span>
              <input
                type="text"
                value={config.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="your-company-name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              3-50 characters, lowercase letters, numbers, and hyphens only. This will be your unique portal URL.
            </p>
          </div>
        </div>

        {/* Brand Logo URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand Logo URL
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={config.brandLogoUrl}
                onChange={(e) => setConfig({ ...config, brandLogoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {config.brandLogoUrl && (
                <div className="flex items-center justify-center w-12 h-12 border border-gray-300 rounded bg-white">
                  <img 
                    src={config.brandLogoUrl} 
                    alt="Logo preview" 
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              URL to your company logo (PNG, JPG, SVG). Recommended size: 200x80px. Leave blank for no logo.
            </p>
          </div>
        </div>

        {/* Hero Background Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hero Background Image
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={config.heroImageUrl}
                onChange={(e) => setConfig({ ...config, heroImageUrl: e.target.value })}
                placeholder="https://example.com/hero-banner.jpg"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {config.heroImageUrl && (
                <div className="flex items-center justify-center w-24 h-12 border border-gray-300 rounded bg-white overflow-hidden">
                  <img 
                    src={config.heroImageUrl} 
                    alt="Hero preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              URL to hero background image for your portal landing page. Recommended size: 1920x600px. Leave blank for default image.
            </p>
          </div>
        </div>

        {/* Brand Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand Color
          </label>
          <div className="flex gap-3">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={config.brandColor}
                onChange={(e) => setConfig({ ...config, brandColor: e.target.value })}
                placeholder="#16a34a"
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
              />
              <input
                type="color"
                value={config.brandColor}
                onChange={(e) => setConfig({ ...config, brandColor: e.target.value })}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div 
              className="w-16 h-10 rounded border border-gray-300 shadow-inner"
              style={{ backgroundColor: config.brandColor }}
              title="Color preview"
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Hex color code for your brand (e.g., #FF5722). Used for header, buttons, and accents.
          </p>
        </div>

        {/* Tagline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tagline
          </label>
          <input
            type="text"
            value={config.tagline}
            onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
            placeholder="Your Swift and Reliable Travel Partner"
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Short marketing tagline (max 100 characters). Appears below your company name.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {config.tagline.length}/100 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            About Your Company
          </label>
          <textarea
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            placeholder="Tell passengers about your company, service quality, experience, and what makes you unique..."
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Brief description of your company (max 500 characters). Appears in the "About Us" section.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {config.description.length}/500 characters
          </p>
        </div>

        {/* Portal Preview */}
        {config.slug && isConfigured && config.portalEnabled && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-green-700 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-900 mb-1">Your Portal is Live!</p>
                <p className="text-sm text-green-700 mb-2">
                  Share this URL with your customers to book directly with you:
                </p>
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-medium text-sm underline"
                >
                  {portalUrl}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Info className="h-4 w-4" />
            <span>Changes take effect immediately</span>
          </div>
          <div className="flex gap-3">
            {config.slug && (
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Eye className="h-4 w-4" />
                Preview Portal
              </a>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !config.slug}
              className={`inline-flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-colors ${
                saving || !config.slug
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">Tips for a Great Portal:</p>
            <ul className="text-blue-700 space-y-1 list-disc list-inside">
              <li>Choose a memorable, brandable slug (e.g., your company name)</li>
              <li>Use a high-quality logo with transparent background</li>
              <li>Pick a brand color that matches your company identity</li>
              <li>Write a compelling tagline that highlights your unique value</li>
              <li>Include your experience, fleet quality, and service areas in the description</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorPortalConfig;
