import {useEffect,useState} from 'react';
import {Search,ArrowRight,LayoutDashboard,Users,Workflow,ChartNoAxesCombined,FileText,Settings} from 'lucide-react';
import {api} from '../lib/api';
import {useNavigate} from 'react-router-dom';
import {entityId,entityKey} from '../lib/format';

const commands=[
  ['Dashboard','/',LayoutDashboard],
  ['Hồ sơ nhân sự','/employees',Users],
  ['Onboarding & hội nhập','/onboarding',Workflow],
  ['People Analytics','/analytics',ChartNoAxesCombined],
  ['Báo cáo','/reports',FileText],
  ['Hệ thống','/system',Settings]
];

export default function CommandPalette({open,onClose}){
  const [q,setQ]=useState('');
  const [people,setPeople]=useState([]);
  const nav=useNavigate();

  useEffect(()=>{
    if(!open){setQ('');setPeople([]);return;}
    let active=true;
    const t=setTimeout(()=>{
      if(q.trim().length>=2){
        api(`/employees?q=${encodeURIComponent(q)}&limit=6`)
          .then(r=>active&&setPeople(r.items||[]))
          .catch(()=>active&&setPeople([]));
      }else setPeople([]);
    },220);
    return()=>{active=false;clearTimeout(t)};
  },[q,open]);

  if(!open)return null;
  const go=p=>{nav(p);onClose()};

  return <div className="command-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <div className="command-box">
      <div className="command-input"><Search size={22}/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm nhân viên hoặc nhập chức năng..."/><kbd>ESC</kbd></div>
      <div className="command-scroll">
        {people.length>0&&<>
          <div className="command-section">NHÂN VIÊN</div>
          {people.map((p,i)=>{
            const id=entityId(p);
            return <button key={entityKey(p,`cmd-person-${i}`)} disabled={!id} onClick={()=>id&&go(`/employees/${encodeURIComponent(id)}`)}>
              <span className="mini-avatar">{p.full_name?.slice(-1)}</span>
              <span><strong>{p.full_name}</strong><small>{p.employee_code} · {p.position_name||'Chưa có chức vụ'} · {p.branch_name||'Chưa có chi nhánh'}</small></span>
              <ArrowRight size={17}/>
            </button>;
          })}
        </>}
        <div className="command-section">ĐIỀU HƯỚNG NHANH</div>
        {commands.filter(c=>!q||c[0].toLowerCase().includes(q.toLowerCase())).map(([label,path,Icon])=><button key={path} onClick={()=>go(path)}><span className="cmd-icon"><Icon size={18}/></span><strong>{label}</strong><ArrowRight size={17}/></button>)}
      </div>
    </div>
  </div>;
}
