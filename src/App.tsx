import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  UploadCloud,
  CheckCircle,
  XCircle,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Trash2,
  HelpCircle,
  MapPin,
  Users,
  CheckSquare,
  Square,
  Globe,
  Languages,
  Activity,
  Maximize2,
  Sliders,
  AlertOctagon,
  FileSpreadsheet,
  Check,
  Plus
} from "lucide-react";

// The Cloud Run Dev server usually binds to Port 3000, which has relative API resolution!
// Since we are running Express + Vite on the SAME server/port, target relative requests!
const API_BASE = "";

const GOV_LIST = [
  { name: "Baghdad", native: "بغداد", language: "AR" },
  { name: "Basra", native: "البصرة", language: "AR" },
  { name: "Erbil", native: "أربيل / هەولێر", language: "KU" },
  { name: "Sulaymaniyah", native: "السليمانية / سلێمانی", language: "KU" },
  { name: "Duhok", native: "دهوك / دهۆك", language: "KU" },
  { name: "Kirkuk", native: "كركوك / کەرکووک", language: "KU" },
  { name: "Najaf", native: "النجف", language: "AR" },
  { name: "Karbala", native: "كربلاء", language: "AR" },
  { name: "Wasit", native: "واسط", language: "AR" },
  { name: "Diyala", native: "ديالى", language: "AR" },
  { name: "Maysan", native: "ميسان", language: "AR" },
  { name: "Muthanna", native: "المثنى", language: "AR" },
  { name: "Qadisiyah", native: "القادسية", language: "AR" },
  { name: "Saladin", native: "صلاح الدين", language: "AR" },
  { name: "Anbar", native: "الأنبار", language: "AR" },
  { name: "Babil", native: "بابل", language: "AR" },
  { name: "Nineveh", native: "نينوى", language: "AR" },
  { name: "Dhi Qar", native: "ذي قار", language: "AR" },
  { name: "Halabja", native: "حلبجة / هەڵەبجە", language: "KU" },
];

