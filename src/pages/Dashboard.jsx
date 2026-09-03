import {useEffect,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {
  Users,BadgeCheck,Clock3,Files,Workflow,Inbox,BrainCircuit,ArrowUpRight,
  Sparkles,FileClock,FolderOpen,FileWarning,ChevronRight,
  Building2,CircleCheck,ShieldCheck,Command,Activity,ArrowRight
} from 'lucide-react';
import {api} from '../lib/api';
import {Loading,StatCard,Badge} from '../components/ui';
import {useAuth} from '../hooks/useAuth';
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid} from 'recharts';

function greeting(){
  const h=new Date().getHours();
  if(h<11)return 'Chào buổi sáng';
  if(h<14)return 'Chào buổi trưa';
  if(h<18)return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export default function Dashboard(){
  const [d,setD]=useState(null);
  const nav=useNavigate();
  const {has,user}=useAuth();

  useEffect(()=>{api('/dashboard').then(setD)},[]);
  if(!d)return <Loading/>;

  const s=d.stats;
  const smart=d.smartAlerts||{counts:{},items:[],total:0,urgent:0};
  const docs=d.documentProgress||{percent:0,completed:0,missing:0};
  const displayName=user?.full_name||user?.username||'Admin';
  const today=new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date());

  return <>
    <section className="control-center-hero">
      <div className="control-center-copy">
        <span className="control-center-kicker"><Sparkles/> TH79 PEOPLE OS · CONTROL CENTER</span>
        <h1>{greeting()}, {displayName}</h1>
        <p>Nhân sự, hồ sơ và các việc cần xử lý hôm nay được gom trong một không gian điều hành duy nhất.</p>
        <div className="control-center-status">
          <span className="online"><i/> Hệ thống ổn định</span>
          <span><ShieldCheck/> Không gian dữ liệu nội bộ</span>
          <span><Activity/> {today}</span>
        </div>
      </div>
      <div className="control-center-actions">
        <button type="button" className="control-command" onClick={()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true}))}>
          <span className="control-command-icon"><Command/></span>
          <span><small>AI COMMAND</small><strong>Hỏi Copilot hoặc tìm nhanh</strong></span>
          <kbd>Ctrl K</kbd>
        </button>
        {has('employee.create')&&<Link className="btn primary control-add" to="/employees/new"><Users/> Thêm nhân viên</Link>}
      </div>
      <div className="control-center-pulse">
        <div><small>Workforce</small><strong>{s.total}</strong><span>nhân sự</span></div>
        <div><small>Action Queue</small><strong>{smart.total||0}</strong><span>việc theo dõi</span></div>
        <div><small>Data Quality</small><strong>{s.dataQuality||0}</strong><span>/100</span></div>
      </div>
    </section>

    <div className="stats-grid four dashboard-stats dashboard-stats-v9">
      <StatCard icon={Users} label="Tổng nhân sự" value={s.total} detail="Hồ sơ đang lưu trong hệ thống"/>
      <StatCard icon={BadgeCheck} label="Nhân viên chính thức" value={s.active} detail="Nhân viên đã chính thức" detailClass="positive" tone="green"/>
      <StatCard icon={Clock3} label="Nhân viên thử việc" value={s.probation} detail="Theo dõi hạn hợp đồng thử việc" tone="violet"/>
      <StatCard icon={Files} label="Thiếu hồ sơ" value={s.missing_docs||0} detail="Nhân sự còn thiếu giấy tờ" detailClass="warning" tone="amber"/>
    </div>

    <section className="modern-hr-hub modern-hr-hub-v9">
      <Link className="modern-hub-card workflow" to="/onboarding"><span><Workflow/></span><div><small>WORKFLOW</small><strong>Onboarding</strong><p>{d.onboardingSummary?.in_progress||0} đang thực hiện · {d.onboardingSummary?.progress||0}% tiến độ</p></div><ArrowUpRight/></Link>
      {has('employee.update')&&<Link className="modern-hub-card selfservice" to="/self-service/requests"><span><Inbox/></span><div><small>SELF-SERVICE</small><strong>Yêu cầu nhân viên</strong><p>{d.pendingSelfService||0} yêu cầu đang chờ duyệt</p></div><ArrowUpRight/></Link>}
      {has('report.view')&&<Link className="modern-hub-card analytics" to="/analytics"><span><BrainCircuit/></span><div><small>PEOPLE INTELLIGENCE</small><strong>Data Quality {s.dataQuality}/100</strong><p>{d.anomalyCount||0} phát hiện cần kiểm tra</p></div><ArrowUpRight/></Link>}
    </section>

    <section className="smart-alert-center card" id="smart-alert-center">
      <div className="smart-alert-head">
        <div>
          <span className="smart-alert-kicker"><Sparkles/> SMART ACTION CENTER</span>
          <h2>Việc cần xử lý</h2>
          <p>Hệ thống tự gom các cảnh báo quan trọng theo mức độ ưu tiên.</p>
        </div>
        <div className={`smart-alert-score ${smart.urgent>0?'danger':'good'}`}>
          <strong>{smart.total||0}</strong>
          <span>việc cần theo dõi</span>
          {smart.urgent>0?<small><b>{smart.urgent}</b> ưu tiên cao</small>:<small><CircleCheck/> Không có việc khẩn</small>}
        </div>
      </div>
      <div className="smart-alert-metrics">
        <button onClick={()=>nav('/employees?status=probation')}><span className="smart-metric-icon violet"><Clock3/></span><span><small>Thử việc</small><strong>{smart.counts?.probation||0}</strong></span></button>
        <button onClick={()=>nav('/contracts')}><span className="smart-metric-icon blue"><FileClock/></span><span><small>Hợp đồng</small><strong>{smart.counts?.contract||0}</strong></span></button>
        <button onClick={()=>nav('/employees?doc=missing')}><span className="smart-metric-icon amber"><FolderOpen/></span><span><small>Thiếu hồ sơ</small><strong>{smart.counts?.missing_docs||0}</strong></span></button>
        <button onClick={()=>nav('/employees')}><span className="smart-metric-icon rose"><FileWarning/></span><span><small>Giấy tờ hết hạn</small><strong>{smart.counts?.document_expiry||0}</strong></span></button>
      </div>
      <div className="smart-alert-list">
        {(smart.items||[]).map((item,i)=><button key={`${item.type||'alert'}-${item.employee_id||i}-${i}`} className={`smart-alert-item ${item.severity||'info'}`} onClick={()=>item.href&&nav(item.href)}>
          <span className="smart-alert-item-icon"><FolderOpen/></span>
          <span className="smart-alert-item-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
          <span className="smart-alert-item-level">{item.severity==='danger'?'Ưu tiên cao':item.severity==='warning'?'Cần xử lý':'Theo dõi'}</span>
          <ChevronRight/>
        </button>)}
        {!(smart.items||[]).length&&<div className="smart-alert-empty"><CircleCheck/><div><strong>Mọi thứ đang ổn</strong><span>Chưa có cảnh báo nhân sự cần xử lý ngay.</span></div></div>}
      </div>
    </section>

    <div className="dashboard-grid dashboard-main-grid">
      <section className="card chart-card">
        <div className="card-head"><div><h3>Nhân sự theo chi nhánh</h3><p>Phân bổ nhân sự đang hoạt động</p></div><span className="card-filter"><Building2/> Hiện tại</span></div>
        <div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={d.branchChart||[]} margin={{top:10,right:8,left:-18,bottom:4}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:11}} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{fontSize:11}} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="value" radius={[7,7,0,0]} fill="#2f6bff"/></BarChart></ResponsiveContainer></div>
      </section>

      <section className="card document-progress-card">
        <div className="card-head"><div><h3>Tiến độ hồ sơ</h3><p>SYLL, KSK, CCCD và văn bằng</p></div><button className="link-btn" onClick={()=>nav('/employees?doc=missing')}>Xem chi tiết</button></div>
        <div className="document-progress-body">
          <div className="quality-ring" style={{'--score':`${Math.max(0,Math.min(100,docs.percent||0))*3.6}deg`}}><div className="quality-ring-center"><strong>{docs.percent||0}%</strong><small>Hoàn thiện</small></div></div>
          <div className="document-progress-stats">
            <div className="document-progress-row ok"><span><i/>Đã số hóa</span><strong>{docs.completed||0}<small>/{docs.total||0} hồ sơ</small></strong></div>
            <div className="document-progress-row missing"><span><i/>Còn thiếu</span><strong>{docs.missing||0}<small> hồ sơ</small></strong></div>
            <div className="document-progress-row people"><span><Users/>Nhân sự còn thiếu</span><strong>{docs.missingEmployees||0}<small> người</small></strong></div>
          </div>
        </div>
      </section>
    </div>

    <div className="dashboard-grid dashboard-bottom-grid">
      <section className="card workforce-status-card">
        <div className="card-head"><div><h3>Tình trạng nhân sự</h3><p>Theo trạng thái làm việc</p></div><Link className="link-btn" to="/employees">Xem tất cả</Link></div>
        <div className="workforce-status-total"><strong>{s.total}</strong><span>Tổng nhân sự</span></div>
        <div className="workforce-status-row probation"><span>Nhân viên thử việc</span><strong>{s.probation||0}</strong></div>
        <div className="workforce-status-row active"><span>Nhân viên chính thức</span><strong>{s.active||0}</strong></div>
      </section>

      <section className="card recent-employees-card">
        <div className="card-head"><div><h3>Nhân viên gần đây</h3><p>Sắp xếp theo ngày vào làm</p></div><Link className="link-btn" to="/employees">Danh sách nhân sự</Link></div>
        <div className="table-wrap"><table className="dashboard-recent-table"><thead><tr><th>Nhân viên</th><th>Chức vụ</th><th>Chi nhánh</th><th>Ngày nhận việc</th><th>Trạng thái</th><th></th></tr></thead><tbody>
          {(d.recentEmployees||[]).map((e,i)=><tr key={`${e.id||e._id||e.employee_code||i}`}><td><button className="person-link" onClick={()=>nav(`/employees/${encodeURIComponent(e.id||e._id||e.employee_code)}`)}><span className="mini-avatar">{String(e.full_name||'?').split(/\s+/).slice(-2).map(x=>x[0]).join('').toUpperCase()}</span><span><strong>{e.full_name}</strong><small>{e.employee_code}</small></span></button></td><td>{e.position_name||'—'}</td><td>{e.branch_name||'—'}</td><td>{e.join_date?new Date(e.join_date).toLocaleDateString('vi-VN'):'—'}</td><td><Badge value={e.employment_status}/></td><td><button className="icon-button small" onClick={()=>nav(`/employees/${encodeURIComponent(e.id||e._id||e.employee_code)}`)}><ArrowRight/></button></td></tr>)}
        </tbody></table></div>
      </section>
    </div>
  </>;
}
