import {NavLink} from 'react-router-dom';
import {
  LayoutDashboard,Users,Workflow,FileSignature,WalletCards,UserSearch,
  GraduationCap,ScrollText,Settings2,UserRound,ClipboardCheck,
  FileBarChart,Files,Building2,ChevronRight,BarChart3
} from 'lucide-react';
import {useAuth} from '../hooks/useAuth';

const management=[
  ['/', 'Tổng quan', LayoutDashboard, 'dashboard.view'],
  ['/employees', 'Nhân sự', Users, 'employee.view'],
  ['/onboarding', 'Onboarding', Workflow, 'employee.view', 'NEW'],
  ['/contracts', 'Hợp đồng', FileSignature, 'contract.view'],
  ['/payroll', 'Tiền lương', WalletCards, 'payroll.view'],
  ['/recruitment', 'Tuyển dụng', UserSearch, 'recruitment.view'],
  ['/training', 'Đào tạo', GraduationCap, 'training.view'],
  ['/reports', 'Báo cáo', FileBarChart, 'report.view'],
  ['/analytics', 'People Analytics', BarChart3, 'report.view', 'AI']
];

const support=[
  ['/employees?doc=missing', 'Hồ sơ còn thiếu', Files, 'document.view'],
  ['/self-service/requests', 'Duyệt yêu cầu', ClipboardCheck, 'employee.update'],
  ['/activity', 'Lịch sử hoạt động', ScrollText, 'audit.view'],
  ['/system', 'Hệ thống', Settings2, 'organization.view']
];

function NavGroup({items,has,onMobileClose}){
  return <nav className="sidebar-nav">
    {items.filter(x=>!x[3]||has(x[3])).map(([to,label,Icon,,tag])=><NavLink
      key={to}
      to={to}
      end={to==='/' }
      className={({isActive})=>`nav-item ${isActive?'active':''}`}
      onClick={onMobileClose}
    >
      <Icon/>
      <span>{label}</span>
      {tag&&<em className="nav-new">{tag}</em>}
      {!tag&&to==='/employees'&&<span className="nav-arrow">›</span>}
    </NavLink>)}
  </nav>;
}

export default function Sidebar({mobileOpen,onMobileClose}){
  const {has,user}=useAuth();
  return <aside className={`sidebar ${mobileOpen?'mobile-open':''}`}>
    <NavLink className="brand brand-with-logo" to="/" onClick={onMobileClose} aria-label="T&H 79 HRM">
      <img className="brand-logo" src="/assets/images/logo-th79.png" alt="Công ty TNHH Đầu tư T&H 79"/>
    </NavLink>

    <div className="sidebar-label">QUẢN LÝ</div>
    <NavGroup items={management} has={has} onMobileClose={onMobileClose}/>

    <div className="sidebar-label sidebar-label-space">HỖ TRỢ & HỆ THỐNG</div>
    <NavGroup items={support} has={has} onMobileClose={onMobileClose}/>

    <div className="sidebar-footer">
      {user?.employee_id&&<NavLink className="self-service-link" to="/me" onClick={onMobileClose}>
        <span><UserRound/></span>
        <div><strong>Cổng cá nhân</strong><small>Hồ sơ & yêu cầu của tôi</small></div>
        <ChevronRight/>
      </NavLink>}
      <div className="mini-company">
        <span className="mini-icon"><Building2/></span>
        <div><strong>T&H 79</strong><small>Quản trị nhân sự nội bộ</small></div>
      </div>
    </div>
  </aside>;
}
