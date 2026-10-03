/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  UserRoleType, 
  WaterBody, 
  CitizenComplaint, 
  OfficerContact, 
  InspectorReport,
  EngineerWorkExecution
} from './types/nirikshan';
import { 
  INITIAL_WATER_BODIES, 
  INITIAL_OFFICER_CONTACTS, 
  INITIAL_CITIZEN_COMPLAINTS 
} from './data/nirikshanData';
import { NirikshanVerticalSidebar } from './components/NirikshanVerticalSidebar';
import { NirikshanTopBar } from './components/NirikshanTopBar';
import { CitizenDashboard } from './components/CitizenDashboard';
import { NodalOfficerDashboard } from './components/NodalOfficerDashboard';
import { InspectorDashboard } from './components/InspectorDashboard';
import { EngineerDashboard } from './components/EngineerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { LodgeComplaintModal } from './components/LodgeComplaintModal';
import { OfficerDirectoryModal } from './components/OfficerDirectoryModal';
import { AuthModal } from './components/AuthModal';
import { Droplets, Phone } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRoleType>('user');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load persisted state or initial seed data
  const [waterBodies, setWaterBodies] = useState<WaterBody[]>(() => {
    const saved = localStorage.getItem('nir_water_bodies');
    return saved ? JSON.parse(saved) : INITIAL_WATER_BODIES;
  });

  const [complaints, setComplaints] = useState<CitizenComplaint[]>(() => {
    const saved = localStorage.getItem('nir_complaints');
    return saved ? JSON.parse(saved) : INITIAL_CITIZEN_COMPLAINTS;
  });

  const [officers] = useState<OfficerContact[]>(INITIAL_OFFICER_CONTACTS);

  // Auth states for the protected roles
  const [authenticatedRoles, setAuthenticatedRoles] = useState<Record<UserRoleType, boolean>>({
    user: true,
    admin: false,
    nodal_vizianagaram: false,
    nodal_parvathipuram: false,
    inspector: false,
    engineer: false,
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAuthRole, setPendingAuthRole] = useState<UserRoleType>('admin');
  const [isLodgeModalOpen, setIsLodgeModalOpen] = useState(false);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('nir_water_bodies', JSON.stringify(waterBodies));
  }, [waterBodies]);

  useEffect(() => {
    localStorage.setItem('nir_complaints', JSON.stringify(complaints));
  }, [complaints]);

  // Role selection logic with auth gate
  const handleSelectRole = (role: UserRoleType) => {
    if (role === 'user') {
      setCurrentRole('user');
      setIsSidebarOpen(false);
      return;
    }

    if (authenticatedRoles[role]) {
      setCurrentRole(role);
      setIsSidebarOpen(false);
    } else {
      setPendingAuthRole(role);
      setIsAuthModalOpen(true);
      setIsSidebarOpen(false);
    }
  };

  const handleLoginSuccess = (role: UserRoleType) => {
    setAuthenticatedRoles((prev) => ({ ...prev, [role]: true }));
    setCurrentRole(role);
  };

  const handleLogoutRole = (role: UserRoleType) => {
    setAuthenticatedRoles((prev) => ({ ...prev, [role]: false }));
    setCurrentRole('user');
  };

  // --- Complaint & Workflow Handlers ---

  // 1. Citizen submits complaint
  const handleComplaintSubmitted = (newComplaint: CitizenComplaint) => {
    setComplaints([newComplaint, ...complaints]);
  };

  // 2. Nodal Officer assigns Inspector
  const handleAssignInspector = (
    complaintId: string,
    inspectorName: string,
    inspectorPhone: string
  ) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId
          ? {
              ...c,
              status: 'INSPECTOR_ASSIGNED',
              assignedInspector: inspectorName,
              assignedInspectorPhone: inspectorPhone,
            }
          : c
      )
    );
  };

  // 3. Inspector conducts inspection & logs TDS/Waste source
  const handleSubmitInspectionReport = (complaintId: string, report: InspectorReport) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId
          ? {
              ...c,
              status: 'INSPECTION_COMPLETED',
              inspectionReport: report,
            }
          : c
      )
    );
  };

  // 4. Nodal Officer deploys Action Engineer
  const handleAssignEngineer = (
    complaintId: string,
    engineerName: string,
    engineerPhone: string,
    deadline: string
  ) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        const workExec: EngineerWorkExecution = {
          id: `WRK-2026-${Math.floor(100 + Math.random() * 900)}`,
          engineerName,
          engineerPhone,
          assignedAt: new Date().toISOString().slice(0, 10),
          deadline,
          status: 'PENDING_ACCEPTANCE',
          beforePhotoUrl: c.photoUrl,
        };
        return {
          ...c,
          status: 'WORKER_IN_PROGRESS',
          assignedEngineer: engineerName,
          assignedEngineerPhone: engineerPhone,
          workExecution: workExec,
        };
      })
    );
  };

  // 5. Engineer accepts task with Before Photo
  const handleAcceptTask = (complaintId: string, beforePhotoUrl: string) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId || !c.workExecution) return c;
        return {
          ...c,
          status: 'WORKER_IN_PROGRESS',
          workExecution: {
            ...c.workExecution,
            status: 'ACCEPTED',
            beforePhotoUrl,
            startedAt: new Date().toISOString().slice(0, 10),
          },
        };
      })
    );
  };

  // 6. Engineer blocks task with reason
  const handleBlockTask = (complaintId: string, reason: string) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId || !c.workExecution) return c;
        return {
          ...c,
          workExecution: {
            ...c.workExecution,
            status: 'BLOCKED',
            blockReason: reason,
          },
        };
      })
    );
  };

  // 7. Engineer completes work with After Photo
  const handleCompleteTask = (complaintId: string, afterPhotoUrl: string, workSummary: string) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId || !c.workExecution) return c;
        return {
          ...c,
          status: 'VERIFICATION_PENDING',
          workExecution: {
            ...c.workExecution,
            status: 'COMPLETED',
            afterPhotoUrl,
            workSummary,
            completedAt: new Date().toISOString().slice(0, 10),
          },
        };
      })
    );
  };

  // 8. Inspector performs post-work site verification
  const handleSubmitPostWorkVerification = (
    complaintId: string,
    isSatisfactory: boolean,
    photoUrl: string,
    remarks: string
  ) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;

        const updatedReport: InspectorReport | undefined = c.inspectionReport
          ? {
              ...c.inspectionReport,
              postWorkVerification: {
                verifiedAt: new Date().toISOString().slice(0, 10),
                isSatisfactory,
                verificationPhotoUrl: photoUrl,
                remarks,
              },
            }
          : undefined;

        return {
          ...c,
          status: isSatisfactory ? 'RESOLVED' : 'WORKER_IN_PROGRESS',
          inspectionReport: updatedReport,
        };
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] w-full">
      {/* 1. Slide-out Vertical Drawer for 5 Roles (Doesn't shrink screen) */}
      <NirikshanVerticalSidebar
        currentRole={currentRole}
        onSelectRole={handleSelectRole}
        authenticatedRoles={authenticatedRoles}
        onLogoutRole={handleLogoutRole}
        onOpenLodgeModal={() => setIsLodgeModalOpen(true)}
        onOpenDirectoryModal={() => setIsDirectoryModalOpen(true)}
        totalComplaintsCount={complaints.length}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 2. Top Header Bar with Three Dot Menu Button */}
      <NirikshanTopBar
        currentRole={currentRole}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenLodgeModal={() => setIsLodgeModalOpen(true)}
        onOpenDirectoryModal={() => setIsDirectoryModalOpen(true)}
        totalComplaintsCount={complaints.length}
      />

      {/* 3. 100% Full-Width Main Dashboard Area (Never halved or cut) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-6">
        {/* 1. Citizen / Normal User Dashboard */}
        {currentRole === 'user' && (
          <CitizenDashboard
            complaints={complaints}
            waterBodies={waterBodies}
            onOpenLodgeModal={() => setIsLodgeModalOpen(true)}
            onOpenDirectoryModal={() => setIsDirectoryModalOpen(true)}
          />
        )}

        {/* 2. Admin Dashboard (State-wide AP) */}
        {currentRole === 'admin' && (
          <AdminDashboard
            waterBodies={waterBodies}
            complaints={complaints}
            officers={officers}
            onOpenDirectoryModal={() => setIsDirectoryModalOpen(true)}
          />
        )}

        {/* 3. Nodal Officer - Vizianagaram */}
        {currentRole === 'nodal_vizianagaram' && (
          <NodalOfficerDashboard
            district="Vizianagaram"
            complaints={complaints}
            waterBodies={waterBodies}
            officers={officers}
            onAssignInspector={handleAssignInspector}
            onAssignEngineer={handleAssignEngineer}
          />
        )}

        {/* 4. Nodal Officer - Parvathipuram Manyam */}
        {currentRole === 'nodal_parvathipuram' && (
          <NodalOfficerDashboard
            district="Parvathipuram Manyam"
            complaints={complaints}
            waterBodies={waterBodies}
            officers={officers}
            onAssignInspector={handleAssignInspector}
            onAssignEngineer={handleAssignEngineer}
          />
        )}

        {/* 5. Field Inspector Mobile Workstation */}
        {currentRole === 'inspector' && (
          <InspectorDashboard
            complaints={complaints}
            waterBodies={waterBodies}
            onSubmitInspectionReport={handleSubmitInspectionReport}
            onSubmitPostWorkVerification={handleSubmitPostWorkVerification}
          />
        )}

        {/* 6. Action Worker / Engineer Mobile Workstation */}
        {currentRole === 'engineer' && (
          <EngineerDashboard
            complaints={complaints}
            waterBodies={waterBodies}
            onAcceptTask={handleAcceptTask}
            onBlockTask={handleBlockTask}
            onCompleteTask={handleCompleteTask}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#1b2a4a] text-slate-300 text-xs py-6 border-t border-blue-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">
                  Nir-ikshan (नीर-ईक्षण) — Andhra Pradesh Water Surveillance Ecosystem
                </h4>
                <p className="text-blue-300 text-[11px]">
                  Vizianagaram & Parvathipuram Manyam Districts • Water Resources Dept. AP
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDirectoryModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-amber-300" />
              <span>Verified Officer Contacts</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-blue-900/60 pt-3">
            <div>
              5-Role Architecture: Admin • Citizen • Vizianagaram Nodal • Parvathipuram Nodal • Inspector • Worker
            </div>
            <div className="font-mono text-emerald-400">
              Staff Credentials: admin@nir.com / 1234
            </div>
          </div>
        </div>
      </footer>

      {/* Lodge Complaint Modal (No login required) */}
      <LodgeComplaintModal
        isOpen={isLodgeModalOpen}
        onClose={() => setIsLodgeModalOpen(false)}
        onComplaintSubmitted={handleComplaintSubmitted}
      />

      {/* Officer Directory Modal */}
      <OfficerDirectoryModal
        isOpen={isDirectoryModalOpen}
        onClose={() => setIsDirectoryModalOpen(false)}
        officers={officers}
      />

      {/* Authentication Gate Modal (admin@nir.com / 1234) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        targetRole={pendingAuthRole}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
