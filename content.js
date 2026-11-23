import crypto from 'node:crypto';

const json = (res, status, data) => res.status(status).setHeader('Content-Type','application/json; charset=utf-8').setHeader('Cache-Control','no-store').json(data);
const env = () => {
  const url=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY||'';
  if(!url||!key) throw new Error('Konfigurasi Supabase belum lengkap di Vercel.');
  return {url,key};
};
async function supa(path, options={}) {
  const {url,key}=env();
  const response=await fetch(url+path,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',...(options.headers||{})}});
  const text=await response.text();
  let data=null;try{data=text?JSON.parse(text):null;}catch{data=text;}
  if(!response.ok) throw new Error(data?.message||data?.error||`Supabase HTTP ${response.status}`);
  return data;
}
async function uploadDataImages(value, bucket, cache=new Map()) {
  if(Array.isArray(value)) return Promise.all(value.map(v=>uploadDataImages(v,bucket,cache)));
  if(value&&typeof value==='object'){
    const out={};
    for(const [k,v] of Object.entries(value)) out[k]=await uploadDataImages(v,bucket,cache);
    return out;
  }
  if(typeof value!=='string'||!value.startsWith('data:image/')) return value;
  if(value.length>8_000_000) throw new Error('Salah satu gambar terlalu besar. Kompres gambar terlebih dahulu (maksimum sekitar 6 MB data).');
  if(cache.has(value)) return cache.get(value);
  const match=value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if(!match) throw new Error('Format gambar tidak valid.');
  const mime=match[1].toLowerCase();
  const ext=({ 'image/jpeg':'jpg','image/jpg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/avif':'avif' })[mime];
  if(!ext) throw new Error('Format gambar belum didukung: '+mime);
  const bytes=Buffer.from(match[2],'base64');
  const hash=crypto.createHash('sha256').update(bytes).digest('hex');
  const objectPath=`${hash.slice(0,2)}/${hash}.${ext}`;
  const {url,key}=env();
  const upload=await fetch(`${url}/storage/v1/object/${bucket}/${objectPath}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':mime,'x-upsert':'true'},body:bytes});
  if(!upload.ok){const msg=await upload.text();throw new Error('Upload gambar Supabase gagal: '+msg.slice(0,240));}
  const publicUrl=`${url}/storage/v1/object/public/${bucket}/${objectPath}`;
  cache.set(value,publicUrl);
  return publicUrl;
}
export default async function handler(req,res){
  try{
    if(req.method==='GET'){
      const rows=await supa('/rest/v1/kley_site_content?id=eq.main&select=content,updated_at');
      return json(res,200,{content:rows?.[0]?.content||null,updated_at:rows?.[0]?.updated_at||null});
    }
    if(req.method==='POST'){
      const expected=process.env.KLEY_OWNER_SYNC_KEY||'';
      const supplied=req.headers['x-kley-owner-key']||'';
      const suppliedBuf=Buffer.from(String(supplied)); const expectedBuf=Buffer.from(String(expected));
      if(!expected||suppliedBuf.length!==expectedBuf.length||!crypto.timingSafeEqual(suppliedBuf,expectedBuf)) return json(res,401,{error:'Owner Sync Key tidak cocok.'});
      let body=req.body;
      if(typeof body==='string'){try{body=JSON.parse(body)}catch{return json(res,400,{error:'JSON request tidak valid.'});}}
      if(!body?.content||typeof body.content!=='object') return json(res,400,{error:'Konten tidak ditemukan.'});
      const content=await uploadDataImages(body.content,'kley-public-assets');
      const rows=await supa('/rest/v1/kley_site_content?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:'main',content,updated_at:new Date().toISOString()})});
      return json(res,200,{ok:true,content:rows?.[0]?.content||content,updated_at:rows?.[0]?.updated_at||new Date().toISOString()});
    }
    res.setHeader('Allow','GET, POST');return json(res,405,{error:'Method not allowed.'});
  }catch(error){console.error('Kley content API:',error);return json(res,500,{error:error.message||'Internal server error.'});}
}
