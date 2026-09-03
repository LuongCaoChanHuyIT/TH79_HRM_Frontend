import {useEffect,useMemo,useState} from 'react';
import {Plus,Search,CalendarClock,FileSignature,Save} from 'lucide-react';
import {api} from '../lib/api';
import {Loading,PageHeader,Badge,Modal,Empty} from '../components/ui';
import {fmtDate,money} from '../lib/format';
import {useAuth} from '../hooks/useAuth';

export default function Contracts(){
  const {has}=useAuth();
  const [d,setD]=useState(null),[types,setTypes]=useState([]),[open,setOpen]=useState(false),[q,setQ]=useState(''),[status,setStatus]=useState('');
  const load=()=>Promise.all([api('/contracts'),api('/contracts/types')]).then(([a,b])=>{setD(a);setTypes(b.items||[])});
  useEffect(()=>{load()},[]);
  const items=useMemo(()=>!d?[]:(d.items||[]).filter(c=>{
    const hay=`${c.employee?.full_name||''} ${c.employee?.employee_code||''} ${c.contract_no||''}`.toLowerCase();
    return (!q||hay.includes(q.toLowerCase()))&&(!status||c.status===status);
  }),[d,q,status]);
  if(!d)return <Loading/>;
  return <>
    <PageHeader eyebrow="HỢP ĐỒNG" title="Quản lý hợp đồng" subtitle="Theo dõi loại hợp đồng, thời hạn, mức lương và trạng thái hiệu lực." actions={has('contract.manage')&&<button className="btn primary" onClick={()=>setOpen(true)}><FileSignature size={17}/> Thêm hợp đồng</button>}/>
    <section className="card filter-card page-filter-card">
      <div className="filters contract-filters">
        <label className="search-box"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tên nhân viên, mã NV, số hợp đồng..."/></label>
        <select value={status} onChange={e=>setStatus(e.target.value)}><option value="">Tất cả trạng thái</option><option value="draft">Nháp</option><option value="active">Hiệu lực</option><option value="expired">Hết hạn</option><option value="terminated">Chấm dứt</option><option value="cancelled">Đã hủy</option></select>
        <button className="btn filter-auto" type="button"><CalendarClock size={16}/> Lọc tự động</button>
      </div>
    </section>
    <section className="card data-card">
      <div className="card-head"><div><h3>Danh sách hợp đồng</h3><p>{items.length} hợp đồng</p></div><span className="internal-data"><CalendarClock/> Theo dõi thời hạn</span></div>
      <div className="table-wrap"><table><thead><tr><th>Nhân viên</th><th>Số hợp đồng</th><th>Loại hợp đồng</th><th>Thời hạn</th><th>Lương cơ bản</th><th>Trạng thái</th></tr></thead><tbody>{items.map(c=><tr key={c.id??c._id}><td><strong>{c.employee?.full_name||`NV #${c.employee_id}`}</strong><small className="block">{c.employee?.employee_code||'—'}</small></td><td>{c.contract_no||'—'}</td><td>{c.contract_type_name||'—'}</td><td>{fmtDate(c.start_date)} {c.end_date?`→ ${fmtDate(c.end_date)}`:'→ Không thời hạn'}</td><td>{c.base_salary?money(c.base_salary):'—'}</td><td><Badge value={c.status}/></td></tr>)}</tbody></table>{!items.length&&<Empty title="Chưa có hợp đồng chi tiết" detail="Tạo hợp đồng để theo dõi thời hạn, lương và tình trạng hiệu lực."/>}</div>
    </section>
    <Modal open={open} onClose={()=>setOpen(false)} title="Thêm hợp đồng lao động"><ContractForm types={types} done={()=>{setOpen(false);load()}}/></Modal>
  </>;
}

function ContractForm({types,done}){
  const [emps,setEmps]=useState([]),[f,setF]=useState({employee_id:'',contract_type_id:types[0]?.id||'',contract_no:'',signed_date:'',start_date:'',end_date:'',base_salary:'',allowance_amount:'',status:'draft',note:''});
  useEffect(()=>{api('/employees?limit=100').then(r=>setEmps(r.items||[]))},[]);
  useEffect(()=>{if(!f.contract_type_id&&types[0]?.id)setF(x=>({...x,contract_type_id:types[0].id}))},[types]);
  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  const submit=async e=>{e.preventDefault();await api('/contracts',{method:'POST',body:JSON.stringify(f)});done()};
  return <form className="form-stack modal-form" onSubmit={submit}>
    <label>Nhân viên <b>*</b><select required value={f.employee_id} onChange={e=>set('employee_id',e.target.value)}><option value="">-- Chọn nhân viên --</option>{emps.map(x=><option key={x.id??x._id} value={x.id??x._id}>{x.employee_code} · {x.full_name}</option>)}</select></label>
    <div className="two-col"><label>Loại hợp đồng <b>*</b><select required value={f.contract_type_id} onChange={e=>set('contract_type_id',e.target.value)}><option value="">-- Chọn loại --</option>{types.map(x=><option value={x.id} key={x.id??x._id}>{x.contract_type_name}</option>)}</select></label><label>Số hợp đồng<input value={f.contract_no} onChange={e=>set('contract_no',e.target.value)} placeholder="Ví dụ: HĐLĐ-001/2026"/></label></div>
    <div className="two-col"><label>Ngày ký<input type="date" value={f.signed_date} onChange={e=>set('signed_date',e.target.value)}/></label><label>Ngày bắt đầu <b>*</b><input required type="date" value={f.start_date} onChange={e=>set('start_date',e.target.value)}/></label></div>
    <div className="two-col"><label>Ngày kết thúc<input type="date" value={f.end_date} onChange={e=>set('end_date',e.target.value)}/></label><label>Lương cơ bản<input type="number" min="0" value={f.base_salary} onChange={e=>set('base_salary',e.target.value)}/></label></div>
    <div className="two-col"><label>Phụ cấp<input type="number" min="0" value={f.allowance_amount} onChange={e=>set('allowance_amount',e.target.value)}/></label><label>Trạng thái<select value={f.status} onChange={e=>set('status',e.target.value)}><option value="draft">Nháp</option><option value="active">Hiệu lực</option><option value="expired">Hết hạn</option><option value="terminated">Chấm dứt</option></select></label></div>
    <label>Ghi chú<textarea rows="3" value={f.note} onChange={e=>set('note',e.target.value)}/></label>
    <div className="modal-actions"><button type="button" className="btn" onClick={done}>Hủy</button><button className="btn primary"><Save size={16}/> Lưu hợp đồng</button></div>
  </form>;
}
