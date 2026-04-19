import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Box,
  Users,
  Settings,
  Store,
  Menu,
  X,
  ChevronDown,
  TrendingUp,
  ShoppingCart,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  LogOut,
  Bell,
  Plus,
} from 'lucide-react';
import { useCurrentOrganization } from '../hooks/useCurrentOrganization';
import { useBranchStore } from '../store/useBranchStore';
import { getBranches } from '../components/branches';
import { signOut } from '../lib/auth';

type AdminTab = 'dashboard' | 'sales' | 'products' | 'inventory' | 'staff' | 'settings';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'sales',     label: 'Sales',      icon: Receipt },
  { id: 'products',  label: 'Products',   icon: Package },
  { id: 'inventory', label: 'Inventory',  icon: Box },
  { id: 'staff',     label: 'Staff',      icon: Users },
  { id: 'settings',  label: 'Settings',   icon: Settings },
] as const;

export default function Admin() {
  const navigate = useNavigate();
  const { currentOrganization, role } = useCurrentOrganization();
  const { currentBranch, setCurrentBranch } = useBranchStore();

  const [activeTab, setActiveTab]           = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [branches, setBranches]             = useState<any[]>([]);

  useEffect(() => {
    if (role && role !== 'owner' && role !== 'admin') navigate('/dashboard');
  }, [role, navigate]);

  useEffect(() => {
    if (!currentOrganization) return;
    getBranches(currentOrganization.id).then(data => {
      setBranches(data || []);
      if (data?.length > 0 && !currentBranch) setCurrentBranch(data[0]);
    });
  }, [currentOrganization]);

  const handleNav = (id: AdminTab) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#0e0e0e] text-[#ededed] font-['Inter',sans-serif] overflow-hidden">

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-[#141414] border-r border-[#242424]
        transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-[#242424] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#3ecf8e]/15 flex items-center justify-center shrink-0">
              <Store size={15} className="text-[#3ecf8e]" />
            </div>
            <span className="font-semibold text-sm truncate">
              {currentOrganization?.name || 'Organisation'}
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-[#606060] hover:text-[#ededed] p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${active
                    ? 'bg-[#3ecf8e]/10 text-[#3ecf8e]'
                    : 'text-[#888] hover:text-[#ededed] hover:bg-[#1e1e1e]'}
                `}
              >
                <Icon size={17} className={active ? 'text-[#3ecf8e]' : ''} />
                {label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[#242424] space-y-0.5 shrink-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#888] hover:text-[#ededed] hover:bg-[#1e1e1e] transition-all"
          >
            <ArrowDownRight size={17} />
            Back to Home
          </button>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#888] hover:text-[#ff5f56] hover:bg-[#ff5f56]/5 transition-all"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ── Main ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Bar */}
        <header className="h-16 shrink-0 bg-[#141414] border-b border-[#242424] flex items-center gap-4 px-4 md:px-6 z-30">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-[#888] hover:text-[#ededed] p-1"
          >
            <Menu size={22} />
          </button>

          {/* Page title */}
          <h1 className="text-base font-semibold hidden md:block">
            {NAV_ITEMS.find(t => t.id === activeTab)?.label}
          </h1>
          {/* Mobile: org name instead of page title */}
          <span className="font-semibold text-sm truncate md:hidden">
            {currentOrganization?.name || 'Organisation'}
          </span>

          <div className="ml-auto flex items-center gap-3">
            {/* Org name pill — desktop */}
            <div className="hidden sm:flex items-center gap-2 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-[#3ecf8e]" />
              <span className="text-xs font-medium text-[#ededed] max-w-[140px] truncate">
                {currentOrganization?.name || '—'}
              </span>
            </div>

            {/* Branch selector */}
            <div className="relative">
              <select
                value={currentBranch?.id || ''}
                onChange={e => {
                  const b = branches.find(b => b.id === e.target.value);
                  if (b) setCurrentBranch(b);
                }}
                disabled={branches.length === 0}
                className="appearance-none bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] text-xs font-medium rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:border-[#3ecf8e] transition-colors disabled:opacity-40 cursor-pointer max-w-[140px]"
              >
                {branches.length === 0
                  ? <option value="">No branches</option>
                  : branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                }
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#606060] pointer-events-none" />
            </div>

            {/* Notification bell */}
            <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] text-[#888] hover:text-[#ededed] transition-colors">
              <Bell size={16} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[#0e0e0e]">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Mobile page title */}
            <h1 className="text-xl font-bold mb-5 md:hidden">
              {NAV_ITEMS.find(t => t.id === activeTab)?.label}
            </h1>

            {activeTab === 'dashboard'  && <DashboardTab org={currentOrganization} branch={currentBranch} />}
            {activeTab === 'sales'      && <SalesTab />}
            {activeTab === 'products'   && <ProductsTab />}
            {activeTab === 'inventory'  && <InventoryTab />}
            {activeTab === 'staff'      && <StaffTab />}
            {activeTab === 'settings'   && <SettingsTab org={currentOrganization} />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── Tab: Dashboard ─────────────────────────────────────────── */
function DashboardTab({ org, branch }: { org: any; branch: any }) {
  const stats = [
    { label: "Today's Sales",    value: '—',  sub: 'No data yet', icon: TrendingUp,   up: true  },
    { label: 'Transactions',     value: '—',  sub: 'No data yet', icon: ShoppingCart, up: true  },
    { label: 'Low Stock Items',  value: '—',  sub: 'No data yet', icon: AlertCircle,  up: false },
    { label: 'Active Staff',     value: '—',  sub: 'No data yet', icon: Users,        up: true  },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, up }) => (
          <div key={label} className="bg-[#141414] border border-[#242424] rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#666] font-medium">{label}</span>
              <div className="w-8 h-8 rounded-lg bg-[#1e1e1e] flex items-center justify-center">
                <Icon size={15} className="text-[#888]" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-[#555] mt-0.5">{sub}</p>
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${up ? 'text-[#3ecf8e]' : 'text-[#ff5f56]'}`}>
              {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              <span>—</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#141414] border border-[#242424] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Recent Sales</h2>
            <span className="text-xs text-[#555]">Last 7 days</span>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-[#444]">
            <Receipt size={36} className="mb-3 opacity-30" />
            <p className="text-xs font-mono uppercase tracking-widest">No sales recorded yet</p>
          </div>
        </div>

        <div className="bg-[#141414] border border-[#242424] rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'New Sale',       icon: ShoppingCart },
              { label: 'Add Product',    icon: Package },
              { label: 'Add Staff',      icon: Users },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] border border-[#2e2e2e] text-sm text-[#ccc] hover:text-[#ededed] transition-all"
              >
                <Icon size={15} className="text-[#3ecf8e]" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Tab: Sales ─────────────────────────────────────────────── */
function SalesTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Sales History</h2>
          <p className="text-xs text-[#555] mt-0.5">All transactions for this branch</p>
        </div>
        <button className="flex items-center gap-2 bg-[#3ecf8e] hover:bg-[#32b279] text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors">
          <Plus size={14} />
          New Sale
        </button>
      </div>
      <div className="bg-[#141414] border border-[#242424] rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 px-5 py-3 border-b border-[#242424] text-[10px] font-mono uppercase tracking-widest text-[#555]">
          <span>Date</span><span>Items</span><span>Staff</span><span className="text-right">Total</span>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-[#444]">
          <Receipt size={36} className="mb-3 opacity-30" />
          <p className="text-xs font-mono uppercase tracking-widest">No sales yet</p>
        </div>
      </div>
    </div>
  );
}

/* ── Tab: Products ──────────────────────────────────────────── */
function ProductsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Products</h2>
          <p className="text-xs text-[#555] mt-0.5">Manage your product catalogue</p>
        </div>
        <button className="flex items-center gap-2 bg-[#3ecf8e] hover:bg-[#32b279] text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors">
          <Plus size={14} />
          Add Product
        </button>
      </div>
      <div className="bg-[#141414] border border-[#242424] rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 px-5 py-3 border-b border-[#242424] text-[10px] font-mono uppercase tracking-widest text-[#555]">
          <span className="col-span-2">Name</span><span>Price</span><span className="text-right">Stock</span>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-[#444]">
          <Package size={36} className="mb-3 opacity-30" />
          <p className="text-xs font-mono uppercase tracking-widest">No products added</p>
        </div>
      </div>
    </div>
  );
}

/* ── Tab: Inventory ─────────────────────────────────────────── */
function InventoryTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Inventory</h2>
          <p className="text-xs text-[#555] mt-0.5">Track stock levels across branches</p>
        </div>
        <button className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#2e2e2e] text-[#ccc] text-xs font-bold px-4 py-2 rounded-lg transition-colors">
          <ArrowUpRight size={14} />
          Export
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {[
          { label: 'Total Items',  color: 'text-[#3ecf8e]' },
          { label: 'Low Stock',    color: 'text-[#f59e0b]' },
          { label: 'Out of Stock', color: 'text-[#ff5f56]' },
        ].map(({ label, color }) => (
          <div key={label} className="bg-[#141414] border border-[#242424] rounded-xl p-4">
            <p className="text-xs text-[#555] mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>—</p>
          </div>
        ))}
      </div>
      <div className="bg-[#141414] border border-[#242424] rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 px-5 py-3 border-b border-[#242424] text-[10px] font-mono uppercase tracking-widest text-[#555]">
          <span className="col-span-2">Product</span><span>Status</span><span className="text-right">Qty</span>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-[#444]">
          <Box size={36} className="mb-3 opacity-30" />
          <p className="text-xs font-mono uppercase tracking-widest">No inventory data</p>
        </div>
      </div>
    </div>
  );
}

/* ── Tab: Staff ─────────────────────────────────────────────── */
function StaffTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Staff</h2>
          <p className="text-xs text-[#555] mt-0.5">Manage team members and roles</p>
        </div>
        <button className="flex items-center gap-2 bg-[#3ecf8e] hover:bg-[#32b279] text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors">
          <Plus size={14} />
          Invite Member
        </button>
      </div>
      <div className="bg-[#141414] border border-[#242424] rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 px-5 py-3 border-b border-[#242424] text-[10px] font-mono uppercase tracking-widest text-[#555]">
          <span className="col-span-2">Member</span><span className="text-right">Role</span>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-[#444]">
          <Users size={36} className="mb-3 opacity-30" />
          <p className="text-xs font-mono uppercase tracking-widest">No staff members yet</p>
        </div>
      </div>
    </div>
  );
}

