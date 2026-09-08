import {forwardRef,useEffect,useRef,useState} from 'react';
import {Calculator,CalendarDays,Download,Eye,FileText,Plus,RefreshCw,Save,Settings2,UsersRound,WalletCards,X} from 'lucide-react';
import html2canvas from 'html2canvas';
import {jsPDF} from 'jspdf';
import {api} from '../lib/api';
import {Loading,PageHeader,Badge,Modal,Empty,Toast} from '../components/ui';
import {money} from '../lib/format';
import {useAuth} from '../hooks/useAuth';

export default function Payroll(){
  const {has}=useAuth();
  const [summary,setSummary]=useState(null);
  const [activeId,setActiveId]=useState('');
  const [detail,setDetail]=useState(null);
  const [openPeriod,setOpenPeriod]=useState(false);
  const [openSettings,setOpenSettings]=useState(false);
  const [payslip,setPayslip]=useState(null);
  const [editItem,setEditItem]=useState(null);
  const [busy,setBusy]=useState(false);
  const [toast,setToast]=useState(null);

  const notify=(message,tone='success')=>setToast({message,tone,key:Date.now()});
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(null),3600);return()=>clearTimeout(t)},[toast]);

  const loadSummary=async(selectNewest=false)=>{
    const r=await api('/payroll');setSummary(r);
    if(selectNewest||!activeId){const first=(r.periods||[])[0];if(first)setActiveId(periodKey(first))}
  };
  useEffect(()=>{loadSummary(true).catch(e=>notify(e.message,'error'))},[]);
  useEffect(()=>{if(!activeId){setDetail(null);return}setDetail(null);api(`/payroll/periods/${encodeURIComponent(activeId)}`).then(setDetail).catch(e=>notify(e.message,'error'))},[activeId]);

  const reloadDetail=async()=>{if(!activeId)return;const r=await api(`/payroll/periods/${encodeURIComponent(activeId)}`);setDetail(r);await loadSummary(false)};
  const periods=summary?.periods||[];

  const saveItem=async(item,patch)=>{
    const id=item.manage_id||item.id;
    if(!id)return notify('Dòng lương chưa có định danh hợp lệ.','error');
    try{
      const r=await api(`/payroll/periods/${encodeURIComponent(activeId)}/items/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify(patch)});
      setDetail(d=>{
        const nextItems=(d?.items||[]).map(x=>(x.manage_id||x.id)===(item.manage_id||item.id)?{...x,...r.item,employee:x.employee}:x);
        const totals=nextItems.reduce((a,x)=>{a.gross+=Number(x.gross_salary)||0;a.deduction+=Number(x.total_deduction)||0;a.net+=Number(x.net_salary)||0;return a},{gross:0,deduction:0,net:0});
        return {...d,items:nextItems,period:{...d.period,total_employee:nextItems.length,total_gross:totals.gross,total_deduction:totals.deduction,total_net:totals.net}};
      });
      loadSummary(false).catch(()=>{});
      return true;
    }catch(e){notify(e.message,'error');reloadDetail().catch(()=>{});return false}
  };
  const localPatch=(item,patch)=>setDetail(d=>({...d,items:(d.items||[]).map(x=>(x.manage_id||x.id)===(item.manage_id||item.id)?{...x,...patch}:x)}));

  const syncEmployees=async()=>{setBusy(true);try{const r=await api(`/payroll/periods/${encodeURIComponent(activeId)}/sync-employees`,{method:'POST'});notify(r.message);await reloadDetail()}catch(e){notify(e.message,'error')}finally{setBusy(false)}};
  const recalculate=async()=>{setBusy(true);try{const r=await api(`/payroll/periods/${encodeURIComponent(activeId)}/recalculate`,{method:'POST'});notify(r.message);await reloadDetail()}catch(e){notify(e.message,'error')}finally{setBusy(false)}};
  const openPayslip=async item=>{try{const id=item.manage_id||item.id;const r=await api(`/payroll/periods/${encodeURIComponent(activeId)}/items/${encodeURIComponent(id)}/payslip`);setPayslip(r)}catch(e){notify(e.message,'error')}};

  if(!summary)return <Loading/>;
  const period=detail?.period;
  const items=detail?.items||[];

  return <>
    {toast&&<Toast key={toast.key} message={toast.message} tone={toast.tone} onClose={()=>setToast(null)}/>}    
    <PageHeader eyebrow="TIỀN LƯƠNG" title="Bảng lương & phiếu lương" subtitle="Tự động lấy nhân sự và cấu hình lương, kế toán nhập ngày công rồi hệ thống tính gross, khấu trừ và thực lãnh." actions={<>
      {has('payroll.manage')&&<button className="btn ghost" onClick={()=>setOpenSettings(true)}><Settings2/> Cấu hình khấu trừ</button>}
      {has('payroll.manage')&&<button className="btn primary" onClick={()=>setOpenPeriod(true)}><Plus/> Tạo kỳ lương</button>}
    </>}/>

    <section className="payroll-period-strip">
      {periods.map(p=><button key={periodKey(p)} className={`payroll-period-card ${String(activeId)===String(periodKey(p))?'active':''}`} onClick={()=>setActiveId(periodKey(p))}>
        <span><CalendarDays/></span><div><strong>{p.salary_name||`Bảng lương ${p.salary_month}/${p.salary_year}`}</strong><small>{p.salary_code||''}</small></div><em>{p.total_employee||0} NV</em>
      </button>)}
      {!periods.length&&<div className="card payroll-empty-period"><WalletCards/><div><strong>Chưa có kỳ lương</strong><span>Tạo kỳ lương mới để hệ thống tự nạp danh sách nhân sự.</span></div></div>}
    </section>

    {period&&<>
      <section className="payroll-summary-grid">
        <PayrollStat label="Nhân sự" value={items.length} icon={UsersRound}/>
        <PayrollStat label="Tổng Gross" value={money(period.total_gross)} icon={WalletCards}/>
        <PayrollStat label="Khấu trừ" value={money(period.total_deduction)} icon={Calculator}/>
        <PayrollStat label="Thực lãnh" value={money(period.total_net)} icon={Save}/>
      </section>

      <section className="card payroll-workspace">
        <div className="card-head payroll-workspace-head"><div><h3>{period.salary_name}</h3><p>Công chuẩn {period.standard_work_days||26} ngày · nhập công và điều chỉnh khấu trừ trực tiếp trong bảng.</p></div><div className="payroll-tools">
          <span className="internal-data">Mặc định pháp lý {detail?.settings?.effective_year||2026}</span>
          {has('payroll.manage')&&<button className="btn ghost small" disabled={busy} onClick={syncEmployees}><UsersRound/> Đồng bộ nhân sự</button>}
          {has('payroll.manage')&&<button className="btn primary small" disabled={busy} onClick={recalculate}><RefreshCw/> Tính lại theo quy định</button>}
        </div></div>

        <div className="payroll-policy-note"><Settings2/><span><strong>Khấu trừ tự động:</strong> BHXH {detail?.settings?.bhxh_employee_rate||0}% · BHYT {detail?.settings?.bhyt_employee_rate||0}% · BHTN {detail?.settings?.bhtn_employee_rate||0}% · giảm trừ bản thân {money(detail?.settings?.personal_deduction)} · người phụ thuộc {money(detail?.settings?.dependent_deduction)}. Các khoản trên có thể chỉnh tay từng nhân viên trước khi duyệt.</span></div>

        <div className="table-wrap payroll-table-wrap"><table className="payroll-detail-table">
          <thead><tr><th>Nhân viên</th><th>Trạng thái</th><th>Lương chính thức</th><th>Lương thử việc</th><th>Mức áp dụng</th><th>Công chuẩn</th><th>Ngày công</th><th>Lương theo công</th><th>Phụ cấp</th><th>Gross</th><th>BHXH</th><th>BHYT</th><th>BHTN</th><th>TNCN</th><th>Khấu trừ khác</th><th>Thực lãnh</th><th>Phiếu lương</th></tr></thead>
          <tbody>{items.map(item=><PayrollRow key={item.manage_id||item.id} item={item} canEdit={has('payroll.manage')} localPatch={patch=>localPatch(item,patch)} save={patch=>saveItem(item,patch)} openPayslip={()=>openPayslip(item)} openEditor={()=>setEditItem(item)}/>)}</tbody>
        </table>{!items.length&&<Empty title="Kỳ lương chưa có nhân viên" detail="Bấm Đồng bộ nhân sự để nạp danh sách hiện tại."/>}</div>
      </section>
    </>}

    <Modal open={openPeriod} onClose={()=>setOpenPeriod(false)} title="Tạo kỳ lương"><PeriodForm done={async id=>{setOpenPeriod(false);if(!id)return;await loadSummary(false);setActiveId(String(id));notify('Đã tạo kỳ lương và tự nạp nhân sự.')}} onCancel={()=>setOpenPeriod(false)}/></Modal>
    <Modal open={openSettings} onClose={()=>setOpenSettings(false)} title="Cấu hình khấu trừ & thuế" wide><SettingsForm initial={detail?.settings} done={async()=>{setOpenSettings(false);notify('Đã lưu cấu hình khấu trừ.');if(activeId)await reloadDetail()}} onCancel={()=>setOpenSettings(false)}/></Modal>
    <Modal open={Boolean(editItem)} onClose={()=>setEditItem(null)} title={`Chi tiết lương — ${editItem?.employee?.full_name||''}`} wide>
      {editItem&&<PayrollItemForm item={editItem} onCancel={()=>setEditItem(null)} done={async patch=>{const ok=await saveItem(editItem,patch);if(ok){setEditItem(null);notify('Đã cập nhật chi tiết lương.')}}}/>}
    </Modal>
    <PayslipModal data={payslip} onClose={()=>setPayslip(null)} notify={notify}/>
  </>;
}

function PayrollRow({item,canEdit,localPatch,save,openPayslip,openEditor}){
  const e=item.employee||{};
  const num=(field,value)=>{localPatch({[field]:value});};
  const commit=(field,value)=>save({[field]:Number(value)||0});
  return <tr className={item.manual_deductions?'manual-deduction-row':''}>
    <td className="payroll-person"><strong>{e.full_name||`NV #${item.employee_id}`}</strong><small>{e.employee_code||''} · {e.position_name||'Chưa có chức vụ'}</small></td>
    <td><Badge value={e.employment_status}/></td>
    <td className="money-cell">{money(item.base_salary)}</td><td className="money-cell">{money(item.probation_salary)}</td><td className="money-cell applied"><strong>{money(item.applied_salary)}</strong></td>
    <td className="center-cell">{item.standard_work_days}</td>
    <td>{canEdit?<input className="payroll-number days" type="number" min="0" step="0.5" value={item.actual_work_days??0} onChange={e=>num('actual_work_days',e.target.value)} onBlur={e=>commit('actual_work_days',e.target.value)}/>:item.actual_work_days}</td>
    <td className="money-cell">{money(item.salary_by_work_days)}</td><td className="money-cell">{money(item.allowance_total)}</td><td className="money-cell gross"><strong>{money(item.gross_salary)}</strong></td>
    {['social_insurance_employee','health_insurance_employee','unemployment_insurance_employee','personal_income_tax','other_deduction'].map(field=><td key={field}>{canEdit?<input className="payroll-number deduction" type="number" min="0" step="1000" value={item[field]??0} onChange={e=>num(field,e.target.value)} onBlur={e=>commit(field,e.target.value)}/>:money(item[field])}</td>)}
    <td className="money-cell net"><strong>{money(item.net_salary)}</strong>{item.manual_deductions&&<small>Đã chỉnh tay</small>}</td>
    <td><div className="row-actions">{canEdit&&<button className="icon-button small" title="Chỉnh chi tiết lương, OT, thưởng" onClick={openEditor}><Calculator/></button>}<button className="icon-button small" title="Xem phiếu lương" onClick={openPayslip}><Eye/></button><button className="icon-button small" title="Xem và tải PDF" onClick={openPayslip}><Download/></button>{canEdit&&item.manual_deductions&&<button className="icon-button small" title="Trả về khấu trừ tự động" onClick={()=>save({force_auto:true,manual_deductions:false})}><RefreshCw/></button>}</div></td>
  </tr>;
}


function PayrollItemForm({item,done,onCancel}){
  const [f,setF]=useState({
    actual_work_days:item.actual_work_days??0,
    allowance_total:item.allowance_total??0,
    overtime_hours:item.overtime_hours??0,
    overtime_pay:item.overtime_pay??0,
    bonus:item.bonus??0,
    other_income:item.other_income??0,
    tax_dependents:item.tax_dependents??0,
    social_insurance_employee:item.social_insurance_employee??0,
    health_insurance_employee:item.health_insurance_employee??0,
    unemployment_insurance_employee:item.unemployment_insurance_employee??0,
    personal_income_tax:item.personal_income_tax??0,
    other_deduction:item.other_deduction??0,
    note:item.note||''
  });
  const [busy,setBusy]=useState(false);
  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  const submit=async e=>{e.preventDefault();setBusy(true);try{await done(f)}finally{setBusy(false)}};
  return <form className="form-stack payroll-item-editor" onSubmit={submit}>
    <div className="payroll-editor-banner"><Calculator/><span><strong>{item.employee?.full_name||`NV #${item.employee_id}`}</strong><small>Lương chính thức {money(item.base_salary)} · thử việc {money(item.probation_salary)} · mức đang áp dụng {money(item.applied_salary)}</small></span></div>
    <div className="three-col">
      <label>Ngày công thực tế<input type="number" min="0" step="0.5" value={f.actual_work_days} onChange={e=>set('actual_work_days',e.target.value)}/></label>
      <label>Phụ cấp kỳ này<input type="number" min="0" step="1000" value={f.allowance_total} onChange={e=>set('allowance_total',e.target.value)}/></label>
      <label>Số người phụ thuộc<input type="number" min="0" step="1" value={f.tax_dependents} onChange={e=>set('tax_dependents',e.target.value)}/></label>
      <label>Giờ ngoài giờ<input type="number" min="0" step="0.5" value={f.overtime_hours} onChange={e=>set('overtime_hours',e.target.value)}/></label>
      <label>Tiền ngoài giờ<input type="number" min="0" step="1000" value={f.overtime_pay} onChange={e=>set('overtime_pay',e.target.value)}/></label>
      <label>Thưởng<input type="number" min="0" step="1000" value={f.bonus} onChange={e=>set('bonus',e.target.value)}/></label>
      <label>Thu nhập khác<input type="number" min="0" step="1000" value={f.other_income} onChange={e=>set('other_income',e.target.value)}/></label>
    </div>
    <div className="payroll-editor-section"><strong>Khấu trừ — được phép chỉnh tay</strong><small>Nếu thay đổi các ô dưới đây, dòng lương sẽ chuyển sang chế độ khấu trừ thủ công cho đến khi bấm “Tính lại theo quy định”.</small></div>
    <div className="three-col">
      <label>BHXH<input type="number" min="0" step="1000" value={f.social_insurance_employee} onChange={e=>set('social_insurance_employee',e.target.value)}/></label>
      <label>BHYT<input type="number" min="0" step="1000" value={f.health_insurance_employee} onChange={e=>set('health_insurance_employee',e.target.value)}/></label>
      <label>BHTN<input type="number" min="0" step="1000" value={f.unemployment_insurance_employee} onChange={e=>set('unemployment_insurance_employee',e.target.value)}/></label>
      <label>Thuế TNCN<input type="number" min="0" step="1000" value={f.personal_income_tax} onChange={e=>set('personal_income_tax',e.target.value)}/></label>
      <label>Khấu trừ khác<input type="number" min="0" step="1000" value={f.other_deduction} onChange={e=>set('other_deduction',e.target.value)}/></label>
    </div>
    <label>Ghi chú<textarea rows="3" value={f.note} onChange={e=>set('note',e.target.value)} placeholder="Ghi chú kỳ lương, truy thu, nghỉ không lương..."/></label>
    <div className="modal-actions"><button type="button" className="btn ghost" onClick={onCancel} disabled={busy}>Hủy</button><button className="btn primary" disabled={busy}><Save/> {busy?'Đang lưu...':'Lưu & tính lại'}</button></div>
  </form>;
}

function PayrollStat({label,value,icon:Icon}){return <div className="card payroll-stat"><span><Icon/></span><div><small>{label}</small><strong>{value}</strong></div></div>}

function PeriodForm({done,onCancel}){
  const now=new Date();
  const [f,setF]=useState({month:now.getMonth()+1,year:now.getFullYear(),name:'',salary_code:'',standard_work_days:26,status:'draft',note:''});
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{const r=await api('/payroll/periods',{method:'POST',body:JSON.stringify(f)});done(r.id)}catch(e){setError(e.message)}finally{setBusy(false)}};
  return <form className="form-stack modal-form" onSubmit={submit}>{error&&<div className="form-error">{error}</div>}<div className="two-col"><label>Tháng<input type="number" min="1" max="12" value={f.month} onChange={e=>setF({...f,month:e.target.value})}/></label><label>Năm<input type="number" value={f.year} onChange={e=>setF({...f,year:e.target.value})}/></label></div><label>Tên kỳ lương<input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder={`Bảng lương ${f.month}/${f.year}`}/></label><div className="two-col"><label>Mã kỳ lương<input value={f.salary_code} onChange={e=>setF({...f,salary_code:e.target.value})}/></label><label>Công chuẩn<input type="number" min="1" step="0.5" value={f.standard_work_days} onChange={e=>setF({...f,standard_work_days:e.target.value})}/></label></div><label>Ghi chú<textarea rows="3" value={f.note} onChange={e=>setF({...f,note:e.target.value})}/></label><div className="modal-actions"><button type="button" className="btn" onClick={onCancel} disabled={busy}>Hủy</button><button className="btn primary" disabled={busy}><Plus/> {busy?'Đang tạo...':'Tạo & nạp nhân sự'}</button></div></form>;
}

function SettingsForm({initial,done,onCancel}){
  const defaults=initial||{effective_year:2026,bhxh_employee_rate:8,bhyt_employee_rate:1.5,bhtn_employee_rate:1,personal_deduction:15500000,dependent_deduction:6200000,pit_brackets:[{up_to:10000000,rate:5},{up_to:30000000,rate:10},{up_to:60000000,rate:20},{up_to:100000000,rate:30},{up_to:null,rate:35}]};
  const [f,setF]=useState(()=>JSON.parse(JSON.stringify(defaults)));
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  const save=async e=>{e.preventDefault();setBusy(true);setError('');try{await api('/payroll/settings',{method:'PUT',body:JSON.stringify(f)});done()}catch(e){setError(e.message)}finally{setBusy(false)}};
  return <form className="form-stack payroll-settings-form" onSubmit={save}>{error&&<div className="form-error">{error}</div>}<div className="payroll-settings-note"><Settings2/><span>Mặc định áp dụng cho kỳ tính thuế 2026. Căn cứ đóng bảo hiểm, đối tượng tham gia và khoản thu nhập miễn/giảm thuế có thể khác theo từng nhân viên; kế toán có thể điều chỉnh trước khi duyệt.</span></div><div className="three-col"><label>BHXH người lao động (%)<input type="number" min="0" step="0.1" value={f.bhxh_employee_rate} onChange={e=>set('bhxh_employee_rate',e.target.value)}/></label><label>BHYT người lao động (%)<input type="number" min="0" step="0.1" value={f.bhyt_employee_rate} onChange={e=>set('bhyt_employee_rate',e.target.value)}/></label><label>BHTN người lao động (%)<input type="number" min="0" step="0.1" value={f.bhtn_employee_rate} onChange={e=>set('bhtn_employee_rate',e.target.value)}/></label></div><div className="two-col"><label>Giảm trừ bản thân<input type="number" min="0" step="100000" value={f.personal_deduction} onChange={e=>set('personal_deduction',e.target.value)}/></label><label>Giảm trừ / người phụ thuộc<input type="number" min="0" step="100000" value={f.dependent_deduction} onChange={e=>set('dependent_deduction',e.target.value)}/></label></div><div className="pit-brackets"><strong>Biểu thuế TNCN lũy tiến</strong>{(f.pit_brackets||[]).map((b,i)=><div key={i}><span>Bậc {i+1}</span><label>Đến (đ/tháng)<input type="number" disabled={i===f.pit_brackets.length-1} value={b.up_to??''} onChange={e=>setF(x=>({...x,pit_brackets:x.pit_brackets.map((v,j)=>j===i?{...v,up_to:e.target.value}:v)}))}/></label><label>Thuế suất (%)<input type="number" min="0" step="1" value={b.rate} onChange={e=>setF(x=>({...x,pit_brackets:x.pit_brackets.map((v,j)=>j===i?{...v,rate:e.target.value}:v)}))}/></label></div>)}</div><div className="modal-actions"><button type="button" className="btn" onClick={onCancel}>Hủy</button><button className="btn primary" disabled={busy}><Save/> {busy?'Đang lưu...':'Lưu cấu hình'}</button></div></form>;
}

function PayslipModal({data,onClose,notify}){
  const ref=useRef(null);const [busy,setBusy]=useState(false);
  if(!data)return null;
  const downloadPdf=async()=>{setBusy(true);try{const canvas=await html2canvas(ref.current,{scale:2.2,backgroundColor:'#ffffff',useCORS:true,logging:false});const img=canvas.toDataURL('image/jpeg',0.96);const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});const pageW=210,pageH=297,margin=8;const ratio=Math.min((pageW-margin*2)/canvas.width,(pageH-margin*2)/canvas.height);const w=canvas.width*ratio,h=canvas.height*ratio;pdf.addImage(img,'JPEG',(pageW-w)/2,margin,w,h);const e=data.employee||{},p=data.period||{};pdf.save(`Phieu_luong_${e.employee_code||e.full_name||'nhan_vien'}_${String(p.salary_month||'').padStart(2,'0')}-${p.salary_year||''}.pdf`);notify('Đã tạo file PDF phiếu lương.')}catch(e){notify(e.message||'Không thể tạo PDF.','error')}finally{setBusy(false)}};
  const print=()=>window.print();
  return <div className="payslip-overlay"><div className="payslip-shell"><div className="payslip-toolbar"><strong><FileText/> Phiếu lương</strong><div><button className="btn ghost" onClick={print}>In / Lưu PDF</button><button className="btn primary" disabled={busy} onClick={downloadPdf}><Download/> {busy?'Đang tạo PDF...':'Tải PDF'}</button><button className="icon-button" onClick={onClose}><X/></button></div></div><PayslipDocument ref={ref} data={data}/></div></div>;
}

