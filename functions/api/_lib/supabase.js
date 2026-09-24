export function json(payload,status=200){
  return new Response(JSON.stringify(payload),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
export function getSecretKey(env){return env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY||''}
export function serviceHeaders(env,extra={}){
  const key=getSecretKey(env);
  const headers={'apikey':key,'Content-Type':'application/json'};
  // مفاتيح service_role القديمة JWT تحتاج Authorization؛ مفاتيح sb_secret الجديدة ترسل عبر apikey فقط.
  if(key.startsWith('eyJ'))headers.Authorization=`Bearer ${key}`;
  return {...headers,...extra};
}
export async function parseResponse(response){
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data={message:text}}
  if(!response.ok)throw new Error(data?.msg||data?.message||data?.error_description||'Supabase request failed');
  return data;
}
export async function requireAdmin(request,env){
  const secretKey=getSecretKey(env);
  if(!env.SUPABASE_URL||!secretKey)throw Object.assign(new Error('إعدادات الخادم غير مكتملة'),{status:500});
  const authorization=request.headers.get('Authorization')||'';
  if(!authorization.startsWith('Bearer '))throw Object.assign(new Error('غير مصرح'),{status:401});
  const userResponse=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:secretKey,Authorization:authorization}});
  if(!userResponse.ok)throw Object.assign(new Error('جلسة غير صالحة'),{status:401});
  const user=await userResponse.json();
  const profileResponse=await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&role=eq.admin&status=eq.active&select=id,role`,{headers:serviceHeaders(env)});
  const profiles=await parseResponse(profileResponse);
  if(!profiles?.length)throw Object.assign(new Error('هذه العملية متاحة لمدير المنصة فقط'),{status:403});
  return user;
}
export async function getRequest(env,id){
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/enrollment_requests?id=eq.${encodeURIComponent(id)}&select=*`,{headers:serviceHeaders(env)});
  const rows=await parseResponse(response);if(!rows?.[0])throw Object.assign(new Error('طلب الانضمام غير موجود'),{status:404});return rows[0];
}
export async function audit(env,adminId,action,targetId,details={}){
  await fetch(`${env.SUPABASE_URL}/rest/v1/admin_audit_log`,{method:'POST',headers:serviceHeaders(env,{Prefer:'return=minimal'}),body:JSON.stringify({admin_id:adminId,action,target_id:targetId,details})});
}
