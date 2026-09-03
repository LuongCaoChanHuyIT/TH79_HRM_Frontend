import {useEffect,useMemo,useState} from 'react';
import {Search,ShieldCheck,SlidersHorizontal} from 'lucide-react';
import {api} from '../lib/api';
import {Loading,PageHeader,Empty} from '../components/ui';
import {useAuth} from '../hooks/useAuth';

export default function Activity(){
  const {user}=useAuth();
  const [d,setD]=useState(null),[q,setQ]=useState(''),[module,setModule]=useState(''),[action,setAction]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState('');
  useEffect(()=>{api('/activity').then(setD)},[]);
  const items=useMemo(()=>!d?[]:(d.items||[]).filter(x=>{
    const hay=`${x.description||''} ${x.user_name||''} ${x.module||''} ${x.action||''} ${x.request_url||''}`.toLowerCase();
    const dt=x.created_at?new Date(x.created_at):null;
    return(!q||hay.includes(q.toLowerCase()))&&(!module||x.module===module)&&(!action||x.action===action)&&(!from||!dt||dt>=new Date(`${from}T00:00:00`))&&(!to||!dt||dt<=new Date(`${to}T23:59:59`));
  }),[d,q,module,action,from,to]);
  if(!d)return <Loading/>;
  const modules=[...new Set((d.items||[]).map(x=>x.module).filter(Boolean))].sort();
  const actions=[...new Set((d.items||[]).map(x=>x.action).filter(Boolean))].sort();
  return <>
    <PageHeader eyebrow="KIỂM SOÁT HỆ THỐNG" title="Lịch sử hoạt động" subtitle="Theo dõi tài khoản đang truy cập, trang đang mở và các thao tác chỉnh sửa dữ liệu."/>
    <section className="card active-session-card"><div className="card-head"><div><h3>Đang hoạt động</h3><p>Tài khoản có hoạt động trong phiên hiện tại</p></div><span className="online-pill"><i/> 1 đang online</span></div><div className="active-session-list"><div className="active-session"><span className="mini-avatar">{String(user?.username||'A').slice(0,1).toUpperCase()}</span><div><strong>{user?.username||'admin'}</strong><small>{user?.email||'Tài khoản HRM'} · Đang xem HRM</small></div><time>{new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</time></div></div></section>
    <section className="card audit-filter-card"><div className="audit-filters"><label className="search-box"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tài khoản, mô tả, URL..."/></label><select value={module} onChange={e=>setModule(e.target.value)}><option value="">Tất cả module</option>{modules.map(x=><option key={x}>{x}</option>)}</select><select value={action} onChange={e=>setAction(e.target.value)}><option value="">Tất cả hành động</option>{actions.map(x=><option key={x}>{x}</option>)}</select><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/><input type="date" value={to} onChange={e=>setTo(e.target.value)}/><button className="btn filter-auto"><SlidersHorizontal size={16}/> Lọc tự động</button></div></section>
    <section className="card data-card"><div className="card-head"><div><h3>Nhật ký thao tác</h3><p>{items.length} bản ghi</p></div><span className="internal-data"><ShieldCheck/> Audit log</span></div><div className="table-wrap"><table><thead><tr><th>Thời gian</th><th>Người dùng</th><th>Hành động</th><th>Đối tượng</th><th>Chi tiết</th><th>IP / URL</th></tr></thead><tbody>{items.map((x,i)=>{const dt=x.created_at?new Date(x.created_at):null;return <tr key={x.id??x._id??i}><td><strong>{dt?.toLocaleDateString('vi-VN')||'—'}</strong><small className="block">{dt?.toLocaleTimeString('vi-VN')||''}</small></td><td><strong>{x.user_name||'Hệ thống'}</strong><small className="block">{x.employee_name||x.module||''}</small></td><td><span className="audit-action">{x.action||'—'}</span><small className="block">{x.module||''}</small></td><td><strong>{x.record_type||'—'}</strong><small className="block">{x.record_id?`#${x.record_id}`:'—'}</small></td><td>{x.description||'—'}</td><td><strong>{x.ip_address||'—'}</strong><small className="block url-cell">{x.request_url||'—'}</small></td></tr>})}</tbody></table>{!items.length&&<Empty title="Không có bản ghi phù hợp"/>}</div></section>
  </>;
}
