import {json,serviceHeaders,parseResponse,requireAdmin,getRequest,audit} from '../_lib/supabase.js';

export async function onRequestPost({request,env}){
  try{
    const admin=await requireAdmin(request,env);
    const body=await request.json();const requestId=String(body.requestId||'');const reason=String(body.reason||'لم يستوفِ الطلب متطلبات القبول').slice(0,500);
    const enrollmentRequest=await getRequest(env,requestId);
    if(enrollmentRequest.status!=='pending')return json({message:'تمت معالجة هذا الطلب مسبقاً'},409);
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/enrollment_requests?id=eq.${encodeURIComponent(requestId)}`,{
      method:'PATCH',headers:serviceHeaders(env,{Prefer:'return=minimal'}),body:JSON.stringify({status:'rejected',rejection_reason:reason,reviewed_by:admin.id,reviewed_at:new Date().toISOString()})
    });
    await parseResponse(response);await audit(env,admin.id,'reject_enrollment_request',requestId,{reference_id:enrollmentRequest.reference_id,reason});
    return json({ok:true,message:'تم رفض الطلب'});
  }catch(error){return json({message:error.message||'تعذر رفض الطلب'},error.status||500)}
}
