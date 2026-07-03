'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { Settings, ShieldAlert, Bell, Globe, MapPin } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function SettingsPage() {
  const { toast } = useToast();

  // Settings mock fields
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [radiusLimit, setRadiusLimit] = useState('5');
  const [language, setLanguage] = useState('en');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast('success', 'Settings Saved', 'Your preference settings have been updated.');
    }, 1000);
  };

  const radiusOptions = [
    { value: '1', label: '1 Mile radius' },
    { value: '2', label: '2 Miles radius' },
    { value: '5', label: '5 Miles radius' },
    { value: '10', label: '10 Miles radius' },
    { value: '25', label: '25 Miles radius' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'hi', label: 'हिन्दी' }
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-6 pb-10 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-8 h-8 text-indigo-400" />
          Settings
        </h1>
        <p className="text-sm text-gray-400 mt-1">Configure your community notifications and alert metrics.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Notification preferences */}
        <Card className="bg-[#0b0b0e]/70 border-white/5">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <div>
              <CardTitle className="text-sm font-bold">Preferences & Alerts</CardTitle>
              <CardDescription className="text-[10px]">Toggle communication channels</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-3">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <span className="text-xs font-bold text-white block">Email Notifications</span>
                <span className="text-[10px] text-gray-500">Receive summaries of local hazard resolutions</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4 w-4 accent-indigo-500 rounded bg-[#0f0f13] border-white/10"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-xs font-bold text-white block">Push Alerts</span>
                <span className="text-[10px] text-gray-500">Instant notification when a critical issue is reported nearby</span>
              </div>
              <input
                type="checkbox"
                checked={pushAlerts}
                onChange={(e) => setPushAlerts(e.target.checked)}
                className="h-4 w-4 accent-indigo-500 rounded bg-[#0f0f13] border-white/10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location bounds preferences */}
        <Card className="bg-[#0b0b0e]/70 border-white/5">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <MapPin className="w-5 h-5 text-indigo-400" />
            <div>
              <CardTitle className="text-sm font-bold">Locality Bounds</CardTitle>
              <CardDescription className="text-[10px]">Filter map items to save bandwith</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-3">
            <Select
              label="Notification Alert Radius"
              options={radiusOptions}
              value={radiusLimit}
              onChange={(e) => setRadiusLimit(e.target.value)}
            />
            <Select
              label="Display Language"
              options={languageOptions}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full sm:w-auto self-start" isLoading={isSaving}>
          Save Settings
        </Button>
      </form>
    </div>
    </ProtectedRoute>
  );
}
