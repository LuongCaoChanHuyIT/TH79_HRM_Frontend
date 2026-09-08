import {LoaderCircle,CheckCircle2,TriangleAlert} from 'lucide-react';
import {statusLabel} from '../lib/format';

export function Loading({label='Đang tải dữ liệu...'}){
  return <div className="loading"><LoaderCircle className="spin" size={28}/><span>{label}</span></div>;
}

export function PageHeader({eyebrow,title,subtitle,actions}){
  return <div className="page-heading page-header">
    <div>
      {eyebrow&&<span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {subtitle&&<p>{subtitle}</p>}
    </div>
    {actions&&<div className="page-actions">{actions}</div>}
  </div>;
}

export function StatCard({icon:Icon,label,value,detail,tone='blue',detailClass=''}){
  const normalized=tone==='purple'?'violet':tone==='orange'?'amber':tone;
  return <article className={`stat-card stat-card-${normalized}`}>
    <span className={`stat-icon ${normalized}`} aria-hidden="true">{Icon&&<Icon/>}</span>
    <div className="stat-content">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className={`stat-note ${detailClass}`}>{detail||'Dữ liệu đang lưu trong hệ thống'}</span>
    </div>
  </article>;
}

export function Badge({value,tone}){
  const s=String(value||'');
  const t=tone||(/danger|blocked|rejected|terminated/.test(s)?'danger':/warning|probation|pending|todo/.test(s)?'warning':/active|done|approved|completed/.test(s)?'success':'neutral');
  return <span className={`badge ${t}`}>{statusLabel(s)}</span>;
}

export function Empty({title='Chưa có dữ liệu',detail='Không có bản ghi phù hợp với điều kiện hiện tại.'}){
  return <div className="empty"><strong>{title}</strong><span>{detail}</span></div>;
}

export function Modal({open,title,onClose,children,wide=false}){
  if(!open)return null;
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <div className={`modal ${wide?'wide':''}`}>
      <div className="modal-head"><h3>{title}</h3><button className="icon-button" type="button" onClick={onClose}>×</button></div>
      <div className="modal-body">{children}</div>
    </div>
  </div>;
}


export function Toast({message,tone='success',onClose}){
  if(!message)return null;
  return <div className={`app-toast ${tone==='error'?'error':''}`} role="status" aria-live="polite">
    {tone==='error'?<TriangleAlert/>:<CheckCircle2/>}
    <span>{message}</span>
    <button type="button" onClick={onClose} aria-label="Đóng thông báo">×</button>
  </div>;
}
