const courses = [
  {id:'autocad', title:'AutoCAD من الصفر إلى الاحتراف', category:'التصميم والرسم الهندسي', type:'design', level:'مبتدئ إلى متقدم', symbol:'A', desc:'أتقن الرسم ثنائي الأبعاد وإعداد المخططات التنفيذية باحتراف.', lessons:25, hours:18, rating:'4.9'},
  {id:'primavera', title:'Primavera P6 لإدارة المشاريع', category:'إدارة المشاريع', type:'management', level:'متوسط', symbol:'P6', desc:'خطط وجدول وراقب المشاريع الهندسية باستخدام أقوى الأدوات.', lessons:21, hours:16, rating:'4.8'},
  {id:'quantity', title:'حساب الكميات وحصر الأعمال', category:'المكتب الفني', type:'technical', level:'جميع المستويات', symbol:'QS', desc:'تعلم الحصر الدقيق وإعداد جداول الكميات والتسعير الهندسي.', lessons:19, hours:14, rating:'4.9'},
  {id:'revit', title:'Revit BIM للمهندسين', category:'نمذجة معلومات البناء', type:'design', level:'متوسط', symbol:'R', desc:'أنشئ نماذج معلومات بناء متكاملة ومخططات قابلة للتنسيق.', lessons:28, hours:22, rating:'4.8'},
  {id:'excel', title:'Excel المتقدم للمهندسين', category:'أدوات المكتب الفني', type:'technical', level:'مبتدئ إلى متقدم', symbol:'X', desc:'حلّل البيانات وأنشئ تقارير وجداول هندسية ذكية وفعالة.', lessons:17, hours:12, rating:'4.7'},
  {id:'civil', title:'Civil 3D لتصميم الطرق', category:'التصميم المدني', type:'design', level:'متقدم', symbol:'C3', desc:'صمم الطرق والبنية التحتية والأسطح والمحاور باحتراف.', lessons:24, hours:20, rating:'4.9'}
];

const videoData = {
  academy:{title:'كيف تعمل أكاديمية صرح؟', category:'جولة داخل المنصة', duration:'01:45'},
  autocad:{title:'AutoCAD من الصفر إلى الاحتراف', category:'التصميم والرسم الهندسي', duration:'02:18'},
  primavera:{title:'Primavera P6 لإدارة المشاريع', category:'إدارة المشاريع', duration:'03:05'},
  quantity:{title:'حساب الكميات وحصر الأعمال', category:'المكتب الفني', duration:'02:42'}
};

const defaultData = {
  requests:[
    {id:'SRH-1048',name:'لينا محمود',email:'lina.mahmoud@email.com',phone:'0791234567',specialty:'هندسة معمارية',course:'Revit BIM للمهندسين',date:'14 سبتمبر 2026',status:'pending'},
    {id:'SRH-1047',name:'عمر خالد',email:'omar.khaled@email.com',phone:'0779876543',specialty:'هندسة مدنية',course:'Primavera P6 لإدارة المشاريع',date:'14 سبتمبر 2026',status:'pending'},
    {id:'SRH-1046',name:'سارة أحمد',email:'sara.ahmad@email.com',phone:'0785544332',specialty:'هندسة مدنية',course:'حساب الكميات وحصر الأعمال',date:'13 سبتمبر 2026',status:'pending'},
    {id:'SRH-1045',name:'يوسف علي',email:'yousef.ali@email.com',phone:'0794455667',specialty:'هندسة ميكانيكية',course:'AutoCAD من الصفر إلى الاحتراف',date:'12 سبتمبر 2026',status:'approved',username:'sarh1045',password:'SRH@5921'},
    {id:'SRH-1044',name:'نور محمد',email:'noor@email.com',phone:'0772233445',specialty:'هندسة معمارية',course:'Civil 3D المتقدم',date:'11 سبتمبر 2026',status:'rejected'}
  ],
  users:[
    {id:'USR-1001',requestId:'DEMO',name:'محمد المهندس',email:'trainee@sarh.com',username:'trainee',password:'1234',course:'AutoCAD من الصفر إلى الاحتراف',status:'active'},
    {id:'USR-1002',requestId:'SRH-1045',name:'يوسف علي',email:'yousef.ali@email.com',username:'sarh1045',password:'SRH@5921',course:'AutoCAD من الصفر إلى الاحتراف',status:'active'}
  ],
  activities:[
    {icon:'✓',text:'تم اعتماد حساب يوسف علي',time:'منذ 45 دقيقة'},
    {icon:'＋',text:'طلب انضمام جديد من لينا محمود',time:'منذ ساعة'},
    {icon:'▷',text:'تم تحديث دورة AutoCAD الاحترافي',time:'منذ 3 ساعات'}
  ]
};

