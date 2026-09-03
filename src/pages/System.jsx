import {useEffect,useMemo,useState} from 'react';
import {
  Building2,Users,ShieldCheck,History,Plus,ArrowUpRight,Edit3,Trash2,
  Search,UserRound,AlertTriangle,Save,KeyRound,X
} from 'lucide-react';
import {api} from '../lib/api';
import {Loading,PageHeader,Modal} from '../components/ui';
import {useAuth} from '../hooks/useAuth';
import {useNavigate} from 'react-router-dom';

export default function System(){
  const {has,user}=useAuth();
  const nav=useNavigate();
  const [org,setOrg]=useState(null),[users,setUsers]=useState(null),[roles,setRoles]=useState(null),[activity,setActivity]=useState(null);
  const [tab,setTab]=useState('overview'),[open,setOpen]=useState(null),[feedback,setFeedback]=useState(null);

  const load=()=>{
    has('organization.view')&&api('/system/organization').then(setOrg);
    has('user.view')&&api('/system/users').then(setUsers);
    has('role.view')&&api('/system/roles').then(setRoles);
    has('audit.view')&&api('/activity?limit=10').then(setActivity).catch(()=>{});
  };

  useEffect(()=>{load()},[]);
  useEffect(()=>{
    if(!feedback)return;
    const t=setTimeout(()=>setFeedback(null),3500);
    return()=>clearTimeout(t);
  },[feedback]);

  const done=(message)=>{
    setOpen(null);
    setFeedback({type:'success',message:message||'Đã cập nhật dữ liệu.'});
    load();
  };

  if(!org&&!users&&!roles&&!activity)return <Loading/>;

  return <>
    <PageHeader eyebrow="HỆ THỐNG" title="Cấu hình & phân quyền" subtitle="Quản lý cơ cấu tổ chức, tài khoản đăng nhập, vai trò và lịch sử thao tác." actions={<>
      {has('employee.import')&&<button className="btn ghost" onClick={()=>nav('/employees/import')}>Cập nhật Excel</button>}
      {has('employee.create')&&<button className="btn primary" onClick={()=>nav('/employees/new')}>Thêm nhân viên</button>}
      {has('audit.view')&&<button className="btn ghost" onClick={()=>nav('/activity')}><History/> Lịch sử hoạt động</button>}
    </>}/>

    {feedback&&<div className={`system-feedback ${feedback.type||'success'}`}><span>{feedback.message}</span><button onClick={()=>setFeedback(null)} aria-label="Đóng"><X/></button></div>}

    <div className="system-cards system-overview-cards">
      {org&&<button className={tab==='org'?'active':''} onClick={()=>setTab('org')}><span className="stat-icon blue"><Building2/></span><span><strong>Cơ cấu tổ chức</strong><small>Chi nhánh, phòng ban và chức vụ.<br/>{org.branches.length} chi nhánh · {org.departments.length} phòng ban · {org.positions.length} chức vụ</small></span><ArrowUpRight/></button>}
      {users&&<button className={tab==='users'?'active':''} onClick={()=>setTab('users')}><span className="stat-icon purple"><Users/></span><span><strong>Tài khoản đăng nhập</strong><small>Tạo, sửa, khóa, liên kết nhân viên và cấp quyền.<br/>{users.items.length} tài khoản đang quản lý</small></span><ArrowUpRight/></button>}
      {roles&&<button className={tab==='roles'?'active':''} onClick={()=>setTab('roles')}><span className="stat-icon green"><ShieldCheck/></span><span><strong>Vai trò & phân quyền</strong><small>Phân quyền chi tiết theo từng module.<br/>{roles.roles.length} vai trò trong hệ thống</small></span><ArrowUpRight/></button>}
      {has('audit.view')&&<button onClick={()=>nav('/activity')}><span className="stat-icon amber"><History/></span><span><strong>Lịch sử hoạt động</strong><small>Kiểm soát đăng nhập và dữ liệu đã chỉnh sửa.<br/>Audit log & phiên truy cập</small></span><ArrowUpRight/></button>}
    </div>

    {tab==='overview'&&<SystemOverview users={users} activity={activity} onUsers={()=>setTab('users')} onActivity={()=>nav('/activity')}/>} 
    {tab==='org'&&org&&<Organization org={org} canManage={has('organization.manage')} open={setOpen}/>} 
    {tab==='users'&&users&&<UsersTable data={users} canManage={has('user.manage')} currentUser={user} open={setOpen}/>} 
    {tab==='roles'&&roles&&<RolesTable data={roles} canManage={has('role.manage')} open={setOpen}/>} 

    <Modal open={Boolean(open)} onClose={()=>setOpen(null)} title={open?.title||''} wide={open?.kind==='user'}>
      {open?.kind==='org'&&<OrgForm type={open.type} initial={open.item||null} done={()=>done(open.item?'Đã cập nhật cơ cấu tổ chức.':'Đã thêm mới cơ cấu tổ chức.')}/>} 
      {open?.kind==='delete-org'&&<DeleteOrgConfirm type={open.type} item={open.item} label={open.label} done={()=>done(`Đã xóa ${open.label.toLowerCase()} thành công.`)} cancel={()=>setOpen(null)}/>} 
      {open?.kind==='user'&&<UserForm roles={roles?.roles||[]} initial={open.user||null} done={done}/>} 
      {open?.kind==='delete-user'&&<DeleteUserConfirm user={open.user} done={done} cancel={()=>setOpen(null)}/>} 
      {open?.kind==='role'&&<RoleForm permissions={roles?.permissions||[]} done={()=>done('Đã lưu vai trò và phân quyền.')}/>} 
    </Modal>
  </>;
}