export default function App() {
  // Campaign state
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [activeCampaignData, setActiveCampaignData] = useState<any | null>(null);

  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [selectedGovernorates, setSelectedGovernorates] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Configuration settings states
  const [showConfig, setShowConfig] = useState(false);
  const [nabdaUrl, setNabdaUrl] = useState("https://api.nabdaotp.com/api/v1/messages/send");
  const [nabdaApiKey, setNabdaApiKey] = useState("sk_5487e268757e4c51af85df5f34978852");
  const [deliveryDelay, setDeliveryDelay] = useState<number>(1000);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Drag-and-drop state
  const [dragActive, setDragActive] = useState(false);

  // System Health state
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);

  // File drag ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch campaigns and configurations on mount
  useEffect(() => {
    fetchCampaigns();
    fetchServerConfig();
    checkHealth();

    // Set interval for general dashboard refresh
    const generalInterval = setInterval(() => {
      fetchCampaigns();
      checkHealth();
    }, 10000);

    return () => clearInterval(generalInterval);
  }, []);

  // Set interval to poll current active campaign details faster
  useEffect(() => {
    if (!selectedCampaignId) {
      setActiveCampaignData(null);
      return;
    }

    // Immediate fetch
    fetchCampaignDetails(selectedCampaignId);

    // High frequency interval (every 1.5 seconds) for real-time delivery logs
    const detailsInterval = setInterval(() => {
      fetchCampaignDetails(selectedCampaignId);
    }, 1500);

    return () => clearInterval(detailsInterval);
  }, [selectedCampaignId]);

  const checkHealth = async () => {
    try {
      await axios.get(`${API_BASE}/api/health`);
      setIsBackendHealthy(true);
    } catch {
      setIsBackendHealthy(false);
    }
  };

  const fetchServerConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/config`);
      if (res.data) {
        setNabdaUrl(res.data.nabdaUrl);
        // Note: active key is masked on response for security, but allow custom override
        setDeliveryDelay(res.data.delayMs);
      }
    } catch (err) {
      console.error("Failed to load server configuration file config", err);
    }
  };

  const updateServerConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/config`, {
        url: nabdaUrl,
        apiKey: nabdaApiKey,
        delay: Number(deliveryDelay),
      });
      if (res.data.success) {
        setConfigSuccess(true);
        setTimeout(() => setConfigSuccess(false), 3000);
        fetchServerConfig();
      }
    } catch (err: any) {
      alert("Failed to update Nabda configuration settings: " + err.message);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/campaigns`);
      setCampaigns(res.data || []);
    } catch (err) {
      console.error("Failed loading campaigns list", err);
    }
  };

  const fetchCampaignDetails = async (id: string) => {
    try {
      const res = await axios.get(`${API_BASE}/api/campaign/${id}`);
      setActiveCampaignData(res.data);
    } catch (err) {
      console.error(`Failed loading details for campaign ${id}`, err);
    }
  };

  // Toggle governorates selection
  const handleGovernorateToggle = (name: string) => {
    const lowerName = name.toLowerCase();
    if (selectedGovernorates.includes(lowerName)) {
      setSelectedGovernorates(selectedGovernorates.filter((g) => g !== lowerName));
    } else {
      setSelectedGovernorates([...selectedGovernorates, lowerName]);
    }
  };

  const selectAllGovernorates = () => {
    setSelectedGovernorates(GOV_LIST.map((g) => g.name.toLowerCase()));
  };

  const clearGovernorates = () => {
    setSelectedGovernorates([]);
  };

  // Handle Drag-and-Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
        if (!campaignName) {
          // Suggest clean name based on file name minus extension
          const cleanName = droppedFile.name.replace(/\.csv$/i, "").replace(/[_-]/g, " ");
          setCampaignName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
      } else {
        setUploadError("Please provide an official .csv spreadsheet containing recipient rows");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
        if (!campaignName) {
          const cleanName = selectedFile.name.replace(/\.csv$/i, "").replace(/[_-]/g, " ");
          setCampaignName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
      } else {
        setUploadError("File must carry a valid '.csv' format suffix");
      }
    }
  };

  // Post CSV campaign upload
  const handleUploadCampaign = async () => {
    if (!file) {
      setUploadError("Please upload a CSV file structure containing numbers first");
      return;
    }
    if (!campaignName.trim()) {
      setUploadError("Please specify a meaningful name for your bulk campaign");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("campaignName", campaignName.trim());
    formData.append("governorates", selectedGovernorates.join(","));

    try {
      const response = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { campaignId } = response.data;
      
      // Reset upload fields
      setFile(null);
      setCampaignName("");
      setSelectedGovernorates([]);
      
      // Fetch list and auto-select newly launched campaign
      await fetchCampaigns();
      setSelectedCampaignId(campaignId);
    } catch (err: any) {
      setUploadError(
        err.response?.data?.error || 
        "Failed parsing CSV header columns. Make sure columns possess 'phone', 'governorate', and 'name' fields."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Operations for active campaigns
  const resumeCampaign = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await axios.post(`${API_BASE}/api/campaign/${id}/resume`);
      // Update details right away if currently active
      if (id === selectedCampaignId) {
        fetchCampaignDetails(id);
      }
      fetchCampaigns();
    } catch (err: any) {
      alert("Error resuming delivery sequence: " + err.message);
    }
  };

  const pauseCampaign = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await axios.post(`${API_BASE}/api/campaign/${id}/pause`);
      if (id === selectedCampaignId) {
        fetchCampaignDetails(id);
      }
      fetchCampaigns();
    } catch (err: any) {
      alert("Error pausing delivery sequence: " + err.message);
    }
  };

  const deleteCampaign = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you absolutely sure you want to permanently delete this campaign and all of its logs?")) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/api/campaign/${id}`);
      if (id === selectedCampaignId) {
        setSelectedCampaignId(null);
        setActiveCampaignData(null);
      }
      fetchCampaigns();
    } catch (err: any) {
      alert("Network failure removing campaign database logs: " + err.message);
    }
  };

  const calculateRatio = (part: number, total: number) => {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      
      {/* Top Professional Header Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-600 text-white rounded-xl shadow-sm">
              <Globe className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-950 font-sans">
                  NABDA Bulk Deliverer
                </h1>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded border border-slate-200">
                  v2.1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Iraq Compass Multi-Governorate Delivery Router</p>
            </div>
          </div>

          {/* Real-time sync signals & dynamic health metadata */}
          <div className="flex items-center gap-4 flex-wrap">
            
            {/* Health signal badge */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${isBackendHealthy ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500"} inline-block`}></span>
              <span className="font-mono text-slate-700">
                {isBackendHealthy ? "Engine Active" : "Disconnected"}
              </span>
            </div>

            {/* Quick configuration toggle buttons */}
            <button
              id="settings-btn"
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-all ${
                showConfig
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Settings className={`w-4 h-4 ${showConfig ? "rotate-90" : ""} transition-transform duration-300`} />
              Configure API Gateway
            </button>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* API Settings Override Drawer Block */}
        {showConfig && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-6 animate-fade-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">NABDA Integration Preferences</h3>
                  <p className="text-xs text-slate-500">Fine-tune transmission parameters, endpoint routes, and pacing restrictions</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 bg-slate-100 rounded"
              >
                Hide panel
              </button>
            </div>

            <form onSubmit={updateServerConfig} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  NABDA HTTP Gate Call Endpoint
                </label>
                <input
                  id="config-endpoint"
                  type="url"
                  required
                  value={nabdaUrl}
                  onChange={(e) => setNabdaUrl(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Gateway API Key Credentials secret
                </label>
                <input
                  id="config-apikey"
                  type="password"
                  placeholder="Leave blank or fill to override key (sk_...)"
                  value={nabdaApiKey}
                  onChange={(e) => setNabdaApiKey(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Anti-Flood Rate Limit Interval (ms)
                </label>
                <div className="flex gap-3">
                  <input
                    id="config-delay"
                    type="number"
                    min="100"
                    max="10000"
                    required
                    value={deliveryDelay}
                    onChange={(e) => setDeliveryDelay(Number(e.target.value))}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    id="save-config-btn"
                    type="submit"
                    className="bg-sky-600 text-white hover:bg-sky-700 text-sm font-semibold px-4 py-2 rounded-lg relative overflow-hidden transition-colors"
                  >
                    Save Options
                  </button>
                </div>
              </div>
            </form>

            {configSuccess && (
              <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-3 py-2 text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Credentials updated! New campaigns and worker delivery loops will apply these limits immediately.</span>
              </div>
            )}
          </div>
        )}

        {/* Primary Interactive Split Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Setup panel (takes 5 spans) */}
          <section className="lg:col-span-5 space-y-6">
            
            {/* New Campaign Creation Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 p-5">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-sky-600" />
                  Define Campaign Parameters
                </h2>
                <p className="text-xs text-slate-500 mt-1">Configure spreadsheet and filter target audience</p>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Form Input: Name */}
                <div className="space-y-1.5 animate-form-fade-in">
                  <label htmlFor="campaign-name-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    New Campaign Name
                  </label>
                  <input
                    id="campaign-name-input"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g. Compass Iraq Spring Launch"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-4 py-3 placeholder-slate-400 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white focus:border-sky-500 transition-all font-medium"
                  />
                </div>

                {/* Governorate Multi-Badges Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      Filter Iraqi Governorates
                    </label>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllGovernorates}
                        className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        All Regions
                      </button>
                      <button
                        type="button"
                        onClick={clearGovernorates}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        Reset/Filter Off
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    If no governorates are selected, our gateway fallback parses all recipients. Language is auto-determined!
                  </p>

                  {/* Badges Container Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50">
                    {GOV_LIST.map((gov) => {
                      const lowerGov = gov.name.toLowerCase();
                      const isSelected = selectedGovernorates.includes(lowerGov);
                      return (
                        <button
                          key={gov.name}
                          type="button"
                          onClick={() => handleGovernorateToggle(gov.name)}
                          className={`flex flex-col items-start gap-0.5 p-2 rounded-lg border text-left cursor-pointer transition-all ${
                            isSelected
                              ? "bg-sky-600 border-sky-600 text-white shadow-xs"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold truncate leading-tight">{gov.name}</span>
                            {isSelected ? (
                              <Check className="w-3 h-3 flex-shrink-0" />
                            ) : (
                              <span className={`w-1.5 h-1.5 rounded-full ${gov.language === "KU" ? "bg-amber-500" : "bg-sky-500"} flex-shrink-0`}></span>
                            )}
                          </div>
                          <div className="flex items-center justify-between w-full mt-1">
                            <span className={`text-[10px] truncate ${isSelected ? "text-sky-100" : "text-slate-400"}`}>
                              {gov.native}
                            </span>
                            <span className={`text-[8px] font-mono px-1 rounded ${
                              isSelected 
                                ? "bg-sky-700 text-sky-100" 
                                : gov.language === "KU" 
                                ? "bg-amber-50 text-amber-700 border border-amber-200" 
                                : "bg-sky-50 text-sky-700 border border-sky-200"
                            }`}>
                              {gov.language}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Drag and Drop File Uploader Panel */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Recipient Campaign CSV Source
                  </label>
                  
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      dragActive
                        ? "border-sky-500 bg-sky-50/50"
                        : file
                        ? "border-emerald-400 bg-emerald-50/20"
                        : "border-slate-300 hover:border-slate-400 bg-slate-50/70"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className={`p-3 rounded-full ${file ? "bg-emerald-100 text-emerald-600" : "bg-sky-100 text-sky-600"}`}>
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      
                      {file ? (
                        <div>
                          <p className="text-xs font-bold text-emerald-900 truncate max-w-[260px]">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-emerald-600 font-mono mt-0.5">
                            {(file.size / 1024).toFixed(1)} KB — Click or Drop to switch spreadsheet
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Drag & Drop target .csv file here
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Or click to navigate system directory files
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {uploadError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-xs animate-shake">
                    <AlertOctagon className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>{uploadError}</div>
                  </div>
                )}

                {/* Submit button */}
                <button
                  id="start-campaign-btn"
                  type="button"
                  disabled={isUploading || !file || !campaignName.trim()}
                  onClick={handleUploadCampaign}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2 ${
                    isUploading || !file || !campaignName.trim()
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-sky-600 hover:bg-sky-700 text-white hover:shadow"
                  }`}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Parsing & Initializing delivery list...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Deploy Bulk Campaign Queue
                    </>
                  )}
                </button>

                {/* Help Box showing columns requirements */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
                    Required Spreadsheet Columns Schema
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    The imported CSV file should contain columns labeled as <code className="font-mono bg-white px-1 py-0.5 border border-slate-200 rounded text-slate-700">phone</code>, <code className="font-mono bg-white px-1 py-0.5 border border-slate-200 rounded text-slate-700">governorate</code>, and optionally <code className="font-mono bg-white px-1 py-0.5 border border-slate-200 rounded text-slate-700">name</code>.
                  </p>
                  <div className="bg-slate-100 border border-slate-200 p-2 rounded text-[9px] font-mono text-slate-600 space-y-0.5 select-all leading-tight">
                    <div>phone,governorate,name</div>
                    <div>+9647701234567,Baghdad,Ali Trading Corporation</div>
                    <div>07509876543,Erbil,Zana Business Group</div>
                  </div>
                </div>

              </div>
            </div>

          </section>

          {/* RIGHT COLUMN: Active monitor & list tracker (takes 7 spans) */}
          <section className="lg:col-span-7 space-y-6">
            
            {/* Live Campaign Delivery Progress Monitor card */}
            {selectedCampaignId ? (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                
                {/* Visual Header */}
                <div className="border-b border-indigo-50 bg-indigo-50/40 px-6 py-5 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                        Active Stream Tracking
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono select-all">
                        ID: {selectedCampaignId}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
                      {activeCampaignData ? activeCampaignData.name : "Contacting worker..."}
                    </h2>
                  </div>

                  {/* Actions for currently monitored campaign */}
                  {activeCampaignData && (
                    <div className="flex items-center gap-2">
                      {activeCampaignData.status === "running" ? (
                        <button
                          onClick={(e) => pauseCampaign(activeCampaignData.id, e)}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 shadow-xs cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          Pause Queue
                        </button>
                      ) : (
                        <button
                          onClick={(e) => resumeCampaign(activeCampaignData.id, e)}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-xs cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Resume/Retry failures
                        </button>
                      )}

                      <button
                        onClick={(e) => deleteCampaign(activeCampaignData.id, e)}
                        className="p-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer transition-colors"
                        title="Delete campaign"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress Indicators & Bento numbers grid */}
                {activeCampaignData ? (
                  <div className="p-6 space-y-6">
                    
                    {/* Progress Bar with elegant metrics */}
                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-xs font-bold text-slate-700">
                          Overall Delivery Progress
                        </span>
                        <span className="text-sm font-black text-sky-600 font-mono">
                          {calculateRatio(
                            (activeCampaignData.sent || 0) + (activeCampaignData.failed || 0),
                            activeCampaignData.total
                          )}%
                        </span>
                      </div>

                      {/* Bar tracks progress visualizer */}
                      <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-700 shadow-inner"
                          style={{
                            width: `${calculateRatio(
                              (activeCampaignData.sent || 0) + (activeCampaignData.failed || 0),
                              activeCampaignData.total
                            )}%`,
                          }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1.5">
                        <span>
                          Total Loaded: <strong>{activeCampaignData.total}</strong> rows
                        </span>
                        <span>
                          Sent + Fail: <strong>{(activeCampaignData.sent || 0) + (activeCampaignData.failed || 0)}</strong> / {activeCampaignData.total}
                        </span>
                      </div>
                    </div>

                    {/* Quick status meters grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                          Sent successfully
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-lg font-bold text-emerald-600 font-mono">{activeCampaignData.sent || 0}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({calculateRatio(activeCampaignData.sent || 0, activeCampaignData.total)}%)
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                          Hard Failed
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-lg font-bold text-rose-600 font-mono">{activeCampaignData.failed || 0}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({calculateRatio(activeCampaignData.failed || 0, activeCampaignData.total)}%)
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                          Wait State (Pending)
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-lg font-bold text-indigo-600 font-mono">{activeCampaignData.pending || 0}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({calculateRatio(activeCampaignData.pending || 0, activeCampaignData.total)}%)
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                          Runner Status
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mt-2 ${
                          activeCampaignData.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : activeCampaignData.status === "running"
                            ? "bg-sky-50 text-sky-700 border border-sky-200 animate-pulse"
                            : activeCampaignData.status === "paused"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-50 text-slate-500 border border-slate-200"
                        }`}>
                          {activeCampaignData.status}
                        </span>
                      </div>

                    </div>

                    {/* Delivery Log Feed Area */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-sky-600" />
                          Live Recipient Log Stream
                        </h3>
                        <span className="text-[10px] text-slate-400 font-medium">Last 15 rows updated real-time</span>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 max-h-[280px] overflow-y-auto">
                        {activeCampaignData.feed && activeCampaignData.feed.length > 0 ? (
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                                <th className="py-2.5 px-3">Recipient name / Phone</th>
                                <th className="py-2.5 px-3">Governorate</th>
                                <th className="py-2.5 px-3">Attempts</th>
                                <th className="py-2.5 px-3 text-right">Delivery Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeCampaignData.feed.map((msg: any, index: number) => (
                                <tr
                                  key={index}
                                  className="border-b border-slate-150 hover:bg-slate-100/30 transition-colors bg-white"
                                >
                                  <td className="py-2.5 px-3">
                                    <div className="font-bold text-slate-800">{msg.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono select-all mt-0.5">{msg.phone}</div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-semibold text-slate-700 capitalize">{msg.governorate || "—"}</div>
                                    <span className="text-[8px] uppercase px-1 bg-slate-100 text-slate-400 rounded">
                                      {GOV_LIST.find(g => g.name.toLowerCase() === msg.governorate.toLowerCase())?.language || "AR"} Language
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-slate-600">{msg.attempts || 0}</td>
                                  <td className="py-2.5 px-3 text-right">
                                    {msg.status === "sent" ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Sent safely
                                      </span>
                                    ) : msg.status === "failed" ? (
                                      <div className="inline-flex flex-col items-end">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                          <XCircle className="w-3 h-3 text-rose-600" /> Failed
                                        </span>
                                        {msg.error && (
                                          <span className="text-[9px] font-mono text-rose-500 mt-1 max-w-[150px] truncate block" title={msg.error}>
                                            {msg.error}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                                        <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" /> Pending
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            No logs currently processed for this campaign module
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
                    Checking queue processing records...
                  </div>
                )}
                
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 h-full flex flex-col items-center justify-center gap-3">
                <Globe className="w-10 h-10 text-slate-300 stroke-1" />
                <div>
                  <h3 className="font-bold text-slate-700">No active tracking target chosen</h3>
                  <p className="text-xs text-slate-400 mt-1">Select a previous campaign below or build a new one to monitor delivery progress</p>
                </div>
              </div>
            )}

            {/* Campaign History & Status Grid (Previous Campaigns Library) */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
                    <Users className="w-5 h-5 text-sky-600" />
                    Previous Campaigns Library
                  </h2>
                  <p className="text-xs text-slate-500">Monitor overall history and resume paused queues</p>
                </div>
                <button
                  type="button"
                  onClick={fetchCampaigns}
                  className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                  title="Reload campaigns list"
                >
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="p-4">
                {campaigns.length > 0 ? (
                  <div className="space-y-3">
                    {campaigns.map((c) => {
                      const totalSentOrFailed = (c.sent || 0) + (c.failed || 0);
                      const isSelected = selectedCampaignId === c.id;

                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCampaignId(c.id)}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                              : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {/* Left data elements */}
                          <div className="space-y-1 max-w-[280px]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm tracking-tight truncate">
                                {c.name || "Default Campaign"}
                              </span>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                isSelected 
                                  ? "bg-sky-800 text-sky-100" 
                                  : c.status === "completed"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : c.status === "running"
                                  ? "bg-sky-50 text-sky-800 border border-sky-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}>
                                {c.status}
                              </span>
                            </div>

                            <p className={`text-[11px] font-mono leading-tight ${isSelected ? "text-slate-400" : "text-slate-400"}`}>
                              Uploaded on {new Date(c.created_at).toLocaleDateString()} @ {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          {/* Right progress ratios */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-xs font-bold font-mono">
                                {totalSentOrFailed} / {c.total}
                              </div>
                              <span className={`text-[10px] ${isSelected ? "text-slate-400" : "text-slate-400"}`}>
                                Sent {calculateRatio(c.sent || 0, c.total)}%
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {c.status === "running" ? (
                                <button
                                  onClick={(e) => pauseCampaign(c.id, e)}
                                  className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer flex items-center justify-center shadow-xs"
                                  title="Pause transmission"
                                >
                                  <Pause className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => resumeCampaign(c.id, e)}
                                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer flex items-center justify-center shadow-xs"
                                  title="Resume pending queue / retry failures"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={(e) => deleteCampaign(c.id, e)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer flex items-center justify-center"
                                title="Delete campaign permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No Campaigns have been initialized in this local session yet.
                  </div>
                )}
              </div>
            </div>

          </section>

        </div>

      </main>

      {/* Modern Compact Site Footer Accent */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} IQ Compass Delivery Router. Powered securely via standard NABDA API Core connection.
          </p>
          <div className="flex items-center gap-5 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Languages className="w-3.5 h-3.5" /> Dual AR &amp; KU Output
            </span>
            <span>&bull;</span>
            <span>Local SQLite Node Engine</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
