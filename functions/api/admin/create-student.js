import {json,serviceHeaders,parseResponse,requireAdmin,audit} from '../_lib/supabase.js';

export async function onRequestPost({request,env}){
  let createdUserId=null;
  try{
    const admin=await requireAdmin(request,env);const body=await request.json();
    const username=String(body.username||'').trim().toLowerCase();const password=String(body.password||'');
    const fullName=String(body.fullName||'').trim();const contactEmail=String(body.email||'').trim().toLowerCase();const phone=String(body.phone||'').trim();const courseId=body.courseId||null;
    if(fullName.length<3)return json({message:'الاسم الكامل غير صالح'},400);
    if(!/^[a-z0-9._-]{4,32}$/.test(username))return json({message:'اسم المستخدم يجب أن يتكون من 4–32 حرفاً إنجليزياً أو رقماً'},400);
    if(password.length<8)return json({message:'كلمة المرور يجب ألا تقل عن 8 أحرف'},400);
    const loginEmail=`${username}@${env.LOGIN_DOMAIN||'sarh-login.app'}`;
    const response=await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`,{method:'POST',headers:serviceHeaders(env),body:JSON.stringify({email:loginEmail,password,email_confirm:true,user_metadata:{username,full_name:fullName,contact_email:contactEmail,phone}})});
    const authUser=await parseResponse(response);createdUserId=authUser.id;
    const profileResponse=await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?on_conflict=id`,{method:'POST',headers:serviceHeaders(env,{Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify({id:authUser.id,username,full_name:fullName,contact_email:contactEmail||null,phone:phone||null,role:'student',status:'active'})});
    await parseResponse(profileResponse);
    if(courseId){const enroll=await fetch(`${env.SUPABASE_URL}/rest/v1/enrollments?on_conflict=user_id,course_id`,{method:'POST',headers:serviceHeaders(env,{Prefer:'resolution=ignore-duplicates,return=minimal'}),body:JSON.stringify({user_id:authUser.id,course_id:courseId})});await parseResponse(enroll)}
    await audit(env,admin.id,'create_student_manually',authUser.id,{username,full_name:fullName,course_id:courseId});
    return json({ok:true,userId:authUser.id,username,message:'تم إنشاء حساب المتدرب بنجاح'});
  }catch(error){
    if(createdUserId){try{await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${createdUserId}`,{method:'DELETE',headers:serviceHeaders(env)})}catch{}}
    return json({message:error.message||'تعذر إنشاء المتدرب'},error.status||500);
  }
}