function SystemOverview({users,activity,onUsers,onActivity}){
  return <div className="system-overview-grid">
    <section className="card recent-accounts"><div className="card-head"><div><h3>Tài khoản gần đây</h3><p>Hoạt động đăng nhập mới nhất</p></div>{users&&<button className="link-btn" onClick={onUsers}>Quản lý</button>}</div><div className="table-wrap"><table><thead><tr><th>Tài khoản</th><th>Nhân viên</th><th>Đăng nhập gần nhất</th></tr></thead><tbody>{(users?.items||[]).slice(0,6).map((u,i)=><tr key={u.manage_id??u.id??u.username??i}><td><strong>{u.username}</strong><small className="block">{u.email}</small></td><td>{u.employee_name||'Không liên kết'}</td><td>{u.last_login_at?new Date(u.last_login_at).toLocaleString('vi-VN'):'—'}</td></tr>)}</tbody></table></div></section>
    <section className="card recent-activity"><div className="card-head"><div><h3>Hoạt động mới nhất</h3><p>10 thao tác gần đây</p></div>{activity&&<button className="link-btn" onClick={onActivity}>Xem tất cả</button>}</div><div className="recent-activity-list">{(activity?.items||[]).slice(0,10).map((x,i)=><div key={x.id??`${x.created_at}-${i}`}><span className="activity-mini-icon"><History/></span><span><strong>{x.description||`${x.module} · ${x.action}`}</strong><small>{x.user_name||'Hệ thống'} · {x.created_at?new Date(x.created_at).toLocaleString('vi-VN'):'—'}</small></span></div>)}</div></section>
  </div>;
}