let data = loadData();
let loginRole = 'student';
let requestFilter = 'all';
let requestSearch = '';
let currentUser = null;
let videoTimer = null;
const sarhConfig = window.SARH_CONFIG || {};
const api = window.SarhAPI ? new window.SarhAPI(sarhConfig) : null;
const productionMode = Boolean(api && api.enabled);

function loadData(){
  const saved = localStorage.getItem('sarhAcademyData');
  if(saved){ try{return JSON.parse(saved)}catch(e){} }
  localStorage.setItem('sarhAcademyData', JSON.stringify(defaultData));
  return JSON.parse(JSON.stringify(defaultData));
}
function saveData(){localStorage.setItem('sarhAcademyData',JSON.stringify(data))}
function $(s,scope=document){return scope.querySelector(s)}
function $$(s,scope=document){return [...scope.querySelectorAll(s)]}
function escapeHTML(str=''){return String(str).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function showToast(message,type='success'){
  const toast=$('#toast'); toast.textContent=message; toast.className=`toast ${type} show`;
  clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.classList.remove('show'),3300);
}
function openModal(id){
  $$('.modal').forEach(m=>m.classList.remove('open'));
  const modal=$('#'+id); if(!modal)return; modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');
}
function closeModals(){
  $$('.modal').forEach(m=>{m.classList.remove('open');m.setAttribute('aria-hidden','true')});document.body.classList.remove('modal-open');stopVideo();
}

// Course cards
function renderCourses(filter='all'){
  const list=filter==='all'?courses:courses.filter(c=>c.type===filter);
  $('#coursesGrid').innerHTML=list.map(c=>`<article class="course-card">
    <div class="course-cover ${c.type}"><span class="cover-level">${c.level}</span><span class="cover-symbol">${c.symbol}</span></div>
    <div class="course-body"><span class="course-category">${c.category}</span><h3>${c.title}</h3><p>${c.desc}</p>
    <div class="course-meta"><span>▤ ${c.lessons} درساً</span><span>◷ ${c.hours} ساعة</span><span><b>★</b> ${c.rating}</span></div></div></article>`).join('');
}
renderCourses();
$('#courseFilters').addEventListener('click',e=>{if(!e.target.dataset.filter)return;$$('#courseFilters button').forEach(b=>b.classList.remove('active'));e.target.classList.add('active');renderCourses(e.target.dataset.filter)});

// Navigation
$('#menuToggle').addEventListener('click',()=>$('#mainNav').classList.toggle('open'));
$$('#mainNav a').forEach(a=>a.addEventListener('click',()=>$('#mainNav').classList.remove('open')));
window.addEventListener('scroll',()=>{
  const ids=['home','intro-videos','courses','how-it-works','faq'];let current='home';
  ids.forEach(id=>{const s=$('#'+id);if(s&&scrollY>=s.offsetTop-150)current=id});
  $$('#mainNav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+current));
});

// FAQ
$$('.faq-item>button').forEach(btn=>btn.addEventListener('click',()=>{
  const item=btn.parentElement; const was=item.classList.contains('open');
  $$('.faq-item').forEach(i=>{i.classList.remove('open');$('button b',i).textContent='+'});
  if(!was){item.classList.add('open');$('b',btn).textContent='−'}
}));

// Modal common
$$('[data-close-modal]').forEach(el=>el.addEventListener('click',closeModals));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModals()});
$$('[data-open-login]').forEach(b=>b.addEventListener('click',()=>{setLoginRole('student');openModal('loginModal')}));
$$('[data-admin-login]').forEach(b=>b.addEventListener('click',()=>{setLoginRole('admin');openModal('loginModal')}));
$$('[data-go-join]').forEach(b=>b.addEventListener('click',()=>{closeModals();setTimeout(()=>$('#join').scrollIntoView(),100)}));

