import {json,serviceHeaders,parseResponse,requireAdmin,getRequest,audit} from '../_lib/supabase.js';

export async function onRequestPost({request,env}){
  let createdUserId=null;
  try{
    const admin=await requireAdmin(request,env);
    const body=await request.json();
    const requestId=String(body.requestId||'');
    const username=String(body.username||'').trim().toLowerCase();
    const password=String(body.password||'');
    if(!/^[a-z0-9._-]{4,32}$/.test(username))return json({message:'اسم المستخدم يجب أن يتكون من 4–32 حرفاً إنجليزياً أو رقماً'},400);
    if(password.length<8)return json({message:'كلمة المرور يجب ألا تقل عن 8 أحرف'},400);
    const enrollmentRequest=await getRequest(env,requestId);
    if(enrollmentRequest.status!=='pending')return json({message:'تمت معالجة هذا الطلب مسبقاً'},409);

    const loginDomain=env.LOGIN_DOMAIN||'sarh-login.app';
    const loginEmail=`${username}@${loginDomain}`;
    const createResponse=await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`,{
      method:'POST',headers:serviceHeaders(env),body:JSON.stringify({
        email:loginEmail,password,email_confirm:true,
        user_metadata:{username,full_name:enrollmentRequest.full_name,contact_email:enrollmentRequest.email,phone:enrollmentRequest.phone}
      })
    });
    const authUser=await parseResponse(createResponse);createdUserId=authUser.id;

    const profileResponse=await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?on_conflict=id`,{
      method:'POST',headers:serviceHeaders(env,{Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify({
        id:authUser.id,username,full_name:enrollmentRequest.full_name,contact_email:enrollmentRequest.email,phone:enrollmentRequest.phone,role:'student',status:'active'
      })
    });
    await parseResponse(profileResponse);

    if(enrollmentRequest.course_id){
      const enrollResponse=await fetch(`${env.SUPABASE_URL}/rest/v1/enrollments?on_conflict=user_id,course_id`,{
        method:'POST',headers:serviceHeaders(env,{Prefer:'resolution=ignore-duplicates,return=minimal'}),body:JSON.stringify({user_id:authUser.id,course_id:enrollmentRequest.course_id})
      });
      await parseResponse(enrollResponse);
    }

    const updateResponse=await fetch(`${env.SUPABASE_URL}/rest/v1/enrollment_requests?id=eq.${encodeURIComponent(requestId)}`,{
      method:'PATCH',headers:serviceHeaders(env,{Prefer:'return=minimal'}),body:JSON.stringify({status:'approved',generated_username:username,reviewed_by:admin.id,reviewed_at:new Date().toISOString(),rejection_reason:null})
    });
    await parseResponse(updateResponse);
    await audit(env,admin.id,'approve_enrollment_request',requestId,{username,reference_id:enrollmentRequest.reference_id});
    return json({ok:true,username,message:'تم اعتماد الطلب وإنشاء الحساب بنجاح'});
  }catch(error){
    if(createdUserId){
      try{await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${createdUserId}`,{method:'DELETE',headers:serviceHeaders(env)})}catch{}
    }
    return json({message:error.message||'تعذر اعتماد الطلب'},error.status||500);
  }
}