function Organization({org,canManage,open}){
  const groups=[
    {key:'branches',title:'Chi nhánh',nameKey:'branch_name',codeKey:'branch_code'},
    {key:'departments',title:'Phòng ban',nameKey:'department_name',codeKey:'department_code'},
    {key:'positions',title:'Chức vụ',nameKey:'position_name',codeKey:'position_code'}
  ];
  return <div className="org-grid">{groups.map(group=><section className="card org-management-card" key={group.key}>
    <div className="card-head"><div><h3>{group.title}</h3><p>{org[group.key].length} mục</p></div>{canManage&&<button className="btn small ghost" onClick={()=>open({kind:'org',type:group.key,title:`Thêm ${group.title}`})}><Plus/> Thêm</button>}</div>
    <div className="simple-list org-manage-list">{org[group.key].map((x,i)=>{
      const target=x.manage_id??x._id??x.id;
      return <div key={target??`${group.key}-${i}`}>
        <span className="org-item-copy"><strong>{x[group.nameKey]}</strong><small>{x[group.codeKey]||'—'} · ID {x.id??'—'}</small></span>
        <span className="org-item-right">
          <span className={`dot-status ${x.status}`}>{systemStatusLabel(x.status)}</span>
          {canManage&&<span className="org-row-actions">
            <button className="table-action edit" type="button" title={`Sửa ${group.title.toLowerCase()}`} onClick={()=>open({kind:'org',type:group.key,title:`Chỉnh sửa ${group.title}`,item:x})}><Edit3/></button>
            <button className="table-action delete" type="button" title={`Xóa ${group.title.toLowerCase()}`} onClick={()=>open({kind:'delete-org',type:group.key,label:group.title,item:x,title:`Xóa ${group.title}`})}><Trash2/></button>
          </span>}
        </span>
      </div>;
    })}</div>
  </section>)}</div>;
}

function UsersTable({data,canManage,currentUser,open}){
  const currentLegacyId=String(currentUser?.id??'');
  const currentMongoId=String(currentUser?._id??'');
  return <section className="card system-users-card">
    <div className="card-head"><div><h3>Tài khoản hệ thống</h3><p>Quản lý đăng nhập, liên kết nhân viên, vai trò và trạng thái tài khoản.</p></div>{canManage&&<button className="btn primary" onClick={()=>open({kind:'user',title:'Tạo tài khoản mới'})}><Plus/> Thêm tài khoản</button>}</div>
    <div className="table-wrap"><table className="system-users-table"><thead><tr><th>Tài khoản</th><th>Nhân viên</th><th>Vai trò</th><th>Đăng nhập gần nhất</th><th>Trạng thái</th>{canManage&&<th className="actions-col">Thao tác</th>}</tr></thead><tbody>{data.items.map((u,i)=>{
      const manageId=String(u.manage_id??u.id??u._id??'');
      const isSelf=Boolean((currentLegacyId&&String(u.id??'')===currentLegacyId)||(currentMongoId&&manageId===currentMongoId));
      return <tr key={manageId||u.username||i}>
        <td><div className="system-user-identity"><span><UserRound/></span><div><strong>{u.username}</strong><small>{u.email||'Chưa có email'}</small>{u.is_super_admin? <em>Super Admin</em>:null}</div></div></td>
        <td>{u.employee_name||<span className="muted-text">Không liên kết</span>}</td>
        <td>{u.is_super_admin?'Toàn quyền hệ thống':u.roles?.map(r=>r.role_name).join(', ')||'—'}</td>
        <td>{u.last_login_at?new Date(u.last_login_at).toLocaleString('vi-VN'):'—'}</td>
        <td><span className={`dot-status ${u.status}`}>{systemStatusLabel(u.status)}</span></td>
        {canManage&&<td><div className="row-actions">
          <button className="table-action edit" title="Sửa tài khoản" onClick={()=>open({kind:'user',title:`Chỉnh sửa tài khoản ${u.username}`,user:u})}><Edit3/></button>
          <button className="table-action delete" disabled={isSelf} title={isSelf?'Không thể xóa tài khoản đang đăng nhập':'Xóa tài khoản'} onClick={()=>!isSelf&&open({kind:'delete-user',title:'Xóa tài khoản',user:u})}><Trash2/></button>
        </div></td>}
      </tr>;
    })}</tbody></table></div>
    {canManage&&<div className="system-users-note"><ShieldCheck/><span>Để tránh mất quyền quản trị, tài khoản đang đăng nhập và Super Admin cuối cùng được bảo vệ khỏi thao tác xóa.</span></div>}
  </section>;
}

