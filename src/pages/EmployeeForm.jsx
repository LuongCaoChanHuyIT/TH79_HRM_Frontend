import {useEffect,useMemo,useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {ArrowLeft,Save,ShieldCheck,Paperclip,UploadCloud,FileText,BriefcaseBusiness,ContactRound,FolderUp} from 'lucide-react';
import {api} from '../lib/api';
import {Loading} from '../components/ui';
import {entityId,entityKey} from '../lib/format';
import {useAuth} from '../hooks/useAuth';

const initial={employee_code:'',full_name:'',gender:'unknown',date_of_birth:'',professional_qualification:'',identity_number:'',permanent_address:'',current_address:'',phone:'',email:'',social_insurance_number:'',social_insurance_status:'unknown',join_date:'',probation_end_date:'',recruitment_decision_no:'',employment_status:'probation',branch_id:'',department_id:'',position_id:'',contract_status_id:'',note:''};

export default function EmployeeForm(){
  const {id}=useParams();
  const edit=Boolean(id);
  const nav=useNavigate();
  const {has}=useAuth();
  const [look,setLook]=useState(null);
  const [form,setForm]=useState(initial);
  const [files,setFiles]=useState({});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [uploadStatus,setUploadStatus]=useState('');

  useEffect(()=>{
    let active=true;
    const invalid=edit&&(!id||id==='undefined'||id==='null');
    if(invalid){setError('Liên kết hồ sơ không hợp lệ.');return()=>{active=false};}
    const jobs=[api('/employees/lookups')];
    if(edit)jobs.push(api(`/employees/${encodeURIComponent(id)}`));
    Promise.all(jobs).then(([l,r])=>{
      if(!active)return;
      setLook(l);
      if(r)setForm({...initial,...normalize(r.employee)});
    }).catch(e=>active&&setError(e.message));
    return()=>{active=false};
  },[id,edit]);

  const requiredDocs=useMemo(()=>((look?.documentTypes||[]).filter(x=>x.is_required===1||x.is_required===true)).slice(0,4),[look]);
  if(!look&&!error)return <Loading/>;
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const uploadDocuments=async employeeId=>{
    const selected=Object.entries(files).filter(([,file])=>file);
    if(!selected.length)return;
    setUploadStatus(`Đang tải ${selected.length} hồ sơ...`);
    for(const [typeId,file] of selected){
      const fd=new FormData();
      fd.append('employee_id',employeeId);
      fd.append('document_type_id',typeId);
      fd.append('file',file);
      await api('/documents/upload',{method:'POST',body:fd});
    }
    setUploadStatus('Đã tải hồ sơ thành công.');
  };

  const submit=async e=>{
    e.preventDefault();setBusy(true);setError('');setUploadStatus('');
    try{
      let employeeId=id;
      if(edit){
        await api(`/employees/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify(form)});
      }else{
        const r=await api('/employees',{method:'POST',body:JSON.stringify(form)});
        employeeId=entityId(r)||r?.id;
        if(!employeeId)throw new Error('Đã tạo hồ sơ nhưng API không trả về mã định danh.');
      }
      if(has('document.upload'))await uploadDocuments(employeeId);
      nav(`/employees/${encodeURIComponent(employeeId)}`);
    }catch(e){setError(e.message)}finally{setBusy(false)}
  };

  const options=(rows,labelKey,prefix)=>(rows||[]).map((x,i)=>{
    const oid=entityId(x);
    return <option key={entityKey(x,`${prefix}-${i}`)} value={oid||''}>{x[labelKey]}</option>;
  });

  return <>
    <div className="employee-form-heading">
      <button className="back-link" type="button" onClick={()=>nav(-1)}><ArrowLeft/> Quay lại</button>
      <h1>{edit?'Chỉnh sửa hồ sơ nhân viên':'Thêm nhân viên mới'}</h1>
      <p>{edit?'Cập nhật thông tin nhân sự và hồ sơ liên quan.':'Nhập thông tin nhân sự và số hoá hồ sơ ngay trong một lần thao tác.'}</p>
    </div>

    <form className="employee-form-layout" onSubmit={submit}>
      <div className="employee-form-main">
        {error&&<div className="form-error">{error}</div>}
        {uploadStatus&&<div className="notice success-panel">{uploadStatus}</div>}

        <section className="card employee-form-card">
          <div className="form-card-title"><div><h3>Thông tin cá nhân</h3><p>Thông tin định danh và liên hệ của nhân viên</p></div><span><ContactRound/></span></div>
          <div className="form-grid two-form-cols">
            <Field label="Họ và tên" required><input required value={form.full_name} onChange={e=>set('full_name',e.target.value)} placeholder="Nguyễn Văn A"/></Field>
            <Field label="Giới tính"><select value={form.gender} onChange={e=>set('gender',e.target.value)}><option value="unknown">Chưa cập nhật</option><option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option></select></Field>
            <Field label="Ngày sinh"><input type="date" value={form.date_of_birth||''} onChange={e=>set('date_of_birth',e.target.value)}/></Field>
            <Field label="Trình độ chuyên môn"><input value={form.professional_qualification||''} onChange={e=>set('professional_qualification',e.target.value)} placeholder="Ví dụ: Đại học Kế toán"/></Field>
            <Field label="CMND/CCCD"><input value={form.identity_number||''} onChange={e=>set('identity_number',e.target.value)} placeholder="Nhập dạng chuỗi số"/></Field>
            <Field label="Số điện thoại"><input value={form.phone||''} onChange={e=>set('phone',e.target.value)} placeholder="09xxxxxxxx"/></Field>
            <Field label="Email"><input type="email" value={form.email||''} onChange={e=>set('email',e.target.value)} placeholder="email@congty.vn"/></Field>
            <Field label="Số BHXH"><input value={form.social_insurance_number||''} onChange={e=>set('social_insurance_number',e.target.value)} placeholder="Số BHXH nếu đã có"/></Field>
            <Field label="Thường trú" wide><textarea value={form.permanent_address||''} onChange={e=>set('permanent_address',e.target.value)} placeholder="Địa chỉ thường trú"/></Field>
            <Field label="Nơi ở hiện tại" wide><textarea value={form.current_address||''} onChange={e=>set('current_address',e.target.value)} placeholder="Địa chỉ hiện tại"/></Field>
          </div>
        </section>

        {has('document.upload')&&<section className="card employee-form-card" id="employee-document-upload">
          <div className="form-card-title"><div><span className="mini-kicker"><FolderUp/> KHO HỒ SƠ SỐ</span><h3>Tải hồ sơ nhân viên</h3><p>Đính kèm PDF hoặc ảnh scan. Hệ thống tự đánh dấu hồ sơ còn thiếu.</p></div><span><FolderUp/></span></div>
          <div className="secure-upload-note"><ShieldCheck/><div><strong>Kho hồ sơ bảo mật đã sẵn sàng</strong><span>Tệp được lưu riêng tư trên Cloudinary và chỉ truy cập qua API có phân quyền.</span></div></div>
          <div className="document-upload-grid">
            {requiredDocs.map((doc,i)=>{
              const docId=entityId(doc)||doc.id||i+1;
              const file=files[docId];
              return <label className={`document-upload-card ${file?'selected':''}`} key={entityKey(doc,`doc-${i}`)}>
                <div className="document-upload-head"><span><FileText/></span><div><strong>{doc.document_name}</strong><small>{file?file.name:'Chưa có hồ sơ — nên tải lên ngay'}</small></div><em>{file?'Đã chọn':'Còn thiếu'}</em></div>
                <div className="document-drop"><UploadCloud/><span><strong>{file?'Đổi file':'Bấm để chọn PDF / ảnh scan'}</strong><small>{file?`${Math.round(file.size/1024)} KB`:'Có thể chọn nhiều file cùng lúc theo từng loại'}</small></span></div>
                <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" hidden onChange={e=>setFiles(x=>({...x,[docId]:e.target.files?.[0]||null}))}/>
              </label>;
            })}
            {!requiredDocs.length&&<div className="empty">Chưa cấu hình loại hồ sơ bắt buộc.</div>}
          </div>
        </section>}

        <section className="card employee-form-card">
          <div className="form-card-title"><div><h3>Thông tin công việc</h3><p>Đơn vị, chức vụ và tình trạng làm việc</p></div><span><BriefcaseBusiness/></span></div>
          <div className="form-grid two-form-cols">
            <Field label="Mã nhân viên"><input value={form.employee_code} onChange={e=>set('employee_code',e.target.value)} placeholder="Tự sinh nếu để trống"/></Field>
            <Field label="Trạng thái"><select value={form.employment_status} onChange={e=>set('employment_status',e.target.value)}><option value="probation">Nhân viên thử việc</option><option value="active">Nhân viên chính thức</option><option value="on_leave">Nghỉ phép</option><option value="resigned">Đã nghỉ việc</option><option value="inactive">Ngưng hoạt động</option></select></Field>
            <Field label="Chi nhánh"><select value={form.branch_id||''} onChange={e=>set('branch_id',e.target.value)}><option value="">Chưa cập nhật</option>{options(look?.branches,'branch_name','branch')}</select></Field>
            <Field label="Phòng ban trực thuộc"><select value={form.department_id||''} onChange={e=>set('department_id',e.target.value)}><option value="">Chưa cập nhật</option>{options(look?.departments,'department_name','department')}</select></Field>
            <Field label="Chức vụ"><select value={form.position_id||''} onChange={e=>set('position_id',e.target.value)}><option value="">Chưa cập nhật</option>{options(look?.positions,'position_name','position')}</select></Field>
            <Field label="Ngày nhận việc"><input type="date" value={form.join_date||''} onChange={e=>set('join_date',e.target.value)}/></Field>
            <Field label="Ngày hết hạn hợp đồng thử việc"><input type="date" value={form.probation_end_date||''} onChange={e=>set('probation_end_date',e.target.value)}/></Field>
            <Field label="Số QĐ tuyển dụng"><input value={form.recruitment_decision_no||''} onChange={e=>set('recruitment_decision_no',e.target.value)} placeholder="Số quyết định"/></Field>
            <Field label="Tình trạng BHXH"><select value={form.social_insurance_status} onChange={e=>set('social_insurance_status',e.target.value)}><option value="unknown">Chưa xác định</option><option value="has_number">Đã có mã</option><option value="not_yet">Chưa có mã</option><option value="external_company">Đóng công ty khác</option></select></Field>
            <Field label="Ghi chú" wide><textarea value={form.note||''} onChange={e=>set('note',e.target.value)} placeholder="Ghi chú nội bộ"/></Field>
          </div>
        </section>
      </div>

      <aside className="employee-form-side">
        <div className="card sticky-employee-create">
          <span className="side-icon"><ShieldCheck/></span>
          <h3>{edit?'Cập nhật hồ sơ':'Tạo hồ sơ mới'}</h3>
          <p>{edit?'Mọi thay đổi sẽ được ghi vào lịch sử hoạt động.':'Thông tin nhân sự và hồ sơ scan được lưu cùng lúc. Checklist sẽ cập nhật sau khi tải file thành công.'}</p>
          <div className="create-checklist">
            {requiredDocs.map((doc,i)=>{const id=entityId(doc)||doc.id||i+1;return <span key={entityKey(doc,`side-${i}`)} className={files[id]?'done':''}><i/>{doc.document_name}</span>})}
          </div>
          {has('document.upload')&&<a className="attach-jump" href="#employee-document-upload"><Paperclip/> Đính kèm hồ sơ <span>PDF / ảnh scan</span></a>}
          <div className="storage-ready"><ShieldCheck/> Kho hồ sơ bảo mật sẵn sàng</div>
          <button className="btn primary create-submit" disabled={busy||Boolean(error&&!look)}><Save/>{busy?'Đang lưu...':edit?'Lưu thay đổi':'Tạo nhân viên'}</button>
          <button type="button" className="btn ghost" onClick={()=>nav(-1)}>Hủy</button>
        </div>
      </aside>
    </form>
  </>;
}

function Field({label,required,wide,children}){return <label className={wide?'wide':''}><span>{label}{required&&' *'}</span>{children}</label>}
function normalize(e){const o={...e};for(const k of ['date_of_birth','join_date','probation_end_date'])if(o[k])o[k]=String(o[k]).slice(0,10);return o}
