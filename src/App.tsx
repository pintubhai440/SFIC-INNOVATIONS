/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MICRO_WATERSHEDS_DATA } from './data/watershedData';
import { MicroWatershed, RechargeAsset, ActionTask } from './types/watershed';
import { HeaderNavbar } from './components/HeaderNavbar';
import { InteractiveMapDashboard } from './components/InteractiveMapDashboard';
import { WatershedProfileModal } from './components/WatershedProfileModal';
import { AccountabilityLedgerView } from './components/AccountabilityLedgerView';
import { RechargeAssetRegistry } from './components/RechargeAssetRegistry';
import { InterventionSimulator } from './components/InterventionSimulator';
import { ActionCenter } from './components/ActionCenter';
import { SeasonalImpactAudit } from './components/SeasonalImpactAudit';
import { StakeholderEngagementDashboard } from './components/StakeholderEngagementDashboard';
import { EndangeredComplaintsFeed } from './components/EndangeredComplaintsFeed';
import { ReportEndangeredModal } from './components/ReportEndangeredModal';
import { DataIntegritySourcePanel } from './components/DataIntegritySourcePanel';
import { INITIAL_ENDANGERED_COMPLAINTS } from './data/complaintsData';
import { EndangeredZoneComplaint } from './types/watershed';
import { 
  Droplets, 
  ExternalLink, 
  ShieldCheck, 
  Award, 
  Compass, 
  Info,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [watersheds, setWatersheds] = useState<MicroWatershed[]>(MICRO_WATERSHEDS_DATA);
  const [selectedWatershedId, setSelectedWatershedId] = useState<string>('ws-kolar-palavanhalli');
  const [activeTab, setActiveTab] = useState<'map' | 'ledger' | 'assets' | 'simulator' | 'tasks' | 'audit' | 'stakeholders' | 'complaints' | 'sources'>('map');
  const [userRole, setUserRole] = useState<string>('Watershed Officer (District Level)');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isReportEndangeredModalOpen, setIsReportEndangeredModalOpen] = useState<boolean>(false);
  const [complaints, setComplaints] = useState<EndangeredZoneComplaint[]>(INITIAL_ENDANGERED_COMPLAINTS);

  const selectedWatershed = watersheds.find((w) => w.id === selectedWatershedId) || watersheds[0];

  const handleComplaintSubmitted = (newComplaint: EndangeredZoneComplaint) => {
    setComplaints([newComplaint, ...complaints]);
    setActiveTab('complaints');
  };

  const activeAlertsTotal = watersheds.filter(
    (w) => w.currentStatus === 'critical' || w.currentStatus === 'stressed'
  ).length;

  // Handle asset status update from field verification
  const handleAssetStatusUpdated = (assetId: string, newStatus: RechargeAsset['status']) => {
    setWatersheds((prev) =>
      prev.map((ws) => {
        if (ws.id !== selectedWatershedId) return ws;
        const updatedAssets = ws.assets.map((a) => (a.id === assetId ? { ...a, status: newStatus } : a));
        const functionalCount = updatedAssets.filter((a) => a.status === 'Functional').length;
        const needsRepair = updatedAssets.filter((a) => a.status !== 'Functional').length;
        return {
          ...ws,
          assets: updatedAssets,
          functionalAssetsCount: functionalCount,
          needsRepairCount: needsRepair,
        };
      })
    );
  };

  // Convert simulator scenario to action task
  const handleApplyScenarioAsTask = (
    watershedId: string,
    title: string,
    category: ActionTask['category']
  ) => {
    const newTask: ActionTask = {
      id: `TASK-SIM-${Date.now().toString().slice(-4)}`,
      watershedId,
      title,
      category,
      priority: 'HIGH',
      responsibleAgency: 'Minor Irrigation & Gram Panchayat Joint Cell',
      assignedOfficer: userRole,
      deadline: '2026-11-20',
      status: 'IN_PROGRESS',
      evidenceSummary: 'Adopted from What-If hydrological simulation model for immediate implementation.',
    };

    setWatersheds((prev) =>
      prev.map((ws) => {
        if (ws.id === watershedId) {
          return {
            ...ws,
            tasks: [newTask, ...ws.tasks],
          };
        }
        return ws;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fbfe] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-slate-800">
      {/* Top National Portal Navigation Header */}
      <HeaderNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedRole={userRole}
        setSelectedRole={setUserRole}
        activeAlertsCount={activeAlertsTotal}
        endangeredComplaintsCount={complaints.length}
        onOpenReportEndangered={() => setIsReportEndangeredModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'map' && (
          <InteractiveMapDashboard
            watersheds={watersheds}
            selectedWatershedId={selectedWatershedId}
            onSelectWatershed={(id) => setSelectedWatershedId(id)}
            onOpenDetailModal={() => setIsDetailModalOpen(true)}
            onOpenLedger={() => setActiveTab('ledger')}
            onOpenSimulator={() => setActiveTab('simulator')}
          />
        )}

        {activeTab === 'ledger' && (
          <AccountabilityLedgerView
            watersheds={watersheds}
            selectedWatershedId={selectedWatershedId}
            onSelectWatershed={(id) => setSelectedWatershedId(id)}
          />
        )}

        {activeTab === 'assets' && (
          <RechargeAssetRegistry
            watersheds={watersheds}
            selectedWatershedId={selectedWatershedId}
            onSelectWatershed={(id) => setSelectedWatershedId(id)}
            userRole={userRole}
            onAssetStatusUpdated={handleAssetStatusUpdated}
          />
        )}

        {activeTab === 'simulator' && (
          <InterventionSimulator
            watersheds={watersheds}
            selectedWatershedId={selectedWatershedId}
            onSelectWatershed={(id) => setSelectedWatershedId(id)}
            onApplyScenarioAsTask={handleApplyScenarioAsTask}
          />
        )}

        {activeTab === 'tasks' && (
          <ActionCenter
            watersheds={watersheds}
            selectedWatershedId={selectedWatershedId}
            onSelectWatershed={(id) => setSelectedWatershedId(id)}
            userRole={userRole}
          />
        )}

        {activeTab === 'audit' && (
          <SeasonalImpactAudit
            watersheds={watersheds}
            selectedWatershedId={selectedWatershedId}
            onSelectWatershed={(id) => setSelectedWatershedId(id)}
          />
        )}

        {activeTab === 'stakeholders' && (
          <StakeholderEngagementDashboard
            watersheds={watersheds}
            selectedWatershedId={selectedWatershedId}
            onSelectWatershed={(id) => setSelectedWatershedId(id)}
            userRole={userRole}
          />
        )}

        {activeTab === 'complaints' && (
          <EndangeredComplaintsFeed
            complaints={complaints}
            watersheds={watersheds}
            onOpenReportModal={() => setIsReportEndangeredModalOpen(true)}
            onSelectWatershed={(id) => {
              setSelectedWatershedId(id);
              setActiveTab('map');
            }}
          />
        )}

        {activeTab === 'sources' && <DataIntegritySourcePanel />}
      </main>

      {/* Report Endangered Zone / Complain Modal */}
      <ReportEndangeredModal
        isOpen={isReportEndangeredModalOpen}
        onClose={() => setIsReportEndangeredModalOpen(false)}
        watersheds={watersheds}
        defaultWatershedId={selectedWatershedId}
        onComplaintSubmitted={handleComplaintSubmitted}
      />

      {/* Deep-Dive Water Profile Modal */}
      {isDetailModalOpen && (
        <WatershedProfileModal
          watershed={selectedWatershed}
          onClose={() => setIsDetailModalOpen(false)}
          onOpenSimulator={() => {
            setIsDetailModalOpen(false);
            setActiveTab('simulator');
          }}
          onOpenLedger={() => {
            setIsDetailModalOpen(false);
            setActiveTab('ledger');
          }}
          onOpenAssets={() => {
            setIsDetailModalOpen(false);
            setActiveTab('assets');
          }}
          onOpenStakeholders={() => {
            setIsDetailModalOpen(false);
            setActiveTab('stakeholders');
          }}
        />
      )}

      {/* Institutional Footer */}
      <footer className="w-full bg-[#1b2a4a] text-slate-300 text-xs py-8 border-t border-blue-900 mt-12">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-blue-900/60 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">
                  JalDrishti — National Micro-Watershed Accountability Grid
                </h4>
                <p className="text-blue-300 text-xs">
                  Seva First Innovation Challenge (SFIC 2026) • Track A & Track B Solution
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-blue-900 text-sky-200 px-3 py-1 rounded-md border border-blue-700 text-xs font-mono">
                Theme 2: Samriddh Annadata, Samriddh Bharat
              </span>
              <span className="bg-emerald-950 text-emerald-300 px-3 py-1 rounded-md border border-emerald-800 text-xs font-mono">
                South Zone Nodal: IISc Bengaluru
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-white font-semibold mb-2">Statutory Groundwater Data</div>
              <ul className="space-y-1 text-slate-400">
                <li><a href="https://cgwb.gov.in" target="_blank" rel="noreferrer" className="hover:text-sky-300 flex items-center gap-1">Central Ground Water Board (CGWB) <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://indiawris.gov.in" target="_blank" rel="noreferrer" className="hover:text-sky-300 flex items-center gap-1">India-WRIS Water Portal <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://nwdp.nwic.gov.in" target="_blank" rel="noreferrer" className="hover:text-sky-300 flex items-center gap-1">NWIC Telemetric DWLR <ExternalLink className="w-3 h-3" /></a></li>
              </ul>
            </div>

            <div>
              <div className="text-white font-semibold mb-2">Space & Earth Observation</div>
              <ul className="space-y-1 text-slate-400">
                <li><a href="https://bhuvan.nrsc.gov.in" target="_blank" rel="noreferrer" className="hover:text-sky-300 flex items-center gap-1">ISRO Bhuvan Geospatial <ExternalLink className="w-3 h-3" /></a></li>
                <li>Sentinel-2 High-Resolution MSI</li>
                <li>Cartosat-3 High Res Demarcation</li>
              </ul>
            </div>

            <div>
              <div className="text-white font-semibold mb-2">Governance & Delivery (Track B)</div>
              <ul className="space-y-1 text-slate-400">
                <li>Gram Panchayat Jal Suraksha Samiti</li>
                <li>MGNREGS Asset Geo-tagging</li>
                <li>Jal Jeevan Mission Source Sustainability</li>
              </ul>
            </div>

            <div>
              <div className="text-white font-semibold mb-2">Zero Fabricated Data Guarantee</div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Groundwater telemetry is verified against official DWLR piezometers. Missing records are marked DATA UNAVAILABLE; simulated models are marked MODELLED ESTIMATE.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-blue-900/40 text-center text-slate-400 text-[11px] font-mono">
            Designed for National Level Hackathon • Seva First Innovation Challenge (SFIC) under Seva Sankalp Abhiyan @ Viksit Bharat 2047
          </div>
        </div>
      </footer>
    </div>
  );
}
