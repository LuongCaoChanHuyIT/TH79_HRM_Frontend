import {NavLink} from 'react-router-dom';
import {House,Users,Plus,Activity,UserRound,Workflow} from 'lucide-react';
import {useAuth} from '../hooks/useAuth';

function Item({to,label,Icon,end=false}){
  return <NavLink to={to} end={end} className={({isActive})=>`mobile-bottom-item ${isActive?'active':''}`}>
    <span><Icon/></span>
    <small>{label}</small>
  </NavLink>;
}

export default function MobileBottomNav(){
  const {has,user}=useAuth();
  const centerTo=has('employee.create')?'/employees/new':'/onboarding';
  const CenterIcon=has('employee.create')?Plus:Workflow;
  const activityTo=has('audit.view')?'/activity':'/onboarding';
  const meTo=user?.employee_id?'/me':'/system';

  return <nav className="mobile-bottom-nav" aria-label="Điều hướng nhanh trên điện thoại">
    <Item to="/" end label="Tổng quan" Icon={House}/>
    <Item to="/employees" label="Nhân sự" Icon={Users}/>
    <NavLink to={centerTo} className="mobile-bottom-primary" aria-label={has('employee.create')?'Thêm nhân viên':'Mở Onboarding'}>
      <span><CenterIcon/></span>
    </NavLink>
    <Item to={activityTo} label="Hoạt động" Icon={Activity}/>
    <Item to={meTo} label="Cá nhân" Icon={UserRound}/>
  </nav>;
}
