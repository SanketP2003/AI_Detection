import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Users,
  Plus,
  Trash2,
  Mail,
  Copy,
  Check,
  UserX,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PageTitle, Button, Badge } from '../components/CommonUI';
import Modal from '../components/Modal';
import {
  getUserProfile,
  updateUsername,
  updateUserEmail,
  updateUserPassword,
  getUsage,
  getInvoices,
  createPortalSession,
  UsageResponse,
  BillingInvoiceItem,
  getWorkspaces,
  createWorkspace,
  switchWorkspace,
  getWorkspaceMembers,
  updateMemberRole,
  removeMember,
  getWorkspaceInvitations,
  inviteWorkspaceMember,
  cancelWorkspaceInvitation,
  transferWorkspaceOwnership,
  deleteWorkspace,
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
} from '../api/client';

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabParam = searchParams.get('tab');
  const currentTab: 'general' | 'billing' | 'team' =
    tabParam === 'billing' ? 'billing' : tabParam === 'team' ? 'team' : 'general';

  const setTab = (tab: 'general' | 'billing' | 'team') => {
    if (tab === 'general') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  // General Settings State
  const [retention, setRetention] = useState(() => {
    return localStorage.getItem('save_history_enabled') !== 'false';
  });
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dangerMsg, setDangerMsg] = useState<string | null>(null);

  // Billing State
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoiceItem[]>([]);
  const [billingLoading, setBillingLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingMsg, setBillingMsg] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Team State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamMsg, setTeamMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Team Modals State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN' | 'VIEWER'>('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [createWsModalOpen, setCreateWsModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [createWsLoading, setCreateWsLoading] = useState(false);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<number | null>(null);
  const [transferTypedConfirm, setTransferTypedConfirm] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  const [deleteWsModalOpen, setDeleteWsModalOpen] = useState(false);
  const [deleteWsTypedConfirm, setDeleteWsTypedConfirm] = useState('');
  const [deleteWsLoading, setDeleteWsLoading] = useState(false);

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveTypedConfirm, setLeaveTypedConfirm] = useState('');
  const [leaveLoading, setLeaveLoading] = useState(false);

  const loadTeamData = async () => {
    setTeamLoading(true);
    setTeamMsg(null);
    try {
      const wsList = await getWorkspaces();
      setWorkspaces(wsList);
      const current = wsList.find((w) => w.isDefault) || wsList[0] || null;
      setActiveWorkspace(current);
      if (current) {
        const [mList, invList] = await Promise.all([
          getWorkspaceMembers(current.id),
          getWorkspaceInvitations(current.id).catch(() => []),
        ]);
        setMembers(mList);
        setInvitations(invList);
      }
    } catch (err: any) {
      setTeamMsg({ type: 'error', text: err.response?.data?.message || 'Failed to load team data' });
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'team') {
      loadTeamData();
    }
  }, [currentTab]);

  useEffect(() => {
    if (user?.username) {
      setEditUsername(user.username);
      getUserProfile()
        .then((p) => {
          if (p?.email) setEmail(p.email);
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (currentTab === 'billing') {
      let isMounted = true;
      setBillingLoading(true);

      Promise.allSettled([getUsage(), getInvoices(0, 20)]).then(([usageRes, invRes]) => {
        if (!isMounted) return;
        if (usageRes.status === 'fulfilled') {
          setUsage(usageRes.value);
        }
        if (invRes.status === 'fulfilled') {
          setInvoices(invRes.value.content || []);
        }
        setBillingLoading(false);
      });

      return () => {
        isMounted = false;
      };
    }
  }, [currentTab]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !inviteEmail.trim()) return;
    setInviteLoading(true);
    setTeamMsg(null);
    try {
      const inv = await inviteWorkspaceMember(activeWorkspace.id, inviteEmail.trim(), inviteRole);
      if (inv.token) {
        setCreatedInviteLink(`${window.location.origin}/invite/${inv.token}`);
      }
      setInviteEmail('');
      setTeamMsg({ type: 'success', text: `Invitation issued for ${inv.email}.` });
      const invList = await getWorkspaceInvitations(activeWorkspace.id).catch(() => []);
      setInvitations(invList);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to send invitation.';
      setTeamMsg({ type: 'error', text: msg });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setCreateWsLoading(true);
    setTeamMsg(null);
    try {
      await createWorkspace(newWsName.trim());
      setCreateWsModalOpen(false);
      setNewWsName('');
      setTeamMsg({ type: 'success', text: 'New workspace created successfully.' });
      loadTeamData();
    } catch (err: any) {
      setTeamMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create workspace.' });
    } finally {
      setCreateWsLoading(false);
    }
  };

  const handleUpdateRole = async (targetUserId: number, newRole: string) => {
    if (!activeWorkspace) return;
    try {
      await updateMemberRole(activeWorkspace.id, targetUserId, newRole);
      setTeamMsg({ type: 'success', text: 'Member role updated.' });
      const mList = await getWorkspaceMembers(activeWorkspace.id);
      setMembers(mList);
    } catch (err: any) {
      setTeamMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update member role.' });
    }
  };

  const handleRemoveMember = async (targetUserId: number, memberName: string) => {
    if (!activeWorkspace) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;
    try {
      await removeMember(activeWorkspace.id, targetUserId);
      setTeamMsg({ type: 'success', text: `${memberName} has been removed from the workspace.` });
      const mList = await getWorkspaceMembers(activeWorkspace.id);
      setMembers(mList);
    } catch (err: any) {
      setTeamMsg({ type: 'error', text: err.response?.data?.message || 'Failed to remove member.' });
    }
  };

  const handleCancelInvite = async (invitationId: number) => {
    if (!activeWorkspace) return;
    try {
      await cancelWorkspaceInvitation(activeWorkspace.id, invitationId);
      setTeamMsg({ type: 'success', text: 'Invitation canceled.' });
      const invList = await getWorkspaceInvitations(activeWorkspace.id).catch(() => []);
      setInvitations(invList);
    } catch (err: any) {
      setTeamMsg({ type: 'error', text: err.response?.data?.message || 'Failed to cancel invitation.' });
    }
  };

  const handleTransferOwnership = async () => {
    if (!activeWorkspace || !transferTargetId) return;
    if (transferTypedConfirm.trim() !== 'TRANSFER') {
      alert('Please type TRANSFER to confirm.');
      return;
    }
    setTransferLoading(true);
    try {
      await transferWorkspaceOwnership(activeWorkspace.id, transferTargetId);
      setTransferModalOpen(false);
      setTransferTypedConfirm('');
      setTransferTargetId(null);
      setTeamMsg({ type: 'success', text: 'Workspace ownership successfully transferred.' });
      loadTeamData();
    } catch (err: any) {
      setTeamMsg({ type: 'error', text: err.response?.data?.message || 'Failed to transfer ownership.' });
    } finally {
      setTransferLoading(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace) return;
    if (deleteWsTypedConfirm.trim() !== 'DELETE') {
      alert('Please type DELETE to confirm.');
      return;
    }
    setDeleteWsLoading(true);
    try {
      await deleteWorkspace(activeWorkspace.id);
      setDeleteWsModalOpen(false);
      setDeleteWsTypedConfirm('');
      setTeamMsg({ type: 'success', text: 'Workspace deleted.' });
      loadTeamData();
    } catch (err: any) {
      setTeamMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete workspace.' });
    } finally {
      setDeleteWsLoading(false);
    }
  };

  const handleLeaveWorkspace = async () => {
    if (!activeWorkspace || !user?.username) return;
    if (leaveTypedConfirm.trim() !== 'LEAVE') {
      alert('Please type LEAVE to confirm.');
      return;
    }
    const currentMember = members.find((m) => m.isCurrentUser);
    if (!currentMember) return;
    setLeaveLoading(true);
    try {
      await removeMember(activeWorkspace.id, currentMember.userId);
      setLeaveModalOpen(false);
      setLeaveTypedConfirm('');
      window.location.reload();
    } catch (err: any) {
      setTeamMsg({ type: 'error', text: err.response?.data?.message || 'Failed to leave workspace.' });
      setLeaveLoading(false);
    }
  };

  const handleToggleRetention = () => {
    const next = !retention;
    setRetention(next);
    localStorage.setItem('save_history_enabled', String(next));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      if (editUsername && editUsername !== user?.username) {
        await updateUsername(editUsername);
      }
      if (email) {
        await updateUserEmail(email);
      }
      setProfileMsg({ type: 'success', text: 'Profile preferences updated successfully.' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await updateUserPassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteData = () => {
    if (
      !confirm(
        'Are you sure you want to delete all saved analyses and workspace data from this browser? This action cannot be undone.'
      )
    ) {
      return;
    }
    localStorage.removeItem('detection_history');
    localStorage.removeItem('latest_analysis');
    setDangerMsg('Workspace data cleared from this browser.');
    setTimeout(() => setDangerMsg(null), 4000);
  };

  const handleOpenPortal = async () => {
    setBillingMsg(null);
    try {
      setPortalLoading(true);
      const res = await createPortalSession(window.location.href);
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      if (err.response?.status === 503) {
        setBillingMsg('Billing is not enabled on this deployment.');
      } else {
        setBillingMsg(err.response?.data?.message || err.message || 'Failed to open billing portal.');
      }
    } finally {
      setPortalLoading(false);
    }
  };

  const formatPeriodDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const planName = usage?.plan?.toUpperCase() || 'FREE';
  const status = usage?.status?.toUpperCase() || 'ACTIVE';
  const isPaid = planName !== 'FREE';

  return (
    <div className="page narrow">
      <PageTitle
        eyebrow="PREFERENCES & SECURITY"
        title="Settings"
        copy="Manage your workspace appearance, preferences, and billing subscription."
      />

      {/* Segmented Control Tabs */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px',
          backgroundColor: 'var(--surface-2)',
          borderRadius: 'var(--radius-sm, 8px)',
          border: '1px solid var(--line)',
          marginBottom: '28px',
        }}
      >
        <button
          type="button"
          onClick={() => setTab('general')}
          style={{
            padding: '7px 16px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '6px',
            border: currentTab === 'general' ? '1px solid var(--line)' : '1px solid transparent',
            backgroundColor: currentTab === 'general' ? 'var(--surface)' : 'transparent',
            color: currentTab === 'general' ? 'var(--ink)' : 'var(--muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          General & Security
        </button>
        <button
          type="button"
          onClick={() => setTab('billing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '6px',
            border: currentTab === 'billing' ? '1px solid var(--line)' : '1px solid transparent',
            backgroundColor: currentTab === 'billing' ? 'var(--surface)' : 'transparent',
            color: currentTab === 'billing' ? 'var(--ink)' : 'var(--muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Plans & Billing</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('team')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '6px',
            border: currentTab === 'team' ? '1px solid var(--line)' : '1px solid transparent',
            backgroundColor: currentTab === 'team' ? 'var(--surface)' : 'transparent',
            color: currentTab === 'team' ? 'var(--ink)' : 'var(--muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team & Seats</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 1: GENERAL SETTINGS */}
      {/* ───────────────────────────────────────────────────────── */}
      {currentTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Appearance Section */}
          <section className="settings-section">
            <div>
              <h2>Appearance</h2>
              <p>Choose how AI Verify looks on this device.</p>
            </div>
            <div className="theme-options">
              {(['light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={theme === t ? 'selected' : ''}
                  type="button"
                >
                  <span className={`theme-preview ${t}`}>
                    <i />
                    <i />
                    <i />
                  </span>
                  <b>{t === 'light' ? 'Light' : 'Dark'}</b>
                  <small>{theme === t ? 'Selected' : 'Use theme'}</small>
                </button>
              ))}
            </div>
          </section>

          {/* History Retention */}
          <section className="settings-section row-setting">
            <div>
              <h2>Save analysis history</h2>
              <p>Keep completed analyses available in your workspace scan history.</p>
            </div>
            <button
              className={`toggle ${retention ? 'on' : ''}`}
              onClick={handleToggleRetention}
              aria-label="Toggle analysis history saving"
              type="button"
            >
              <i />
            </button>
          </section>

          {/* Account Profile */}
          {user && (
            <section className="settings-section">
              <div>
                <h2>Account Profile</h2>
                <p>Update your workspace username and notification email.</p>
              </div>

              <form onSubmit={handleUpdateProfile} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {profileMsg && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      background: profileMsg.type === 'success' ? 'var(--sage)' : 'var(--amber-bg)',
                      color: profileMsg.type === 'success' ? 'var(--green)' : 'var(--amber)',
                    }}
                  >
                    {profileMsg.text}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--surface)',
                        border: '1px solid var(--line)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        color: 'var(--ink)',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--surface)',
                        border: '1px solid var(--line)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        color: 'var(--ink)',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                  <Button type="submit" disabled={profileLoading}>
                    {profileLoading ? 'Saving…' : 'Save profile'}
                  </Button>
                </div>
              </form>
            </section>
          )}

          {/* Password Change */}
          {user && (
            <section className="settings-section">
              <div>
                <h2>Change Password</h2>
                <p>Update your authentication password to keep your account secure.</p>
              </div>

              <form onSubmit={handleUpdatePassword} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {passwordMsg && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      background: passwordMsg.type === 'success' ? 'var(--sage)' : 'var(--amber-bg)',
                      color: passwordMsg.type === 'success' ? 'var(--green)' : 'var(--amber)',
                    }}
                  >
                    {passwordMsg.text}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        background: 'var(--surface)',
                        border: '1px solid var(--line)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        color: 'var(--ink)',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      style={{
                        width: '100%',
                        background: 'var(--surface)',
                        border: '1px solid var(--line)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        color: 'var(--ink)',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                  <Button type="submit" disabled={passwordLoading || !currentPassword || !newPassword}>
                    {passwordLoading ? 'Updating…' : 'Update password'}
                  </Button>
                </div>
              </form>
            </section>
          )}

          {/* Clear Browser Data */}
          <section className="settings-section danger-zone">
            <div>
              <h2>Clear browser data</h2>
              <p>Permanently remove saved analyses and cached preferences from this browser only.</p>
              {dangerMsg && (
                <p style={{ color: 'var(--amber)', fontWeight: 600, marginTop: 6, fontSize: 12 }}>
                  {dangerMsg}
                </p>
              )}
            </div>
            <Button kind="secondary" onClick={handleDeleteData}>
              Clear browser data
            </Button>
          </section>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 2: PLANS & BILLING */}
      {/* ───────────────────────────────────────────────────────── */}
      {currentTab === 'billing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {billingMsg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm, 8px)',
                backgroundColor: 'var(--amber-bg)',
                color: 'var(--amber)',
                fontSize: '13px',
                fontWeight: 600,
                border: '1px solid var(--line)',
              }}
            >
              {billingMsg}
            </div>
          )}

          {/* Section 1: Current Plan */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md, 14px)',
              padding: '24px 28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                  Current Plan
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-sora, "Sora", sans-serif)',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      margin: 0,
                    }}
                  >
                    {planName} Plan
                  </h3>
                  <Badge
                    tone={
                      status === 'ACTIVE' || status === 'TRIALING'
                        ? 'sage'
                        : status === 'PAST_DUE'
                        ? 'amber'
                        : 'neutral'
                    }
                  >
                    {status}
                  </Badge>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <Button kind="secondary" onClick={() => navigate('/pricing')}>
                  Change plan
                </Button>
                {isPaid && (
                  <Button kind="secondary" onClick={handleOpenPortal} disabled={portalLoading}>
                    {portalLoading ? 'Opening…' : 'Manage billing'}
                  </Button>
                )}
                {isPaid && status !== 'CANCELED' && (
                  <Button kind="ghost" onClick={() => setCancelModalOpen(true)}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--muted)', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <span>Seats: {usage?.seats || 1} workspace seat</span>
              {usage?.periodEnd && (
                <span>
                  {status === 'CANCELED' ? 'Access ends: ' : 'Renews: '}
                  {formatPeriodDate(usage.periodEnd)}
                </span>
              )}
              {status === 'TRIALING' && usage?.trialEnd && (
                <span style={{ color: 'var(--amber)', fontWeight: 600 }}>
                  Trial ends: {formatPeriodDate(usage.trialEnd)}
                </span>
              )}
            </div>
          </div>

          {/* Section 2: Usage this period */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md, 14px)',
              padding: '24px 28px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-sora, "Sora", sans-serif)',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--ink)',
                margin: '0 0 18px 0',
              }}
            >
              Usage this period
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Row 1: Scans */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', fontWeight: 700 }}>
                  <span>Analyses</span>
                  <span style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                    {usage?.entitlements.scans?.used ?? 0} / {usage?.entitlements.scans?.limit ?? 20}
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (((usage?.entitlements.scans?.used ?? 0) / Math.max(1, usage?.entitlements.scans?.limit ?? 20)) * 100))}%`,
                      backgroundColor:
                        ((usage?.entitlements.scans?.used ?? 0) / Math.max(1, usage?.entitlements.scans?.limit ?? 20)) >= 0.8
                          ? 'var(--amber)'
                          : 'var(--green)',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Advisor Messages */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', fontWeight: 700 }}>
                  <span>AI Advisor questions</span>
                  <span style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                    {usage?.entitlements.advisor_messages?.used ?? 0} / {usage?.entitlements.advisor_messages?.limit ?? 10}
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (((usage?.entitlements.advisor_messages?.used ?? 0) / Math.max(1, usage?.entitlements.advisor_messages?.limit ?? 10)) * 100))}%`,
                      backgroundColor: 'var(--green)',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Character scan capacity */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', fontWeight: 700 }}>
                  <span>Max characters per scan</span>
                  <span style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
                    {planName === 'FREE' ? '5,000 chars' : planName === 'PRO' ? '50,000 chars' : '200,000 chars'}
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: '100%',
                      backgroundColor: 'var(--green)',
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>
            </div>

            {usage?.entitlements.scans?.resetsAt && (
              <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--muted)' }}>
                Limits reset on {formatPeriodDate(usage.entitlements.scans.resetsAt)}.
              </div>
            )}
          </div>

          {/* Section 3: Invoices */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md, 14px)',
              padding: '24px 28px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-sora, "Sora", sans-serif)',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--ink)',
                margin: '0 0 16px 0',
              }}
            >
              Billing invoices
            </h3>

            {invoices.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                No invoices yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <th style={{ padding: '8px 12px' }}>Date</th>
                      <th style={{ padding: '8px 12px' }}>Invoice</th>
                      <th style={{ padding: '8px 12px' }}>Amount</th>
                      <th style={{ padding: '8px 12px' }}>Status</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '12px', color: 'var(--ink)' }}>
                          {formatPeriodDate(inv.createdAt)}
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', fontSize: '11px' }}>
                          {inv.invoiceNumber || inv.providerInvoiceId}
                        </td>
                        <td style={{ padding: '12px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                          {inv.amountFormatted}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Badge tone={inv.status === 'paid' ? 'sage' : 'amber'}>
                            {inv.status}
                          </Badge>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {inv.pdfUrl ? (
                            <a
                              href={inv.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}
                            >
                              PDF ↗
                            </a>
                          ) : inv.hostedInvoiceUrl ? (
                            <a
                              href={inv.hostedInvoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}
                            >
                              View ↗
                            </a>
                          ) : (
                            <span style={{ color: 'var(--muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Payment Method */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md, 14px)',
              padding: '24px 28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-sora, "Sora", sans-serif)',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    margin: '0 0 6px 0',
                  }}
                >
                  Payment method
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                  Credit card and invoicing details are managed through Stripe's PCI-compliant portal.
                </p>
              </div>

              {isPaid ? (
                <Button kind="secondary" onClick={handleOpenPortal} disabled={portalLoading}>
                  Update payment method
                </Button>
              ) : (
                <Button kind="secondary" onClick={() => navigate('/pricing')}>
                  Add payment method
                </Button>
              )}
            </div>
          </div>

          {/* Section 5: Danger Zone & Lifecycle */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md, 14px)',
              padding: '24px 28px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-sora, "Sora", sans-serif)',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--ink)',
                margin: '0 0 8px 0',
              }}
            >
              Subscription terms & data retention
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
              Upon plan downgrade or cancellation, your past detection analyses and report records remain securely retained in accordance with your plan's retention period. No data is immediately deleted on downgrade.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Button kind="secondary" onClick={handleDeleteData}>
                Clear local browser data
              </Button>
              {isPaid && status !== 'CANCELED' && (
                <Button kind="ghost" onClick={() => setCancelModalOpen(true)}>
                  Cancel subscription
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 3: TEAM & SEATS */}
      {/* ───────────────────────────────────────────────────────── */}
      {currentTab === 'team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Message */}
          {teamMsg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm, 8px)',
                backgroundColor: teamMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${teamMsg.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                color: teamMsg.type === 'success' ? 'var(--green, #10b981)' : '#ef4444',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {teamMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{teamMsg.text}</span>
            </div>
          )}

          {teamLoading ? (
            <div className="glass-card" style={{ padding: '32px', textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>
              Loading workspace and team members…
            </div>
          ) : !activeWorkspace ? (
            <div className="glass-card" style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--muted)' }}>
              No active workspace found.
            </div>
          ) : (
            <>
              {/* Card 1: Workspace & Seat Allocation */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display, Sora)' }}>
                        {activeWorkspace.name}
                      </h2>
                      <Badge tone={activeWorkspace.role === 'OWNER' ? 'positive' : 'neutral'}>
                        {activeWorkspace.role}
                      </Badge>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                      Plan: <strong style={{ color: 'var(--ink)' }}>{activeWorkspace.plan}</strong> • Slug: <span style={{ fontFamily: 'var(--font-mono, JetBrains Mono)', fontSize: '12px' }}>{activeWorkspace.slug}</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      kind="secondary"
                      onClick={() => setCreateWsModalOpen(true)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      New workspace
                    </Button>
                    {(activeWorkspace.role === 'OWNER' || activeWorkspace.role === 'ADMIN') && (
                      <Button
                        kind="primary"
                        onClick={() => {
                          setCreatedInviteLink(null);
                          setInviteModalOpen(true);
                        }}
                        disabled={members.length + invitations.length >= activeWorkspace.seats}
                        title={members.length + invitations.length >= activeWorkspace.seats ? 'Seat limit reached' : 'Invite team member'}
                      >
                        <Mail className="w-3.5 h-3.5 mr-1" />
                        Invite member
                      </Button>
                    )}
                  </div>
                </div>

                {/* Seat Meter */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Seat Utilization
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono, JetBrains Mono)', fontVariantNumeric: 'tabular-nums' }}>
                      {members.length + invitations.length} / {activeWorkspace.seats} {activeWorkspace.seats === 1 ? 'seat' : 'seats'}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'var(--surface-2)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, ((members.length + invitations.length) / activeWorkspace.seats) * 100)}%`,
                        backgroundColor: members.length + invitations.length >= activeWorkspace.seats ? 'var(--amber, #f59e0b)' : 'var(--green, #10b981)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  {members.length + invitations.length >= activeWorkspace.seats && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--amber, #f59e0b)' }}>
                        All available seats allocated. Add seats or upgrade plan to invite more colleagues.
                      </p>
                      <Link to="/pricing" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--green, #10b981)', textDecoration: 'underline' }}>
                        View plans & seats →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Team Members Table */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600 }}>
                  Workspace Members ({members.length})
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Member</th>
                        <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Email</th>
                        <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Role</th>
                        <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Joined</th>
                        <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => {
                        const initials = (m.username || m.email || 'U').substring(0, 2).toUpperCase();
                        const canModifyRole = (activeWorkspace.role === 'OWNER' || activeWorkspace.role === 'ADMIN') && !m.isOwner && !m.isCurrentUser;
                        const canRemove = (activeWorkspace.role === 'OWNER' || activeWorkspace.role === 'ADMIN') && !m.isOwner && !m.isCurrentUser;

                        return (
                          <tr key={m.userId} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--surface-2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: 'var(--ink)',
                                    border: '1px solid var(--line)',
                                  }}
                                >
                                  {initials}
                                </div>
                                <span style={{ fontWeight: 600 }}>{m.username}</span>
                                {m.isCurrentUser && (
                                  <span style={{ fontSize: '10px', color: 'var(--muted)' }}>(You)</span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '12px', fontFamily: 'var(--font-mono, JetBrains Mono)', fontSize: '12px', color: 'var(--muted)' }}>
                              {m.email}
                            </td>
                            <td style={{ padding: '12px' }}>
                              {canModifyRole ? (
                                <select
                                  value={m.role}
                                  onChange={(e) => handleUpdateRole(m.userId, e.target.value)}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--line)',
                                    backgroundColor: 'var(--surface-2)',
                                    color: 'var(--ink)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <option value="ADMIN">ADMIN</option>
                                  <option value="MEMBER">MEMBER</option>
                                  <option value="VIEWER">VIEWER</option>
                                </select>
                              ) : (
                                <Badge tone={m.isOwner ? 'positive' : 'neutral'}>
                                  {m.role}
                                </Badge>
                              )}
                            </td>
                            <td style={{ padding: '12px', fontSize: '12px', color: 'var(--muted)' }}>
                              {new Date(m.joinedAt).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              {canRemove && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(m.userId, m.username)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                  }}
                                >
                                  Remove
                                </button>
                              )}
                              {m.isCurrentUser && !m.isOwner && (
                                <button
                                  type="button"
                                  onClick={() => setLeaveModalOpen(true)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                  }}
                                >
                                  Leave
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card 3: Pending Invitations */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600 }}>
                  Pending Invitations ({invitations.length})
                </h3>
                {invitations.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                    No pending invitations.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Invited Email</th>
                          <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Role</th>
                          <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Expires</th>
                          <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invitations.map((inv) => (
                          <tr key={inv.id} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '12px', fontFamily: 'var(--font-mono, JetBrains Mono)', fontSize: '12px' }}>
                              {inv.email}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <Badge tone="neutral">{inv.role}</Badge>
                            </td>
                            <td style={{ padding: '12px', fontSize: '12px', color: 'var(--muted)' }}>
                              {new Date(inv.expiresAt).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              {(activeWorkspace.role === 'OWNER' || activeWorkspace.role === 'ADMIN') && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelInvite(inv.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                  }}
                                >
                                  Revoke
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Card 4: Danger Zone */}
              <div className="glass-card" style={{ padding: '24px', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600, color: '#ef4444' }}>
                  Workspace Danger Zone
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--muted)' }}>
                  Irreversible actions affecting this workspace and team memberships.
                </p>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {activeWorkspace.role === 'OWNER' ? (
                    <>
                      <Button
                        kind="secondary"
                        onClick={() => {
                          setTransferTargetId(members.find((m) => !m.isCurrentUser)?.userId || null);
                          setTransferTypedConfirm('');
                          setTransferModalOpen(true);
                        }}
                        disabled={members.length <= 1}
                        title={members.length <= 1 ? 'Add at least one member before transferring ownership' : 'Transfer workspace ownership'}
                      >
                        Transfer ownership
                      </Button>
                      <Button
                        kind="ghost"
                        onClick={() => {
                          setDeleteWsTypedConfirm('');
                          setDeleteWsModalOpen(true);
                        }}
                      >
                        Delete workspace
                      </Button>
                    </>
                  ) : (
                    <Button
                      kind="ghost"
                      onClick={() => {
                        setLeaveTypedConfirm('');
                        setLeaveModalOpen(true);
                      }}
                    >
                      Leave workspace
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite team member"
        eyebrow="TEAM & SEATS"
      >
        <form onSubmit={handleInviteMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
              Colleague's Email
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="name@company.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--ink)',
                fontSize: '13px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
              Workspace Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--ink)',
                fontSize: '13px',
              }}
            >
              <option value="MEMBER">Member (Can run scans & view reports)</option>
              <option value="ADMIN">Admin (Can manage team & settings)</option>
              <option value="VIEWER">Viewer (Read-only access)</option>
            </select>
          </div>

          {createdInviteLink && (
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--line)' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Invitation Link Created:</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={createdInviteLink}
                  style={{
                    flex: 1,
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono, JetBrains Mono)',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--ink)',
                  }}
                />
                <Button
                  kind="secondary"
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdInviteLink);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button kind="secondary" type="button" onClick={() => setInviteModalOpen(false)}>
              Close
            </Button>
            <Button kind="primary" type="submit" disabled={inviteLoading}>
              {inviteLoading ? 'Sending…' : 'Send invitation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Workspace Modal */}
      <Modal
        isOpen={createWsModalOpen}
        onClose={() => setCreateWsModalOpen(false)}
        title="Create new workspace"
        eyebrow="TEAM & SEATS"
      >
        <form onSubmit={handleCreateWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
              Workspace Name
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              placeholder="e.g. Acme Research Lab"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--ink)',
                fontSize: '13px',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button kind="secondary" type="button" onClick={() => setCreateWsModalOpen(false)}>
              Cancel
            </Button>
            <Button kind="primary" type="submit" disabled={createWsLoading}>
              {createWsLoading ? 'Creating…' : 'Create workspace'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Ownership Modal */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Transfer workspace ownership"
        eyebrow="OWNERSHIP"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6 }}>
            Transferring ownership of <strong>{activeWorkspace?.name}</strong> makes another member the primary owner. You will retain Administrator rights.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
              Select New Owner
            </label>
            <select
              value={transferTargetId ?? ''}
              onChange={(e) => setTransferTargetId(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--ink)',
                fontSize: '13px',
              }}
            >
              {members
                .filter((m) => !m.isCurrentUser)
                .map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.username} ({m.email})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
              Type TRANSFER to confirm
            </label>
            <input
              type="text"
              value={transferTypedConfirm}
              onChange={(e) => setTransferTypedConfirm(e.target.value)}
              placeholder="TRANSFER"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--ink)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono, JetBrains Mono)',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button kind="secondary" onClick={() => setTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button
              kind="primary"
              disabled={transferTypedConfirm.trim() !== 'TRANSFER' || transferLoading || !transferTargetId}
              onClick={handleTransferOwnership}
            >
              {transferLoading ? 'Transferring…' : 'Confirm transfer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Workspace Modal */}
      <Modal
        isOpen={deleteWsModalOpen}
        onClose={() => setDeleteWsModalOpen(false)}
        title="Delete workspace"
        eyebrow="DESTRUCTIVE ACTION"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6 }}>
            Are you sure you want to delete <strong>{activeWorkspace?.name}</strong>? All team memberships and associated data will be removed.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
              Type DELETE to confirm
            </label>
            <input
              type="text"
              value={deleteWsTypedConfirm}
              onChange={(e) => setDeleteWsTypedConfirm(e.target.value)}
              placeholder="DELETE"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--ink)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono, JetBrains Mono)',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button kind="secondary" onClick={() => setDeleteWsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              kind="ghost"
              disabled={deleteWsTypedConfirm.trim() !== 'DELETE' || deleteWsLoading}
              onClick={handleDeleteWorkspace}
              style={{ color: '#ef4444' }}
            >
              {deleteWsLoading ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Leave Workspace Modal */}
      <Modal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        title="Leave workspace"
        eyebrow="MEMBERSHIP"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6 }}>
            Are you sure you want to leave <strong>{activeWorkspace?.name}</strong>? You will lose access to team scans and reports.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
              Type LEAVE to confirm
            </label>
            <input
              type="text"
              value={leaveTypedConfirm}
              onChange={(e) => setLeaveTypedConfirm(e.target.value)}
              placeholder="LEAVE"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--ink)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono, JetBrains Mono)',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button kind="secondary" onClick={() => setLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              kind="ghost"
              disabled={leaveTypedConfirm.trim() !== 'LEAVE' || leaveLoading}
              onClick={handleLeaveWorkspace}
              style={{ color: '#ef4444' }}
            >
              {leaveLoading ? 'Leaving…' : 'Confirm leave'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancellation Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel subscription"
        eyebrow="SUBSCRIPTION MANAGEMENT"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--ink)' }}>
            Are you sure you want to cancel your {planName} subscription?
          </p>
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--surface-2)',
              borderRadius: 'var(--radius-sm, 8px)',
              fontSize: '12px',
              color: 'var(--muted)',
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: 0 }}>
              <strong>Uninterrupted access:</strong> Your workspace will retain full {planName} capabilities until the end of your prepaid billing period
              {usage?.periodEnd ? ` (${formatPeriodDate(usage.periodEnd)})` : ''}. You will not be charged again.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button kind="secondary" onClick={() => setCancelModalOpen(false)}>
              Keep subscription
            </Button>
            <Button
              kind="primary"
              onClick={() => {
                setCancelModalOpen(false);
                handleOpenPortal();
              }}
            >
              Proceed to portal to cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
