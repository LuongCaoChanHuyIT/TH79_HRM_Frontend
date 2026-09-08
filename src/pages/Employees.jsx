import {useEffect,useMemo,useState} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {Plus,Search,Upload,Download,FileSpreadsheet,Eye,Pencil,FolderOpen,Trash2,AlertTriangle,UsersRound} from 'lucide-react';
import {api,qs} from '../lib/api';
import {Loading,PageHeader,Badge,Empty,Modal,Toast} from '../components/ui';
import {useAuth} from '../hooks/useAuth';
import {entityId,entityKey} from '../lib/format';

export default function Employees(){
  const {has,user}=useAuth();
  const nav=useNavigate();
  const [params]=useSearchParams();
  const [look,setLook]=useState(null);
  const [data,setData]=useState(null);
  const [error,setError]=useState('');
  const [reload,setReload]=useState(0);
  const [selected,setSelected]=useState(()=>new Set());
  const [deleteDialog,setDeleteDialog]=useState(null);
  const [deleteText,setDeleteText]=useState('');
  const [busyDelete,setBusyDelete]=useState(false);
  const [toast,setToast]=useState(null);
  const [f,setF]=useState({
    q:params.get('q')||'',status:params.get('status')||'',branch_id:params.get('branch_id')||'',department_id:params.get('department_id')||'',position_id:params.get('position_id')||'',doc:params.get('doc')||'',page:1,limit:20
  });

  useEffect(()=>{let active=true;api('/employees/lookups').then(r=>active&&setLook(r)).catch(e=>active&&setError(e.message));return()=>{active=false}},[]);
  useEffect(()=>{
    let active=true;
    const t=setTimeout(()=>api('/employees'+qs(f)).then(r=>{if(active){setData(r);setError('');setSelected(new Set())}}).catch(e=>active&&setError(e.message)),160);
    return()=>{active=false;clearTimeout(t)};
  },[f,reload]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(null),3600);return()=>clearTimeout(t)},[toast]);

  const notify=(message,tone='success')=>setToast({message,tone,key:Date.now()});
  const downloadBlob=async(path,name)=>{try{const blob=await api(path);const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href)}catch(e){setError(e.message);notify(e.message,'error')}};
  if(!data||!look)return <Loading/>;

  const rows=data.items||[];
  const visibleIds=rows.map(entityId).filter(Boolean).map(String);
  const allVisible=visibleIds.length>0&&visibleIds.every(id=>selected.has(id));
  const openEmployee=row=>{const id=entityId(row);if(!id){setError(`Hồ sơ ${row?.full_name||''} chưa có định danh hợp lệ.`);return}nav(`/employees/${encodeURIComponent(id)}`)};
  const options=(rows,label,prefix)=>(rows||[]).map((x,i)=>{const id=entityId(x);return <option key={entityKey(x,`${prefix}-${i}`)} value={id||''}>{x[label]}</option>});
  const toggleAll=()=>setSelected(prev=>{const next=new Set(prev);if(allVisible)visibleIds.forEach(id=>next.delete(id));else visibleIds.forEach(id=>next.add(id));return next});
  const toggle=id=>setSelected(prev=>{const next=new Set(prev);const key=String(id);next.has(key)?next.delete(key):next.add(key);return next});

  const performDelete=async()=>{
    if(!deleteDialog)return;
    setBusyDelete(true);
    try{
      if(deleteDialog.mode==='single'){
        await api(`/employees/${encodeURIComponent(deleteDialog.id)}`,{method:'DELETE'});
      }else if(deleteDialog.mode==='bulk'){
        await api('/employees/bulk-delete',{method:'POST',body:JSON.stringify({ids:[...selected]})});
      }else if(deleteDialog.mode==='all'){
        await api('/employees/delete-all',{method:'POST',body:JSON.stringify({confirmation:deleteText})});
      }
      const message=deleteDialog.mode==='all'?'Đã xóa mềm toàn bộ nhân sự.':deleteDialog.mode==='bulk'?`Đã xóa mềm ${selected.size} nhân viên.`:`Đã xóa mềm hồ sơ ${deleteDialog.name||''}.`;
      notify(message);setDeleteDialog(null);setDeleteText('');setSelected(new Set());setReload(x=>x+1);
    }catch(e){notify(e.message||'Không thể xóa nhân viên.','error')}finally{setBusyDelete(false)}
  };

  return <>
    {toast&&<Toast key={toast.key} message={toast.message} tone={toast.tone} onClose={()=>setToast(null)}/>}    
    <PageHeader eyebrow="NHÂN SỰ" title="Danh sách nhân sự" subtitle="Quản lý hồ sơ, ngày nhận việc, hợp đồng thử việc và giấy tờ nhân viên." actions={<>
      <button className="btn ghost" onClick={()=>downloadBlob('/employees/export/csv','TH79_NhanSu.csv')}><Download/> Xuất CSV</button>
      {has('employee.import')&&<button className="btn ghost" onClick={()=>downloadBlob('/employees/import/template','TH79_Mau_NhanSu.xlsx')}><FileSpreadsheet/> Tải mẫu Excel</button>}
      {has('employee.import')&&<Link className="btn ghost excel-action" to="/employees/import"><Upload/> Cập nhật bằng Excel</Link>}
      {has('employee.delete')&&user?.isSuperAdmin&&<button className="btn danger" onClick={()=>{setDeleteText('');setDeleteDialog({mode:'all'})}}><Trash2/> Xóa tất cả</button>}
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

      {has('employee.delete')&&selected.size>0&&<div className="bulk-action-bar"><span><UsersRound/> Đã chọn <strong>{selected.size}</strong> nhân viên</span><div><button className="btn ghost small" onClick={()=>setSelected(new Set())}>Bỏ chọn</button><button className="btn danger small" onClick={()=>setDeleteDialog({mode:'bulk'})}><Trash2/> Xóa đã chọn</button></div></div>}

      <div className="table-wrap">
        <table className="employee-table employee-table-selectable">
          <thead><tr>{has('employee.delete')&&<th className="select-col"><input type="checkbox" checked={allVisible} onChange={toggleAll} aria-label="Chọn tất cả trang hiện tại"/></th>}<th>Nhân viên</th><th>Chi nhánh</th><th>Phòng ban</th><th>Chức vụ</th><th>Ngày nhận việc</th><th>HĐ thử việc</th><th>Liên hệ</th><th>Hồ sơ</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>{rows.map((e,i)=>{const id=entityId(e);return <tr key={entityKey(e,`employee-${i}`)} className={selected.has(String(id))?'row-selected':''}>
            {has('employee.delete')&&<td className="select-col"><input type="checkbox" checked={selected.has(String(id))} onChange={()=>id&&toggle(id)} aria-label={`Chọn ${e.full_name}`}/></td>}
            <td><button className="person-cell person-link" onClick={()=>openEmployee(e)}><span className="mini-avatar">{initials(e.full_name)}</span><span><strong>{e.full_name}</strong><small>{e.employee_code}</small></span></button></td>
            <td><strong className="cell-main">{e.branch_name||'Chưa phân chi nhánh'}</strong></td>
            <td><strong className="cell-main">{e.department_name||'Chưa phân phòng ban'}</strong></td>
            <td>{e.position_name||'—'}</td><td><strong className="cell-main">{fmtDate(e.join_date)}</strong></td>
            <td><strong className="cell-main">{fmtDate(e.probation_end_date)}</strong><small className="block">{e.probation_end_date?'Theo dõi hạn thử việc':'Chưa nhập ngày hết hạn'}</small></td>
            <td><strong className="cell-main">{e.phone||'Chưa có SĐT'}</strong><small className="block">{e.email||'Chưa có email'}</small></td>
            <td><span className="doc-count"><FolderOpen/> {e.document_completed||0}/{e.document_total||0} giấy tờ</span></td><td><Badge value={e.employment_status}/></td>
            <td><div className="row-actions"><button className="icon-button small" title="Xem hồ sơ" onClick={()=>openEmployee(e)}><Eye/></button>{has('employee.update')&&<button className="icon-button small" title="Chỉnh sửa" onClick={()=>id&&nav(`/employees/${encodeURIComponent(id)}/edit`)}><Pencil/></button>}{has('employee.delete')&&<button className="icon-button small danger-icon" title="Xóa nhân viên" onClick={()=>id&&setDeleteDialog({mode:'single',id,name:e.full_name})}><Trash2/></button>}</div></td>
          </tr>})}</tbody>
        </table>
        {!rows.length&&<Empty/>}
      </div>

      <div className="pagination"><span>Trang {data.page}/{Math.max(1,data.pages)} · {data.total} kết quả</span><div><button disabled={data.page<=1} onClick={()=>setF({...f,page:f.page-1})}>‹</button><button disabled={data.page>=data.pages} onClick={()=>setF({...f,page:f.page+1})}>›</button></div></div>
    </section>

    <Modal open={Boolean(deleteDialog)} onClose={()=>!busyDelete&&setDeleteDialog(null)} title={deleteDialog?.mode==='all'?'Xóa toàn bộ nhân sự':deleteDialog?.mode==='bulk'?'Xóa nhân sự đã chọn':'Xóa hồ sơ nhân viên'}>
      <div className="delete-employees-dialog">
        <div className="danger-confirm-icon"><AlertTriangle/></div>
        <div><strong>{deleteDialog?.mode==='all'?'Thao tác ảnh hưởng toàn bộ danh sách nhân sự':deleteDialog?.mode==='bulk'?`Bạn đang xóa ${selected.size} nhân viên`:deleteDialog?.name}</strong><p>Hệ thống thực hiện <b>xóa mềm</b>: hồ sơ, file Cloudinary, hợp đồng và lịch sử không bị xóa vật lý để phục vụ đối soát/khôi phục.</p></div>
        {deleteDialog?.mode==='all'&&<label className="confirm-phrase">Nhập <b>XOA TAT CA NHAN SU</b> để xác nhận<input value={deleteText} onChange={e=>setDeleteText(e.target.value)} placeholder="XOA TAT CA NHAN SU"/></label>}
        <div className="modal-actions"><button className="btn ghost" onClick={()=>setDeleteDialog(null)} disabled={busyDelete}>Hủy</button><button className="btn danger" onClick={performDelete} disabled={busyDelete||(deleteDialog?.mode==='all'&&deleteText.trim().toUpperCase()!=='XOA TAT CA NHAN SU')}><Trash2/> {busyDelete?'Đang xóa...':'Xác nhận xóa'}</button></div>
      </div>
    </Modal>
  </>;
}

function fmtDate(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('vi-VN')}
function initials(name=''){return name.trim().split(/\s+/).slice(-2).map(x=>x[0]).join('').toUpperCase()||'NV'}