// Login
function setLoginRole(role){
  loginRole=role; $$('.login-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.role===role));
  const d=$('#demoCredentials');
  d.classList.toggle('hidden',productionMode);
  if(!productionMode)d.innerHTML=role==='admin'?'<span>بيانات الإدارة</span><code>admin</code><i>/</i><code>sarh2026</code><button type="button" id="fillDemo">استخدام</button>':'<span>بيانات التجربة</span><code>trainee</code><i>/</i><code>1234</code><button type="button" id="fillDemo">استخدام</button>';
  const usernameInput=$('#loginForm input[name="username"]');
  usernameInput.placeholder=role==='admin'?'أدخل اسم مستخدم الإدارة':'أدخل اسم المستخدم الصادر من الإدارة';
  $('#loginError').textContent=''; bindFillDemo();
}
function bindFillDemo(){const b=$('#fillDemo');if(b)b.onclick=()=>{const f=$('#loginForm');f.username.value=loginRole==='admin'?'admin':'trainee';f.password.value=loginRole==='admin'?'sarh2026':'1234'}}
bindFillDemo();
$$('.login-tabs button').forEach(b=>b.addEventListener('click',()=>setLoginRole(b.dataset.role)));
$('.show-pass').addEventListener('click',e=>{const input=$('#loginForm input[name=password]');input.type=input.type==='password'?'text':'password';e.target.textContent=input.type==='password'?'إظهار':'إخفاء'});
$('#forgotBtn').addEventListener('click',()=>showToast('يرجى التواصل مع إدارة الأكاديمية لاستعادة بيانات الدخول.','error'));
$('#loginForm').addEventListener('submit',async e=>{
  e.preventDefault();const fd=new FormData(e.target);const username=fd.get('username').trim();const password=fd.get('password');const error=$('#loginError');const submit=$('button[type="submit"]',e.target);error.textContent='';
  if(productionMode){
    submit.disabled=true;submit.querySelector('b').textContent='…';
    try{
      const result=await api.signIn(username,password);const p=result.profile;
      if(p.role!==loginRole)throw new Error(loginRole==='admin'?'هذا الحساب لا يملك صلاحية الإدارة':'يرجى استخدام بوابة المتدربين لهذا الحساب');
      if(p.status!=='active')throw new Error('هذا الحساب غير نشط، يرجى التواصل مع الإدارة');
      currentUser={id:p.id,name:p.full_name,email:p.contact_email,username:p.username,role:p.role,status:p.status,course:courses[0].title,enrollments:[]};
      if(p.role==='admin')await hydrateAdminData();else{currentUser.enrollments=await api.getMyEnrollments();currentUser.course=currentUser.enrollments[0]?.courses?.title||courses[0].title;}
      closeModals();showDashboard(p.role);showToast(`مرحباً ${p.full_name}، تم تسجيل الدخول بأمان`);
    }catch(err){await api.signOut().catch(()=>{});error.textContent=humanizeAuthError(err.message)}
    finally{submit.disabled=false;submit.querySelector('b').textContent='←'}
    return;
  }
  if(loginRole==='admin'){
    if(username==='admin'&&password==='sarh2026'){closeModals();showDashboard('admin');showToast('مرحباً بك في لوحة إدارة صرح')}else error.textContent='بيانات الإدارة غير صحيحة. جرّب admin / sarh2026';
  }else{
    const user=data.users.find(u=>u.username===username&&u.password===password&&u.status==='active');
    if(user){currentUser=user;closeModals();showDashboard('student');showToast(`مرحباً ${user.name}، نتمنى لك تعلماً ممتعاً`)}else error.textContent='بيانات الدخول غير صحيحة، أو أن حسابك لم يُعتمد بعد.';
  }
});
function humanizeAuthError(message=''){
  if(/invalid login credentials/i.test(message))return 'اسم المستخدم أو كلمة المرور غير صحيحة.';
  if(/email not confirmed/i.test(message))return 'الحساب لم يُفعّل بعد من الإدارة.';
  if(/failed to fetch|network/i.test(message))return 'تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مجدداً.';
  return message||'تعذر تسجيل الدخول.';
}

// Request form
$('#joinForm').addEventListener('submit',async e=>{
  e.preventDefault();const fd=new FormData(e.target);const form={name:fd.get('name').trim(),phone:fd.get('phone').trim(),email:fd.get('email').trim(),specialty:fd.get('specialty'),course:fd.get('course')};const submit=$('button[type="submit"]',e.target);
  if(productionMode){
    submit.disabled=true;const label=$('span',submit);const original=label.textContent;label.textContent='جارٍ إرسال الطلب...';
    try{const result=await api.submitApplication(form);e.target.reset();$('#newRequestId').textContent=result.reference_id;openModal('successModal')}
    catch(err){showToast(err.message||'تعذر إرسال الطلب، حاول مجدداً','error')}
    finally{submit.disabled=false;label.textContent=original}
    return;
  }
  const n=1049+data.requests.length+Math.floor(Math.random()*30);const id='SRH-'+n;
  const req={id,...form,date:'14 سبتمبر 2026',status:'pending'};
  data.requests.unshift(req);data.activities.unshift({icon:'＋',text:`طلب انضمام جديد من ${req.name}`,time:'الآن'});saveData();e.target.reset();$('#newRequestId').textContent=id;openModal('successModal');
});

// Video prototype
$$('[data-video]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();openVideo(el.dataset.video)}));
function openVideo(key){const v=videoData[key]||videoData.academy;$('#videoTitle').textContent=v.title;$('#videoCategory').textContent=v.category;$('#captionTitle').textContent=v.title;$('#fakeTime').textContent=`00:00 / ${v.duration}`;$('#prototypeVideo').classList.remove('playing');$('#fakeProgress').style.width='0';$('#videoPlayToggle').textContent='▶';openModal('videoModal')}
function toggleVideo(){const player=$('#prototypeVideo');const playing=player.classList.toggle('playing');$('#videoPlayToggle').textContent=playing?'Ⅱ':'▶';$('#controlPlay').textContent=playing?'Ⅱ':'▶';if(playing){let sec=0;clearInterval(videoTimer);videoTimer=setInterval(()=>{sec++;const m=String(Math.floor(sec/60)).padStart(2,'0'),s=String(sec%60).padStart(2,'0');const total=$('#fakeTime').textContent.split('/')[1];$('#fakeTime').textContent=`${m}:${s} /${total}`;if(sec>=12)stopVideo()},1000)}else clearInterval(videoTimer)}
function stopVideo(){clearInterval(videoTimer);const p=$('#prototypeVideo');if(p)p.classList.remove('playing')}
$('#videoPlayToggle').addEventListener('click',toggleVideo);$('#controlPlay').addEventListener('click',toggleVideo);

// Views
function showDashboard(type){
  $('#siteView').classList.add('hidden');$('#studentView').classList.toggle('hidden',type!=='student');$('#adminView').classList.toggle('hidden',type!=='admin');window.scrollTo(0,0);
  if(type==='student')renderStudent(); else renderAdmin();
}
function showSite(){
  $('#siteView').classList.remove('hidden');$('#studentView').classList.add('hidden');$('#adminView').classList.add('hidden');window.scrollTo(0,0)
}
$$('[data-logout]').forEach(b=>b.addEventListener('click',async()=>{if(productionMode)await api.signOut().catch(()=>{});currentUser=null;showSite();showToast('تم تسجيل الخروج بأمان')}));
$('#viewSite').addEventListener('click',showSite);
$$('.dash-menu').forEach(b=>b.addEventListener('click',()=>$('.dash-sidebar',b.closest('.dashboard-view')).classList.toggle('open')));

function renderStudent(){
  const user=currentUser||data.users[0]; const first=user.name.split(' ')[0];
  $('#studentNameTop').textContent=user.name;$('#studentFirstName').textContent=first;$('#studentInitial').textContent=first[0];
  const enrolled=productionMode&&user.enrollments?.length?user.enrollments.map(e=>{const c=e.courses||{};const progress=Math.round(Number(e.progress||0));return{title:c.title||'دورة صرح',symbol:c.slug?.includes('primavera')?'P6':c.slug?.includes('revit')?'R':c.slug?.includes('quantity')?'QS':'A',progress,lessons:`${c.lessons_count||0} درساً`,category:c.category||'مسار هندسي'}}):null;
  const my=enrolled||[{title:user.course||courses[0].title,symbol:(user.course||'A').includes('Primavera')?'P6':'A',progress:72,lessons:'18/25 درساً',category:'التصميم الهندسي'}, {title:'Primavera P6 لإدارة المشاريع',symbol:'P6',progress:34,lessons:'7/21 درساً',category:'إدارة المشاريع'}];
  $('#myCourses').innerHTML=my.map((c,i)=>`<article class="my-course"><div class="my-course-art ${c.symbol==='P6'?'p6':''}">${c.symbol}</div><div class="my-course-body"><small>${escapeHTML(c.category)}</small><h3>${escapeHTML(c.title)}</h3><div class="tiny-progress"><i style="width:${c.progress}%"></i></div><div class="my-course-meta"><span>${c.lessons}</span><b>${c.progress}%</b></div></div></article>`).join('');
}
$('#continueLearning').addEventListener('click',()=>showToast('تم فتح الدرس 18 — نموذج أولي لواجهة تشغيل المحتوى'));

// Admin
function formatArabicDate(value){try{return new Intl.DateTimeFormat('ar-JO',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value))}catch{return value||'—'}}
function relativeActivityTime(value){
  const mins=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/60000));
  if(mins<1)return 'الآن';if(mins<60)return `منذ ${mins} دقيقة`;const hours=Math.floor(mins/60);if(hours<24)return `منذ ${hours} ساعة`;return formatArabicDate(value);
}
async function hydrateAdminData(){
  if(!productionMode)return;
  const [requests,students,audits]=await Promise.all([api.listRequests(),api.listStudents(),api.listAudit()]);
  data.requests=requests.map(r=>({dbId:r.id,id:r.reference_id,name:r.full_name,email:r.email,phone:r.phone,specialty:r.specialty,course:r.course_title,status:r.status,username:r.generated_username,rejectionReason:r.rejection_reason,date:formatArabicDate(r.created_at)}));
  data.users=students.map(s=>({id:s.id,name:s.full_name,email:s.contact_email,username:s.username,status:s.status}));
  const actionNames={approve_enrollment_request:'تم اعتماد حساب متدرب جديد',reject_enrollment_request:'تم رفض طلب انضمام'};
  data.activities=audits.map(a=>({icon:a.action.startsWith('approve')?'✓':'×',text:actionNames[a.action]||a.action,time:relativeActivityTime(a.created_at)}));
}
function renderAdmin(){
  const counts={pending:data.requests.filter(r=>r.status==='pending').length,approved:data.requests.filter(r=>r.status==='approved').length,rejected:data.requests.filter(r=>r.status==='rejected').length};
  $('#pendingBadge').textContent=counts.pending;$('#pendingCount').textContent=counts.pending;$('#totalUsers').textContent=productionMode?data.users.length:data.users.length+1238;
  $('#allTabCount').textContent=data.requests.length;$('#pendingTabCount').textContent=counts.pending;$('#approvedTabCount').textContent=counts.approved;$('#rejectedTabCount').textContent=counts.rejected;
  let list=data.requests.filter(r=>(requestFilter==='all'||r.status===requestFilter)&&(r.name.includes(requestSearch)||r.id.toLowerCase().includes(requestSearch.toLowerCase())||r.course.includes(requestSearch)));
  $('#requestsTable').innerHTML=list.map(r=>requestRow(r)).join('');$('#emptyRequests').classList.toggle('hidden',list.length>0);$('#tableResultText').textContent=`عرض ${list.length} من أصل ${data.requests.length} طلبات`;
  bindRequestActions();
  $('#activityList').innerHTML=data.activities.slice(0,4).map(a=>`<div class="activity-item"><span>${a.icon}</span><div><strong>${escapeHTML(a.text)}</strong><small>${a.time}</small></div></div>`).join('')||'<div class="empty-state"><p>لا توجد نشاطات مسجلة بعد.</p></div>';
  $('#resetDemo').classList.toggle('hidden',productionMode);
}
function requestRow(r){
  const names={pending:'بانتظار المراجعة',approved:'تم القبول',rejected:'مرفوض'};const initial=r.name.trim().charAt(0);
  let actions=r.status==='pending'?`<button class="approve-btn" data-approve="${r.id}">قبول وإنشاء حساب</button><button class="reject-btn" data-reject="${r.id}">رفض</button>`:r.status==='approved'?`<button class="credentials-btn" data-creds="${r.id}">بيانات الدخول</button>`:'<span style="color:#9aa5ac">—</span>';
  return `<tr><td>${r.id}</td><td><div class="applicant"><span class="applicant-avatar">${initial}</span><div><strong>${escapeHTML(r.name)}</strong><small>${escapeHTML(r.email)}</small></div></div></td><td>${escapeHTML(r.specialty)}</td><td>${escapeHTML(r.course)}</td><td>${r.date}</td><td><span class="status ${r.status}">${names[r.status]}</span></td><td><div class="action-buttons">${actions}</div></td></tr>`;
}
function bindRequestActions(){
  $$('[data-approve]').forEach(b=>b.onclick=()=>openApproval(b.dataset.approve));
  $$('[data-reject]').forEach(b=>b.onclick=()=>rejectRequest(b.dataset.reject));
  $$('[data-creds]').forEach(b=>b.onclick=()=>showCredentials(b.dataset.creds));
}
function makePassword(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';const bytes=new Uint32Array(8);
  if(window.crypto?.getRandomValues)window.crypto.getRandomValues(bytes);else bytes.forEach((_,i)=>bytes[i]=Math.floor(Math.random()*chars.length));
  return 'SRH@'+[...bytes].map(n=>chars[n%chars.length]).join('');
}
function openApproval(id){
  const r=data.requests.find(x=>x.id===id);if(!r)return;const f=$('#approvalForm');const suffix=id.split('-').slice(-1)[0];f.requestId.value=id;f.newUsername.value='sarh'+suffix;f.newPassword.value=makePassword();$('#approvalUserText').textContent=`سيتم تفعيل حساب ${r.name} وإصدار بيانات الدخول التالية.`;openModal('approvalModal')
}
$('#regeneratePass').addEventListener('click',()=>$('#approvalForm').newPassword.value=makePassword());
$('#approvalForm').addEventListener('submit',async e=>{
  e.preventDefault();const fd=new FormData(e.target),id=fd.get('requestId'),username=fd.get('newUsername').trim().toLowerCase(),password=fd.get('newPassword').trim();const submit=$('button[type="submit"]',e.target);
  if(data.users.some(u=>u.username===username)){showToast('اسم المستخدم مستخدم مسبقاً، اختر اسماً آخر','error');return}
  const r=data.requests.find(x=>x.id===id);if(!r)return;
  if(productionMode){
    submit.disabled=true;const original=submit.textContent;submit.textContent='جارٍ إنشاء الحساب...';
    try{
      await api.approveRequest({requestId:r.dbId,username,password});
      const credentials=`اسم المستخدم: ${username}\nكلمة المرور: ${password}`;
      if(navigator.clipboard)await navigator.clipboard.writeText(credentials).catch(()=>{});
      await hydrateAdminData();closeModals();renderAdmin();showToast(`تم اعتماد ${r.name} ونسخ بيانات الدخول`);
    }catch(err){showToast(err.message||'تعذر إنشاء الحساب','error')}
    finally{submit.disabled=false;submit.textContent=original}
    return;
  }
  r.status='approved';r.username=username;r.password=password;data.users.push({id:'USR-'+Date.now().toString().slice(-6),requestId:id,name:r.name,email:r.email,username,password,course:r.course,status:'active'});data.activities.unshift({icon:'✓',text:`تم اعتماد حساب ${r.name}`,time:'الآن'});saveData();closeModals();renderAdmin();showToast(`تم اعتماد ${r.name} وإنشاء حسابه بنجاح`)
});
async function rejectRequest(id){
  const r=data.requests.find(x=>x.id===id);if(!r||!confirm(`هل تريد رفض طلب ${r.name}؟`))return;
  if(productionMode){
    try{await api.rejectRequest({requestId:r.dbId,reason:'لم يستوفِ الطلب متطلبات القبول'});await hydrateAdminData();renderAdmin();showToast('تم رفض الطلب وتسجيل الإجراء','error')}
    catch(err){showToast(err.message||'تعذر رفض الطلب','error')}return;
  }
  r.status='rejected';data.activities.unshift({icon:'×',text:`تم رفض طلب ${r.name}`,time:'الآن'});saveData();renderAdmin();showToast('تم تحديث حالة الطلب','error')
}
function showCredentials(id){
  const r=data.requests.find(x=>x.id===id);if(!r)return;
  if(productionMode){
    const text=`اسم المستخدم: ${r.username}`;if(navigator.clipboard)navigator.clipboard.writeText(text).catch(()=>{});
    showToast(`اسم المستخدم ${r.username} — كلمة المرور مشفرة ولا يمكن استرجاعها`);return;
  }
  const text=`اسم المستخدم: ${r.username}\nكلمة المرور: ${r.password}`;
  if(navigator.clipboard)navigator.clipboard.writeText(text).catch(()=>{});showToast(`بيانات ${r.name}: ${r.username} / ${r.password} — تم النسخ`)
}
$('#requestTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;requestFilter=b.dataset.status;$$('#requestTabs button').forEach(x=>x.classList.toggle('active',x===b));renderAdmin()});
$('#requestSearch').addEventListener('input',e=>{requestSearch=e.target.value.trim();renderAdmin();e.target.focus()});
$('[data-scroll-requests]').addEventListener('click',()=>$('.requests-section').scrollIntoView({behavior:'smooth'}));
$('#resetDemo').addEventListener('click',()=>{if(confirm('إعادة جميع بيانات العرض إلى حالتها الأصلية؟')){data=JSON.parse(JSON.stringify(defaultData));saveData();requestFilter='all';requestSearch='';$('#requestSearch').value='';renderAdmin();showToast('تمت إعادة بيانات العرض بنجاح')}});

// Theme preference
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme',theme);
  localStorage.setItem('sarhTheme',theme);
  $$('[data-theme-toggle]').forEach(btn=>{
    const dark=theme==='dark';
    btn.setAttribute('aria-label',dark?'تفعيل الوضع الفاتح':'تفعيل الوضع المظلم');
    btn.setAttribute('title',dark?'الوضع الفاتح':'الوضع المظلم');
  });
}
const storedTheme=localStorage.getItem('sarhTheme');
const preferredTheme=storedTheme||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
applyTheme(preferredTheme);
$$('[data-theme-toggle]').forEach(btn=>btn.addEventListener('click',()=>{
  const next=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
  applyTheme(next);
  showToast(next==='dark'?'تم تفعيل الوضع المظلم':'تم تفعيل الوضع الفاتح');
}));

// Initial conveniences
setLoginRole('student');
async function restoreProductionSession(){
  if(!productionMode||!api.getStoredSession())return;
  try{
    const {profile}=await api.restore();
    if(profile.status!=='active')throw new Error('inactive');
    currentUser={id:profile.id,name:profile.full_name,email:profile.contact_email,username:profile.username,role:profile.role,status:profile.status,course:courses[0].title,enrollments:[]};
    if(profile.role==='admin')await hydrateAdminData();else{currentUser.enrollments=await api.getMyEnrollments();currentUser.course=currentUser.enrollments[0]?.courses?.title||courses[0].title;}
    showDashboard(profile.role);
  }catch{await api.signOut().catch(()=>{});currentUser=null}
}
restoreProductionSession();
