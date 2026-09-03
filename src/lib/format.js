export const fmtDate=v=>v?new Intl.DateTimeFormat('vi-VN').format(new Date(v)):'—';
export const money=v=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(Number(v||0));
export const initials=name=>String(name||'?').trim().split(/\s+/).slice(-2).map(x=>x[0]).join('').toUpperCase();
export const statusLabel=s=>({active:'Chính thức',probation:'Thử việc',on_leave:'Nghỉ phép',resigned:'Đã nghỉ',terminated:'Chấm dứt',inactive:'Ngưng hoạt động',todo:'Chưa làm',done:'Hoàn tất',blocked:'Bị chặn',in_progress:'Đang thực hiện',pending:'Chờ duyệt',approved:'Đã duyệt',rejected:'Từ chối',draft:'Nháp',open:'Đang mở',closed:'Đã đóng'}[s]||s||'—');

// MongoDB migrations may temporarily miss the old numeric MySQL `id`.
// Never build React keys/routes directly from a possibly undefined field.
export const entityId=(row)=>{
  const value=row?.id ?? row?._id;
  if(value===null||value===undefined||value===''||value==='undefined'||value==='null')return null;
  if(typeof value==='object'&&value?.$oid)return String(value.$oid);
  return String(value);
};
export const entityKey=(row,fallback='row')=>entityId(row) ?? row?.employee_code ?? row?.branch_code ?? row?.department_code ?? row?.position_code ?? row?.document_code ?? row?.role_code ?? row?.permission_code ?? `${fallback}-${JSON.stringify(row||{})}`;
