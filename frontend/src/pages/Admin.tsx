import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Search, RefreshCw, X, UserX, UserCheck, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageTitle, Button, Badge } from '../components/CommonUI';
import Modal from '../components/Modal';
import {
  getAdminUsers,
  toggleUserLock,
  apiClient,
  getAdminHistoryForUser,
  getAdminChatsForUser,
} from '../api/client';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  plan: string;
  roles: string;
  accountLocked: boolean;
  createdAt: string;
  lastLogin: string | null;
  defaultWorkspaceId: number | null;
}

export default function Admin() {
  const { user, isAdmin: contextIsAdmin } = useAuth();
  const navigate = useNavigate();

  const isAdmin = contextIsAdmin || user?.isAdmin || user?.roles?.includes('ADMIN') || user?.roles?.includes('ROLE_ADMIN');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userScans, setUserScans] = useState<any[]>([]);
  const [userChats, setUserChats] = useState<any[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [typedConfirm, setTypedConfirm] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchUsers = async (p = page, q = searchQuery) => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await getAdminUsers(p, 15, q);
      if (data && data.content) {
        setUsers(data.content);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setUsers(data);
        setTotalPages(1);
        setTotalElements(data.length);
      }
    } catch (err: any) {
      console.error('Failed fetching admin users:', err);
      setActionError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers(page, searchQuery);
    }
  }, [isAdmin, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchUsers(0, searchQuery);
  };

  const handleToggleLock = async (u: AdminUser) => {
    try {
      const nextLocked = !u.accountLocked;
      await toggleUserLock(u.id, nextLocked);
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, accountLocked: nextLocked } : item))
      );
      if (selectedUser?.id === u.id) {
        setSelectedUser((prev) => (prev ? { ...prev, accountLocked: nextLocked } : null));
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to toggle account lock');
    }
  };

  const handleOpenDelete = (u: AdminUser) => {
    setUserToDelete(u);
    setTypedConfirm('');
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete || typedConfirm !== userToDelete.username) return;
    try {
      await apiClient.delete(`/api/admin/users/${userToDelete.id}`);
      setDeleteModalOpen(false);
      setUserToDelete(null);
      if (selectedUser?.id === userToDelete.id) {
        setSelectedUser(null);
      }
      fetchUsers(page, searchQuery);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete user');
    }
  };

  const handleInspectUser = async (u: AdminUser) => {
    setSelectedUser(u);
    setDrawerLoading(true);
    setUserScans([]);
    setUserChats([]);
    try {
      const [scans, chats] = await Promise.allSettled([
        getAdminHistoryForUser(u.username),
        getAdminChatsForUser(u.username),
      ]);
      if (scans.status === 'fulfilled') setUserScans(scans.value || []);
      if (chats.status === 'fulfilled') setUserChats(chats.value || []);
    } finally {
      setDrawerLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="page narrow">
        <PageTitle
          eyebrow="ACCESS CONTROL"
          title="Admin authorization required"
          copy="You do not have administrative privileges to access this console."
        />
        <div style={{ marginTop: '24px' }}>
          <Button onClick={() => navigate('/dashboard')}>Return to Overview</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageTitle
        eyebrow="ADMINISTRATION"
        title="Admin"
        copy="Manage user accounts, commercial subscriptions, workspaces, and system activity."
      />

      {actionError && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            backgroundColor: 'var(--amber-bg)',
            color: 'var(--amber)',
            borderRadius: 'var(--radius-sm, 8px)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {actionError}
        </div>
      )}

      {/* Search Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '420px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search className="w-4 h-4 text-neutral-400" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search by username or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm, 8px)',
                fontSize: '13px',
                color: 'var(--ink)',
                outline: 'none',
              }}
            />
          </div>
          <Button type="submit" kind="secondary">
            Search
          </Button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
            {totalElements} user{totalElements === 1 ? '' : 's'} registered
          </span>
          <button
            type="button"
            onClick={() => fetchUsers(page, searchQuery)}
            title="Refresh users list"
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm, 8px)',
              cursor: 'pointer',
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dense Users Table */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md, 14px)',
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', backgroundColor: 'var(--surface-2)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
                <th style={{ padding: '12px 16px' }}>User</th>
                <th style={{ padding: '12px 16px' }}>Plan</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Created</th>
                <th style={{ padding: '12px 16px' }}>Last active</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)' }}>
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => handleInspectUser(u)}
                    style={{
                      borderBottom: '1px solid var(--line)',
                      cursor: 'pointer',
                      backgroundColor: selectedUser?.id === u.id ? 'var(--sage)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{u.username}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono, monospace)' }}>
                        #{u.id} · {u.email || 'No email registered'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge tone={u.plan === 'PRO' ? 'sage' : u.plan === 'TEAM' ? 'green' : 'neutral'}>
                        {u.plan || 'FREE'}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge tone={u.accountLocked ? 'amber' : 'sage'}>
                        {u.accountLocked ? 'Locked' : 'Active'}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums', fontSize: '12px' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums', fontSize: '12px' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleInspectUser(u)}
                          title="View user details"
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--line)',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: 'var(--ink)',
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleLock(u)}
                          title={u.accountLocked ? 'Unlock user account' : 'Lock user account'}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--line)',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: u.accountLocked ? 'var(--green)' : 'var(--amber)',
                          }}
                        >
                          {u.accountLocked ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(u)}
                          title="Delete user account"
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--line)',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: 'var(--amber)',
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: 'var(--muted)',
            }}
          >
            <span>
              Page {page + 1} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Button
                kind="secondary"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                Previous
              </Button>
              <Button
                kind="secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Detail Drawer (Reusing Inspect pattern) */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: '480px',
            backgroundColor: 'var(--surface)',
            borderLeft: '1px solid var(--line)',
            boxShadow: 'var(--shadow-elevated)',
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', display: 'block' }}>
                USER INSPECTOR
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: 0,
                }}
              >
                {selectedUser.username}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                padding: '6px',
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Metadata Card */}
            <div
              style={{
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm, 8px)',
                padding: '16px',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>User ID</span>
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>#{selectedUser.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Email</span>
                <span>{selectedUser.email || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Plan</span>
                <Badge tone="sage">{selectedUser.plan || 'FREE'}</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Workspace ID</span>
                <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                  {selectedUser.defaultWorkspaceId ? `ws_${selectedUser.defaultWorkspaceId}` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Account Status</span>
                <Badge tone={selectedUser.accountLocked ? 'amber' : 'sage'}>
                  {selectedUser.accountLocked ? 'Locked' : 'Active'}
                </Badge>
              </div>
            </div>

            {/* Recent Scans */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '10px' }}>
                Recent scans ({userScans.length})
              </h3>
              {drawerLoading ? (
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Loading records…</div>
              ) : userScans.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--muted)', padding: '12px', backgroundColor: 'var(--surface-2)', borderRadius: '6px' }}>
                  No scans on record for this user.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {userScans.slice(0, 10).map((s: any) => (
                    <div
                      key={s.id}
                      style={{
                        padding: '10px 12px',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.contentPreview || 'Scan #' + s.id}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--green)' }}>
                        {s.confidence ? `${Math.round(s.confidence)}%` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Chats */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '10px' }}>
                Advisor interactions ({userChats.length})
              </h3>
              {userChats.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--muted)', padding: '12px', backgroundColor: 'var(--surface-2)', borderRadius: '6px' }}>
                  No advisor messages on record.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                  {userChats.slice(0, 5).map((c: any) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: 'var(--muted)',
                      }}
                    >
                      <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '2px' }}>
                        {c.message?.slice(0, 50)}…
                      </strong>
                      <span>{c.timestamp ? new Date(c.timestamp).toLocaleString() : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete User Typed Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete user account"
        eyebrow="DESTRUCTIVE ACTION"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--ink)' }}>
            This will permanently delete user <strong>{userToDelete?.username}</strong>, their associated workspace, and all stored scan records.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.06em' }}>
              Type "{userToDelete?.username}" to confirm
            </label>
            <input
              type="text"
              value={typedConfirm}
              onChange={(e) => setTypedConfirm(e.target.value)}
              placeholder={userToDelete?.username}
              style={{
                padding: '9px 12px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm, 8px)',
                fontSize: '13px',
                color: 'var(--ink)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button kind="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              kind="primary"
              disabled={typedConfirm !== userToDelete?.username}
              onClick={handleConfirmDelete}
              style={{ backgroundColor: 'var(--amber)' }}
            >
              Permanently delete user
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
