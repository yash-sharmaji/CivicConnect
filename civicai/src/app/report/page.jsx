'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { InteractiveMap } from '@/components/ui/InteractiveMap';
import { useToast } from '@/components/ui/Toast';
import { simulateAIVision } from '@/lib/aiService';
import { addIssueWithImage, scanImageWithAI } from '@/lib/mockData';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  Upload, 
  MapPin, 
  Cpu, 
  Sparkles, 
  Trash2, 
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function ReportIssuePage() {
  const router = useRouter();
  const { toast } = useToast();

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pothole & Road Damage');
  const [severity, setSeverity] = useState('medium');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState(null);

  // Upload & AI Analysis States
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [aiResult, setAiResult] = useState(null);
  const [appliedAI, setAppliedAI] = useState(false);
  
  const fileInputRef = useRef(null);

  // Categories list
  const categoryOptions = [
    { value: 'Pothole & Road Damage', label: 'Pothole & Road Damage' },
    { value: 'Broken Streetlight', label: 'Broken Streetlight' },
    { value: 'Water Leakage', label: 'Water Leakage' },
    { value: 'Overflowing Garbage Bins', label: 'Overflowing Garbage Bins' },
    { value: 'Damaged Public Infrastructure', label: 'Damaged Public Infrastructure' }
  ];

  // Map Picker handler
  const handleLocationSelect = (loc) => {
    setAddress(loc.address);
    setCoordinates({ lat: loc.lat, lng: loc.lng });
    toast('info', 'Location Marked', 'Coordinates successfully recorded.');
  };

  // Image Upload handler
  const processImageFile = (file) => {
    setImageFile(file);
    // Create local object URL for preview
    const localUrl = URL.createObjectURL(file);
    setImageUrl(localUrl);
 
    // Trigger AI Scan
    setIsAnalyzing(true);
    setAnalysisProgress(30);
    setAiResult(null);
    setAppliedAI(false);
 
    scanImageWithAI(file).then((res) => {
      setAnalysisProgress(100);
      setIsAnalyzing(false);
      setAiResult({
        title: res.title,
        description: res.description,
        category: res.category,
        severity: res.severity,
        confidence: res.confidence,
        tags: [res.category, res.severity],
        resolvedSuggestion: `Immediate dispatch suggested for category '${res.category}'`
      });
      toast('success', 'AI Analysis Complete', 'Suggested titles, descriptions, and categories generated.');
    }).catch((err) => {
      setIsAnalyzing(false);
      toast('danger', 'AI Scan Failed', err.message || 'Could not analyze image.');
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImageUrl('');
    setAiResult(null);
    setAppliedAI(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Apply AI Suggestions
  const applyAISuggestions = () => {
    if (!aiResult) return;
    setTitle(aiResult.title);
    setDescription(aiResult.description);
    setCategory(aiResult.category);
    setSeverity(aiResult.severity);
    setAppliedAI(true);
    toast('success', 'AI Recommendations Applied', 'Form fields populated automatically.');
  };

  // Submit Issue
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description || !address || !coordinates) {
      toast('warning', 'Missing Fields', 'Please complete title, description, and mark location coordinates on map.');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('categoryName', category);
    formData.append('severity', severity);
    formData.append('latitude', coordinates.lat.toString());
    formData.append('longitude', coordinates.lng.toString());
    formData.append('address', address);
    if (aiResult) {
      formData.append('confidenceScore', aiResult.confidence.toString());
    }
    if (imageFile) {
      formData.append('image', imageFile);
    } else {
      formData.append('imageUrl', imageUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80');
    }

    addIssueWithImage(formData)
      .then((newIssue) => {
        setIsSubmitting(false);
        toast('success', 'Report Filed', 'Thank you! Your community concern has been logged.');
        router.push('/dashboard');
      })
      .catch((err) => {
        setIsSubmitting(false);
        toast('danger', 'Submission Failed', err.message || 'Could not report issue.');
      });
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Report Local Issue</h1>
        <p className="text-sm text-gray-400 mt-1">Submit a concern with photo, precise coordinates, and AI assisted details.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Form Details */}
        <div className="space-y-6">
          <Card className="bg-[#0b0b0e]/70 border-white/5">
            <CardHeader>
              <CardTitle>Issue Information</CardTitle>
              <CardDescription>Upload a photo to automatically fill details using AI</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Upload Zone */}
                {!imageUrl ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center gap-3
                      ${isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/10 hover:border-white/20 bg-white/5'}
                    `}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="h-10 w-10 rounded-full bg-[#121216] flex items-center justify-center border border-white/5 text-gray-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Drag & drop photo here, or click to upload</p>
                      <p className="text-[10px] text-gray-500 mt-1">Supports PNG, JPG, JPEG up to 10MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative border border-white/10 rounded-xl overflow-hidden bg-[#121216] max-h-48 flex justify-center">
                    <img src={imageUrl} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-red-400 hover:text-red-300 transition-all border border-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Form fields */}
                <Input
                  label="Title / Summary"
                  placeholder="e.g., Deep Pothole on Oak Ave Crossing"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <Select
                    label="Category"
                    options={categoryOptions}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Severity</label>
                    <div className="flex gap-1.5 bg-[#0f0f13] border border-white/10 rounded-xl p-1 h-[42px] items-center">
                      {(['low', 'medium', 'high', 'critical']).map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setSeverity(sev)}
                          className={`
                            flex-1 h-full rounded-lg text-[10px] font-bold capitalize transition-all
                            ${severity === sev
                              ? sev === 'critical' ? 'bg-red-600 text-white shadow-md' :
                                sev === 'high' ? 'bg-amber-600 text-white shadow-md' :
                                sev === 'medium' ? 'bg-indigo-600 text-white shadow-md' :
                                'bg-gray-600 text-white shadow-md'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }
                          `}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Textarea
                  label="Description"
                  placeholder="Provide details about the issue. How is it impacting traffic, safety, or cleanliness?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <Input
                  label="Location Address"
                  placeholder="e.g. 742 Oak Avenue (Click map on right to mark location)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />

                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  Submit Report
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Assistant & Map coordinates picker */}
        <div className="space-y-6">
          {/* AI Vision Scan Panel */}
          <Card glow className="bg-[#08080b]/90 border-indigo-500/20">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  AI Diagnostic Assistant
                  <Badge variant="glass" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 py-0 text-[9px]">
                    Gemini Vision
                  </Badge>
                </CardTitle>
                <CardDescription className="text-[10px]">Real-time camera telemetry extraction</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAnalyzing && (
                <div className="py-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-indigo-400">
                    <span className="font-semibold flex items-center gap-1.5 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                      Scanning file structure...
                    </span>
                    <span className="font-black">{analysisProgress}%</span>
                  </div>
                  <Progress value={analysisProgress} color="primary" />
                </div>
              )}

              {!isAnalyzing && !aiResult && (
                <div className="py-8 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
                  <Info className="w-5 h-5 text-gray-600" />
                  <span>Upload a photo on the left to activate AI diagnostics.</span>
                </div>
              )}

              {!isAnalyzing && aiResult && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-start justify-between gap-3 p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="success" className="text-[10px]">
                          Match Confirmed: {(aiResult.confidence * 100).toFixed(0)}%
                        </Badge>
                        <Badge variant="glass" className="text-[10px] capitalize">
                          Sev: {aiResult.severity}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-2 truncate">{aiResult.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{aiResult.description}</p>
                    </div>
                  </div>

                  {/* AI Tags */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Detected Objects:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {aiResult.tags.map((tag, i) => (
                        <Badge key={i} variant="glass" className="py-0 text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Action */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Recommended Dispatch Order:</span>
                    <p className="text-[10px] text-indigo-300 leading-normal">{aiResult.resolvedSuggestion}</p>
                  </div>

                  {/* Apply suggestion CTA */}
                  {!appliedAI ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-indigo-500/30 hover:border-indigo-500/50 bg-indigo-600/5 hover:bg-indigo-600/10 text-indigo-300"
                      onClick={applyAISuggestions}
                      leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                    >
                      Apply AI Recommendations
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 py-2 text-emerald-400 text-xs font-semibold bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <Check className="w-4 h-4" />
                      Applied to Form Fields
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interactive Coordinates Pin drop Map */}
          <div className="h-[280px]">
            <InteractiveMap
              interactive={true}
              onLocationSelect={handleLocationSelect}
              selectedLat={coordinates?.lat}
              selectedLng={coordinates?.lng}
            />
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