/* ── Tab: Settings ──────────────────────────────────────────── */
function SettingsTab({ org }: { org: any }) {
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="font-semibold">Settings</h2>
        <p className="text-xs text-[#555] mt-0.5">Manage your organisation preferences</p>
      </div>

      {[
        {
          title: 'Organisation',
          fields: [
            { label: 'Name', value: org?.name || '' },
            { label: 'Type', value: org?.type || '' },
          ],
        },
        {
          title: 'Danger Zone',
          danger: true,
          fields: [],
        },
      ].map(section => (
        <div
          key={section.title}
          className={`bg-[#141414] border rounded-xl overflow-hidden ${section.danger ? 'border-[#ff5f56]/30' : 'border-[#242424]'}`}
        >
          <div className={`px-5 py-3 border-b text-xs font-mono uppercase tracking-widest ${section.danger ? 'border-[#ff5f56]/20 text-[#ff5f56]' : 'border-[#242424] text-[#555]'}`}>
            {section.title}
          </div>
          <div className="p-5 space-y-4">
            {section.fields.map(f => (
              <div key={f.label} className="flex flex-col gap-1.5">
                <label className="text-xs text-[#666] font-medium">{f.label}</label>
                <input
                  defaultValue={f.value}
                  className="bg-[#0e0e0e] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ecf8e] transition-colors"
                />
              </div>
            ))}
            {section.danger && (
              <button className="flex items-center gap-2 text-xs font-bold text-[#ff5f56] border border-[#ff5f56]/30 bg-[#ff5f56]/5 hover:bg-[#ff5f56]/10 px-4 py-2.5 rounded-lg transition-colors">
                Delete Organisation
              </button>
            )}
            {!section.danger && (
              <button className="flex items-center gap-2 bg-[#3ecf8e] hover:bg-[#32b279] text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors mt-2">
                Save Changes
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