function RolesTable({data,canManage,open}){
  return <section className="card"><div className="card-head"><div><h3>Vai trò & quyền</h3><p>RBAC được giữ nguyên từ hệ thống hiện tại.</p></div>{canManage&&<button className="btn primary" onClick={()=>open({kind:'role',title:'Tạo vai trò'})}><Plus/> Tạo vai trò</button>}</div><div className="role-grid">{data.roles.map((r,i)=><article className="role-card" key={r.id??r.role_code??i}><span className="role-icon"><ShieldCheck/></span><div><small>{r.role_code}</small><h3>{r.role_name}</h3><p>{r.description}</p><strong>{r.permission_ids.length} quyền</strong></div></article>)}</div></section>;
}

function OrgForm({type,initial,done}){
  const singular=type==='branches'?'branch':type==='departments'?'department':'position';
  const nameKey=`${singular}_name`,codeKey=`${singular}_code`;
  const edit=Boolean(initial);
  const [f,setF]=useState({
    [nameKey]:initial?.[nameKey]||'',
    [codeKey]:initial?.[codeKey]||'',
    status:initial?.status||'active'
  });
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  const submit=async e=>{
    e.preventDefault();setBusy(true);setError('');
    try{
      const target=initial?.manage_id??initial?._id??initial?.id;
      await api(edit?`/system/organization/${type}/${encodeURIComponent(target)}`:`/system/organization/${type}`,{
        method:edit?'PUT':'POST',body:JSON.stringify(f)
      });
      done();
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };
  return <form className="form-stack org-editor-form" onSubmit={submit}>
    {error&&<div className="form-error">{error}</div>}
    {edit&&<div className="org-edit-identity"><Building2/><span><strong>{initial?.[nameKey]}</strong><small>ID liên kết: {initial?.id??'—'} · {initial?.[codeKey]}</small></span></div>}
    <label>Tên<input required value={f[nameKey]} onChange={e=>setF({...f,[nameKey]:e.target.value})} placeholder="Nhập tên hiển thị"/></label>
    <div className="two-col">
      <label>Mã<input required value={f[codeKey]} onChange={e=>setF({...f,[codeKey]:e.target.value.toUpperCase()})} placeholder="Ví dụ: CN010"/></label>
      <label>Trạng thái<select value={f.status} onChange={e=>setF({...f,status:e.target.value})}><option value="active">Đang hoạt động</option><option value="inactive">Ngưng hoạt động</option></select></label>
    </div>
    <div className="modal-form-actions"><button className="btn primary" disabled={busy}><Save/>{busy?'Đang lưu...':edit?'Lưu thay đổi':'Thêm mới'}</button></div>
  </form>;
}

function DeleteOrgConfirm({type,item,label,done,cancel}){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const singular=type==='branches'?'branch':type==='departments'?'department':'position';
  const nameKey=`${singular}_name`,codeKey=`${singular}_code`;
  const remove=async()=>{
    setBusy(true);setError('');
    try{
      const target=item?.manage_id??item?._id??item?.id;
      await api(`/system/organization/${type}/${encodeURIComponent(target)}`,{method:'DELETE'});
      done();
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };
  return <div className="delete-user-confirm delete-org-confirm">
    <span className="danger-icon"><AlertTriangle/></span>
    <div><h3>Xác nhận xóa {label.toLowerCase()}?</h3><p><strong>{item?.[nameKey]}</strong> ({item?.[codeKey]}) sẽ bị xóa khỏi danh mục. Nếu đang có nhân viên sử dụng, hệ thống sẽ chặn thao tác để tránh sai dữ liệu.</p></div>
    {error&&<div className="form-error">{error}</div>}
    <div className="confirm-actions"><button className="btn ghost" type="button" onClick={cancel} disabled={busy}>Hủy</button><button className="btn danger" type="button" onClick={remove} disabled={busy}><Trash2/>{busy?'Đang xóa...':'Xóa'}</button></div>
  </div>;
}

function UserForm({roles,initial,done}){
  const edit=Boolean(initial);
  const initialRoles=useMemo(()=>initial?.roles?.map(r=>Number(r.id)).filter(Number.isFinite)||[],[initial]);
  const [f,setF]=useState({
    username:initial?.username||'',email:initial?.email||'',password:'',employee_id:initial?.employee_id||'',
    role_ids:initialRoles,status:initial?.status||'active'
  });
  const [employeeQuery,setEmployeeQuery]=useState(initial?.employee_name||'');
  const [employeeResults,setEmployeeResults]=useState([]);
  const [searching,setSearching]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');

  useEffect(()=>{
    const q=employeeQuery.trim();
    if(q.length<2){setEmployeeResults([]);return;}
    if(initial?.employee_name===q&&String(f.employee_id||'')===String(initial?.employee_id||''))return;
    const t=setTimeout(async()=>{
      setSearching(true);
      try{const r=await api(`/system/users/employee-search?q=${encodeURIComponent(q)}`);setEmployeeResults(r.items||[])}catch{setEmployeeResults([])}finally{setSearching(false)}
    },250);
    return()=>clearTimeout(t);
  },[employeeQuery]);

  const chooseEmployee=e=>{
    setF(x=>({...x,employee_id:e.id??''}));
    setEmployeeQuery(`${e.full_name}${e.employee_code?` · ${e.employee_code}`:''}`);
    setEmployeeResults([]);
  };
  const clearEmployee=()=>{setF(x=>({...x,employee_id:''}));setEmployeeQuery('');setEmployeeResults([])};
  const toggleRole=roleId=>setF(x=>({
    ...x,
    role_ids:x.role_ids.includes(roleId)?x.role_ids.filter(id=>id!==roleId):[...x.role_ids,roleId]
  }));

  const submit=async e=>{
    e.preventDefault();setBusy(true);setError('');
    try{
      const payload={...f,employee_id:f.employee_id||null};
      if(edit&&!payload.password)delete payload.password;
      const target=initial?.manage_id??initial?.id??initial?._id;
      await api(edit?`/system/users/${encodeURIComponent(target)}`:'/system/users',{method:edit?'PUT':'POST',body:JSON.stringify(payload)});
      done(edit?'Đã cập nhật tài khoản thành công.':'Đã tạo tài khoản mới thành công.');
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };

  return <form className="form-stack system-user-form" onSubmit={submit}>
    {error&&<div className="form-error">{error}</div>}
    {initial?.is_super_admin?<div className="user-admin-notice"><ShieldCheck/><span><strong>Tài khoản Super Admin</strong><small>Tài khoản này có toàn quyền hệ thống độc lập với vai trò RBAC.</small></span></div>:null}
    <div className="two-col">
      <label>Tài khoản<input required value={f.username} onChange={e=>setF({...f,username:e.target.value})} autoComplete="off"/></label>
      <label>Email<input type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="email@congty.vn"/></label>
    </div>
    <div className="two-col">
      <label>{edit?'Mật khẩu mới':'Mật khẩu'}<div className="input-with-icon"><KeyRound/><input required={!edit} type="password" value={f.password} onChange={e=>setF({...f,password:e.target.value})} placeholder={edit?'Để trống nếu không đổi':'Tối thiểu 8 ký tự'} autoComplete="new-password"/></div></label>
      <label>Trạng thái<select value={f.status} onChange={e=>setF({...f,status:e.target.value})}><option value="active">Đang hoạt động</option><option value="inactive">Ngưng hoạt động</option><option value="locked">Khóa đăng nhập</option></select></label>
    </div>
    <div className="user-role-field"><div className="role-field-label"><span>Vai trò</span><small>Có thể chọn một hoặc nhiều vai trò cho tài khoản.</small></div><div className="user-role-selector">{roles.length?roles.map((r,i)=>{const roleId=Number(r.id);const selected=Number.isFinite(roleId)&&f.role_ids.includes(roleId);return <button type="button" className={selected?'selected':''} key={r.id??r.role_code??i} onClick={()=>Number.isFinite(roleId)&&toggleRole(roleId)} disabled={!Number.isFinite(roleId)}><span className="role-check">{selected?'✓':''}</span><span><strong>{r.role_name}</strong><small>{r.role_code||`ID ${r.id??'—'}`}</small></span></button>}):<div className="role-selector-empty">Chưa có vai trò khả dụng. Hãy tạo vai trò tại mục Vai trò & phân quyền.</div>}</div>{!f.role_ids.length&&<small className="field-help">Tài khoản chưa được gán vai trò RBAC.</small>}</div>
    <label className="employee-link-field">Liên kết nhân viên
      <div className="employee-search-input"><Search/><input value={employeeQuery} onChange={e=>{setEmployeeQuery(e.target.value);if(!e.target.value)setF(x=>({...x,employee_id:''}))}} placeholder="Tìm theo tên, mã nhân viên hoặc số điện thoại..."/>{(employeeQuery||f.employee_id)&&<button type="button" onClick={clearEmployee}><X/></button>}</div>
      {searching&&<small className="field-help">Đang tìm nhân viên...</small>}
      {employeeResults.length>0&&<div className="employee-search-results">{employeeResults.map((e,i)=><button type="button" key={e.id??i} onClick={()=>chooseEmployee(e)}><span><UserRound/></span><div><strong>{e.full_name}</strong><small>{e.employee_code||'Chưa có mã'} · {e.phone||'Chưa có SĐT'}</small></div></button>)}</div>}
      {f.employee_id&&<small className="field-help success">Đã liên kết với hồ sơ nhân viên ID {f.employee_id}.</small>}
    </label>
    <div className="modal-form-actions"><button type="submit" className="btn primary" disabled={busy}><Save/>{busy?'Đang lưu...':edit?'Lưu thay đổi':'Tạo tài khoản'}</button></div>
  </form>;
}

function DeleteUserConfirm({user,done,cancel}){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const remove=async()=>{
    setBusy(true);setError('');
    try{
      const target=user?.manage_id??user?.id??user?._id;
      await api(`/system/users/${encodeURIComponent(target)}`,{method:'DELETE'});
      done(`Đã xóa tài khoản ${user.username}.`);
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };
  return <div className="delete-user-confirm">
    <span className="danger-icon"><AlertTriangle/></span>
    <div><h3>Xác nhận xóa tài khoản?</h3><p>Tài khoản <strong>{user?.username}</strong> sẽ bị xóa khỏi hệ thống đăng nhập. Hồ sơ nhân viên được liên kết (nếu có) vẫn được giữ nguyên.</p></div>
    {error&&<div className="form-error">{error}</div>}
    <div className="confirm-actions"><button className="btn ghost" type="button" onClick={cancel} disabled={busy}>Hủy</button><button className="btn danger" type="button" onClick={remove} disabled={busy}><Trash2/>{busy?'Đang xóa...':'Xóa tài khoản'}</button></div>
  </div>;
}

function RoleForm({permissions,done}){
  const [f,setF]=useState({role_code:'',role_name:'',description:'',permission_ids:[]}),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const toggle=id=>setF(x=>({...x,permission_ids:x.permission_ids.includes(id)?x.permission_ids.filter(v=>v!==id):[...x.permission_ids,id]}));
  const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{await api('/system/roles',{method:'POST',body:JSON.stringify(f)});done()}catch(err){setError(err.message)}finally{setBusy(false)}};
  return <form className="form-stack" onSubmit={submit}>{error&&<div className="form-error">{error}</div>}<div className="two-col"><label>Mã vai trò<input required value={f.role_code} onChange={e=>setF({...f,role_code:e.target.value})}/></label><label>Tên vai trò<input required value={f.role_name} onChange={e=>setF({...f,role_name:e.target.value})}/></label></div><label>Mô tả<input value={f.description} onChange={e=>setF({...f,description:e.target.value})}/></label><div className="permission-grid">{permissions.map((p,i)=><label key={p.id??p.permission_code??i}><input type="checkbox" checked={f.permission_ids.includes(Number(p.id))} onChange={()=>toggle(Number(p.id))}/><span><strong>{p.permission_name}</strong><small>{p.permission_code}</small></span></label>)}</div><button className="btn primary" disabled={busy}>{busy?'Đang lưu...':'Lưu vai trò'}</button></form>;
}

function systemStatusLabel(value){return ({active:'Đang hoạt động',inactive:'Ngưng hoạt động',locked:'Đã khóa',disabled:'Đã tắt',pending:'Chờ xử lý'})[String(value||'').toLowerCase()]||value||'—'}
