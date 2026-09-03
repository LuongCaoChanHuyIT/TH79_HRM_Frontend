import {useEffect,useState} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {Plus,Search,Upload,Download,FileSpreadsheet,Eye,Pencil,FolderOpen} from 'lucide-react';
import {api,qs} from '../lib/api';
import {Loading,PageHeader,Badge,Empty} from '../components/ui';
import {useAuth} from '../hooks/useAuth';
import {entityId,entityKey} from '../lib/format';

export default function Employees(){
  const {has}=useAuth();
  const nav=useNavigate();
  const [params]=useSearchParams();
  const [look,setLook]=useState(null);
  const [data,setData]=useState(null);
  const [error,setError]=useState('');
  const [f,setF]=useState({
    q:params.get('q')||'',
    status:params.get('status')||'',
    branch_id:params.get('branch_id')||'',
    department_id:params.get('department_id')||'',
    position_id:params.get('position_id')||'',
    doc:params.get('doc')||'',
    page:1,limit:20
  });

  useEffect(()=>{
    let active=true;
    api('/employees/lookups').then(r=>active&&setLook(r)).catch(e=>active&&setError(e.message));
    return()=>{active=false};
  },[]);

  useEffect(()=>{
    let active=true;
    const t=setTimeout(()=>{
      api('/employees'+qs(f)).then(r=>{if(active){setData(r);setError('')}}).catch(e=>active&&setError(e.message));
    },160);
    return()=>{active=false;clearTimeout(t)};
  },[f]);

  const downloadBlob=async(path,name)=>{
    try{
      const blob=await api(path);
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);
    }catch(e){setError(e.message)}
  };

  if(!data||!look)return <Loading/>;

  const openEmployee=row=>{
    const id=entityId(row);
    if(!id){setError(`Hồ sơ ${row?.full_name||''} chưa có định danh hợp lệ.`);return;}
    nav(`/employees/${encodeURIComponent(id)}`);
  };

  const options=(rows,label,prefix)=>(rows||[]).map((x,i)=>{
    const id=entityId(x);return <option key={entityKey(x,`${prefix}-${i}`)} value={id||''}>{x[label]}</option>;
  });

  return <>
    <PageHeader eyebrow="NHÂN SỰ" title="Danh sách nhân sự" subtitle="Quản lý hồ sơ, ngày nhận việc, hợp đồng thử việc và giấy tờ nhân viên." actions={<>
      <button className="btn ghost" onClick={()=>downloadBlob('/employees/export/csv','TH79_NhanSu.csv')}><Download/> Xuất CSV</button>
      {has('employee.import')&&<button className="btn ghost" onClick={()=>downloadBlob('/employees/import/template','TH79_Mau_NhanSu.xlsx')}><FileSpreadsheet/> Tải mẫu Excel</button>}
      {has('employee.import')&&<Link className="btn ghost excel-action" to="/employees/import"><Upload/> Cập nhật bằng Excel</Link>}
      {has('employee.create')&&<Link className="btn primary" to="/employees/new"><Plus/> Thêm nhân viên mới</Link>}
    </>}/>

    {error&&<div className="form-error" style={{marginBottom:16}}>{error}</div>}

    <section className="card employee-directory-card">
      <div className="employee-filterbar">
        <label className="search-box"><Search/><input value={f.q} onChange={e=>setF({...f,q:e.target.value,page:1})} placeholder="Tên, mã NV, CCCD, số điện thoại..."/></label>
        <select value={f.branch_id} onChange={e=>setF({...f,branch_id:e.target.value,page:1})}><option value="">Tất cả chi nhánh</option>{options(look.branches,'branch_name','branch')}</select>
        <select value={f.department_id} onChange={e=>setF({...f,department_id:e.target.value,page:1})}><option value="">Tất cả phòng ban</option>{options(look.departments,'department_name','department')}</select>
        <select value={f.position_id} onChange={e=>setF({...f,position_id:e.target.value,page:1})}><option value="">Tất cả chức vụ</option>{options(look.positions,'position_name','position')}</select>
        <select value={f.status} onChange={e=>setF({...f,status:e.target.value,page:1})}><option value="">Tất cả trạng thái</option><option value="active">Nhân viên chính thức</option><option value="probation">Nhân viên thử việc</option><option value="on_leave">Đang nghỉ phép</option><option value="inactive">Ngưng hoạt động</option></select>
        <select value={f.doc} onChange={e=>setF({...f,doc:e.target.value,page:1})}><option value="">Tình trạng hồ sơ</option><option value="missing">Còn thiếu hồ sơ số</option><option value="complete">Đã đủ hồ sơ số</option></select>
      </div>

      <div className="card-head employee-table-head"><div><h3>Nhân viên</h3><p>{data.total} hồ sơ phù hợp</p></div><span className="internal-data"><FolderOpen/> Dữ liệu nội bộ</span></div>

      <div className="table-wrap">
        <table className="employee-table">
          <thead><tr><th>Nhân viên</th><th>Chi nhánh</th><th>Phòng ban</th><th>Chức vụ</th><th>Ngày nhận việc</th><th>HĐ thử việc</th><th>Liên hệ</th><th>Hồ sơ</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>{(data.items||[]).map((e,i)=><tr key={entityKey(e,`employee-${i}`)}>
            <td><button className="person-cell person-link" onClick={()=>openEmployee(e)}><span className="mini-avatar">{initials(e.full_name)}</span><span><strong>{e.full_name}</strong><small>{e.employee_code}</small></span></button></td>
            <td><strong className="cell-main">{e.branch_name||'Chưa phân chi nhánh'}</strong></td>
            <td><strong className="cell-main">{e.department_name||'Chưa phân phòng ban'}</strong></td>
            <td>{e.position_name||'—'}</td>
            <td><strong className="cell-main">{fmtDate(e.join_date)}</strong></td>
            <td><strong className="cell-main">{fmtDate(e.probation_end_date)}</strong><small className="block">{e.probation_end_date?'Theo dõi hạn thử việc':'Chưa nhập ngày hết hạn'}</small></td>
            <td><strong className="cell-main">{e.phone||'Chưa có SĐT'}</strong><small className="block">{e.email||'Chưa có email'}</small></td>
            <td><span className="doc-count"><FolderOpen/> {e.document_completed||0}/{e.document_total||0} giấy tờ</span></td>
            <td><Badge value={e.employment_status}/></td>
            <td><div className="row-actions"><button className="icon-button small" title="Xem hồ sơ" onClick={()=>openEmployee(e)}><Eye/></button>{has('employee.update')&&<button className="icon-button small" title="Chỉnh sửa" onClick={()=>{const id=entityId(e);id&&nav(`/employees/${encodeURIComponent(id)}/edit`)}}><Pencil/></button>}</div></td>
          </tr>)}</tbody>
        </table>
        {!(data.items||[]).length&&<Empty/>}
      </div>

      <div className="pagination"><span>Trang {data.page}/{Math.max(1,data.pages)} · {data.total} kết quả</span><div><button disabled={data.page<=1} onClick={()=>setF({...f,page:f.page-1})}>‹</button><button disabled={data.page>=data.pages} onClick={()=>setF({...f,page:f.page+1})}>›</button></div></div>
    </section>
  </>;
}

function fmtDate(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('vi-VN')}
function initials(name=''){return name.trim().split(/\s+/).slice(-2).map(x=>x[0]).join('').toUpperCase()||'NV'}