const PayslipDocument=forwardRef(function PayslipDocument({data},ref){
  const e=data.employee||{},i=data.item||{},p=data.period||{},c=data.company||{};
  return <div className="payslip-document" ref={ref}>
    <div className="payslip-company"><img src="/assets/images/logo-th79.png"/><div><strong>{c.company_name}</strong><span>Địa chỉ: {c.address}</span><span>Email: {c.email||'congtytnhdaututh79@gmail.com'} | Website: {c.website||'daututh79.com'}</span></div><div><span>MST: {c.tax_code}</span><span>{c.phone?`Hotline: ${c.phone}`:''}</span></div></div>
    <h1>PHIẾU LƯƠNG THÁNG {String(p.salary_month||'').padStart(2,'0')}/{p.salary_year}</h1>
    <table className="payslip-info"><tbody>
      <tr><td><b>Họ Tên NV:</b> {e.full_name||'—'}</td><td><b>Mã NV:</b> {e.employee_code||e.id||'—'}</td></tr>
      <tr><td><b>Chức Danh:</b> {e.position_name||'—'}</td><td><b>STK:</b> {e.bank_account_number||'—'} {e.bank_name?`(${e.bank_name})`:''}</td></tr>
      <tr><td><b>Nhận Việc:</b> {dateVN(e.join_date)}</td><td><b>Ngày công chuẩn:</b> {i.standard_work_days||0}</td></tr>
      <tr><td><b>Công thực tế:</b> {i.actual_work_days||0}</td><td><b>Các khoản khấu trừ:</b></td></tr>
      <tr><td><b>Lương áp dụng:</b> {money(i.applied_salary)}</td><td><b>BHXH</b><span>{money(i.social_insurance_employee)}</span></td></tr>
      <tr><td><b>Lương theo công:</b> {money(i.salary_by_work_days)}</td><td><b>BHYT</b><span>{money(i.health_insurance_employee)}</span></td></tr>
      <tr><td><b>Phụ cấp:</b> {money(i.allowance_total)}</td><td><b>BHTN</b><span>{money(i.unemployment_insurance_employee)}</span></td></tr>
      <tr><td><b>Lương ngoài giờ:</b> {money(i.overtime_pay)}</td><td><b>Thuế TNCN</b><span>{money(i.personal_income_tax)}</span></td></tr>
      <tr><td><b>Thưởng / thu nhập khác:</b> {money((Number(i.bonus)||0)+(Number(i.other_income)||0))}</td><td><b>Khấu trừ khác</b><span>{money(i.other_deduction)}</span></td></tr>
      <tr className="payslip-net"><td colSpan="2"><b>Thực lĩnh</b><strong>{money(i.net_salary)}</strong></td></tr>
    </tbody></table>
    <div className="payslip-foot"><span>Phiếu lương được xuất từ hệ thống HRM T&H 79.</span><span>Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</span></div>
  </div>;
});

function periodKey(p){return String(p.manage_id||p.id||p._id||'')}
function dateVN(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('vi-VN')}
