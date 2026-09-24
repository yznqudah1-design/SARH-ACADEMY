/* طبقة الربط الإنتاجية مع Supabase دون مكتبات خارجية. */
(function(){
  class SarhAPI {
    constructor(config={}){
      this.config=config;
      this.url=(config.SUPABASE_URL||'').replace(/\/$/,'');
      this.anonKey=config.SUPABASE_ANON_KEY||'';
      this.loginDomain=config.LOGIN_DOMAIN||'sarh-login.app';
      this.sessionKey='sarhProductionSession';
    }
    get enabled(){return Boolean(this.config.PRODUCTION_MODE&&this.url&&this.anonKey)}
    emailForUsername(username){
      const value=String(username||'').trim().toLowerCase();
      return value.includes('@')?value:`${value}@${this.loginDomain}`;
    }
    async parse(response){
      const text=await response.text();let payload=null;
      try{payload=text?JSON.parse(text):null}catch{payload={message:text}}
      if(!response.ok){
        const message=payload?.msg||payload?.message||payload?.error_description||payload?.error||'حدث خطأ في الاتصال بالخادم';
        const err=new Error(message);err.status=response.status;err.payload=payload;throw err;
      }
      return payload;
    }
    publicHeaders(extra={}){return {'apikey':this.anonKey,'Content-Type':'application/json',...extra}}
    getStoredSession(){
      try{return JSON.parse(localStorage.getItem(this.sessionKey)||'null')}catch{return null}
    }
    storeSession(session){localStorage.setItem(this.sessionKey,JSON.stringify(session));return session}
    async refreshSession(session){
      const response=await fetch(`${this.url}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:this.publicHeaders(),body:JSON.stringify({refresh_token:session.refresh_token})});
      const fresh=await this.parse(response);fresh.expires_at=Math.floor(Date.now()/1000)+fresh.expires_in;return this.storeSession(fresh);
    }
    async ensureSession(){
      let session=this.getStoredSession();if(!session)throw new Error('انتهت الجلسة، يرجى تسجيل الدخول مجدداً');
      if(!session.expires_at)session.expires_at=Math.floor(Date.now()/1000)+(session.expires_in||3600);
      if(session.expires_at-Math.floor(Date.now()/1000)<90)session=await this.refreshSession(session);
      return session;
    }
    async signIn(username,password){
      const response=await fetch(`${this.url}/auth/v1/token?grant_type=password`,{method:'POST',headers:this.publicHeaders(),body:JSON.stringify({email:this.emailForUsername(username),password})});
      const session=await this.parse(response);session.expires_at=Math.floor(Date.now()/1000)+session.expires_in;this.storeSession(session);
      const profile=await this.getProfile(session.access_token,session.user.id);
      return {session,profile};
    }
    async getProfile(token,userId){
      const response=await fetch(`${this.url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=*`,{headers:this.publicHeaders({Authorization:`Bearer ${token}`})});
      const rows=await this.parse(response);if(!rows?.[0])throw new Error('لم يتم العثور على ملف المستخدم');return rows[0];
    }
    async restore(){
      if(!this.enabled)return null;
      const session=await this.ensureSession();
      const profile=await this.getProfile(session.access_token,session.user.id);
      return {session,profile};
    }
    async signOut(){
      const session=this.getStoredSession();
      try{if(session)await fetch(`${this.url}/auth/v1/logout`,{method:'POST',headers:this.publicHeaders({Authorization:`Bearer ${session.access_token}`})})}catch{}
      localStorage.removeItem(this.sessionKey);
    }
    async submitApplication(form){
      const response=await fetch(`${this.url}/rest/v1/rpc/submit_enrollment_request`,{method:'POST',headers:this.publicHeaders(),body:JSON.stringify({
        p_full_name:form.name,p_email:form.email,p_phone:form.phone,p_specialty:form.specialty,p_course_title:form.course
      })});
      const payload=await this.parse(response);return Array.isArray(payload)?payload[0]:payload;
    }
    async authenticatedFetch(url,options={}){
      const session=await this.ensureSession();
      const headers={...this.publicHeaders(),Authorization:`Bearer ${session.access_token}`,...(options.headers||{})};
      return fetch(url,{...options,headers});
    }
    async getMyEnrollments(){
      const select='progress,enrolled_at,courses(id,slug,title,category,level,duration_hours,lessons_count)';
      const response=await this.authenticatedFetch(`${this.url}/rest/v1/enrollments?select=${select}&order=enrolled_at.desc`);
      return this.parse(response);
    }
    async listRequests(){
      const select='id,reference_id,full_name,email,phone,specialty,course_title,status,generated_username,rejection_reason,created_at,reviewed_at';
      const response=await this.authenticatedFetch(`${this.url}/rest/v1/enrollment_requests?select=${select}&order=created_at.desc`);
      return this.parse(response);
    }
    async listStudents(){
      const response=await this.authenticatedFetch(`${this.url}/rest/v1/profiles?role=eq.student&select=id,username,full_name,contact_email,status,created_at`);
      return this.parse(response);
    }
    async listAudit(){
      const response=await this.authenticatedFetch(`${this.url}/rest/v1/admin_audit_log?select=action,details,created_at&order=created_at.desc&limit=8`);
      return this.parse(response);
    }
    async adminAction(path,body){
      const session=await this.ensureSession();
      const response=await fetch(`/api/admin/${path}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify(body)});
      return this.parse(response);
    }
    approveRequest(body){return this.adminAction('approve',body)}
    rejectRequest(body){return this.adminAction('reject',body)}
  }
  window.SarhAPI=SarhAPI;
})();
