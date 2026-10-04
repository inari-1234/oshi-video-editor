const canvasBlob=(c:HTMLCanvasElement)=>new Promise<Blob>((ok,bad)=>c.toBlob(b=>b?ok(b):bad(new Error('テスト画像生成失敗')),'image/png'))

async function photo(name:string,label:string,hue:number):Promise<File>{
  const c=document.createElement('canvas');c.width=360;c.height=640
  const x=c.getContext('2d')!;x.fillStyle=`hsl(${hue} 70% 42%)`;x.fillRect(0,0,c.width,c.height)
  x.fillStyle='#fff';x.textAlign='center';x.font='bold 42px sans-serif';x.fillText(label,180,300)
  return new File([await canvasBlob(c)],name,{type:'image/png'})
}

function videoType():string{
  if(typeof MediaRecorder==='undefined')return ''
  return ['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm'].find(t=>MediaRecorder.isTypeSupported(t))??''
}

async function video(base:string,label:string,hue:number):Promise<File>{
  if(typeof MediaRecorder==='undefined'||!HTMLCanvasElement.prototype.captureStream)throw new Error('この端末ではテスト動画を生成できません。')
  const c=document.createElement('canvas');c.width=360;c.height=640;const x=c.getContext('2d')!
  const stream=c.captureStream(24),type=videoType(),parts:BlobPart[]=[]
  const rec=new MediaRecorder(stream,type?{mimeType:type}:undefined)
  rec.ondataavailable=e=>{if(e.data.size)parts.push(e.data)}
  const done=new Promise<void>((ok,bad)=>{rec.onstop=()=>ok();rec.onerror=()=>bad(new Error('テスト動画生成失敗'))})
  rec.start(200);const start=performance.now()
  await new Promise<void>(ok=>{const f=()=>{const t=(performance.now()-start)/1000;x.fillStyle=`hsl(${hue} 70% 40%)`;x.fillRect(0,0,360,640);x.fillStyle='#fff';x.beginPath();x.arc(180+Math.sin(t*7)*80,320,45,0,Math.PI*2);x.fill();x.font='bold 34px sans-serif';x.textAlign='center';x.fillText(label,180,100);if(t>.9)ok();else requestAnimationFrame(f)};f()})
  rec.stop();await done;stream.getTracks().forEach(t=>t.stop())
  const mime=rec.mimeType||type||'video/webm';return new File([new Blob(parts,{type:mime})],`${base}.${mime.includes('mp4')?'mp4':'webm'}`,{type:mime})
}

function wav():File{
  const rate=8000,seconds=5,n=rate*seconds,b=new ArrayBuffer(44+n*2),v=new DataView(b)
  const s=(o:number,t:string)=>[...t].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)))
  s(0,'RIFF');v.setUint32(4,36+n*2,true);s(8,'WAVE');s(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);s(36,'data');v.setUint32(40,n*2,true)
  for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.sin(2*Math.PI*220*i/rate)*5000,true)
  return new File([b],'test-bgm.wav',{type:'audio/wav'})
}

export async function generateStage1TestFiles():Promise<{photos:File[];videos:File[];music:File}>{
  const [p1,p2,v1,v2]=await Promise.all([photo('photo-1.png','PHOTO 1',330),photo('photo-2.png','PHOTO 2',205),video('video-1','VIDEO 1',275),video('video-2','VIDEO 2',25)])
  return {photos:[p1,p2],videos:[v1,v2],music:wav()}
}
