// ZIP STORE: packages cleaned files without recompressing their contents.
function crc32(bytes){let c=0xffffffff;for(const byte of bytes){c^=byte;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
export function makeZip(files){
 const local=[],central=[];let offset=0,total=0;const encoder=new TextEncoder();
 files.forEach((file,index)=>{
  const name=encoder.encode(`${index+1}-${file.name}`),size=file.bytes.length,crc=crc32(file.bytes);
  const h=new Uint8Array(30+name.length),v=new DataView(h.buffer);
  v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,size,true);v.setUint32(22,size,true);v.setUint16(26,name.length,true);h.set(name,30);
  const c=new Uint8Array(46+name.length),w=new DataView(c.buffer);w.setUint32(0,0x02014b50,true);w.setUint16(4,20,true);w.setUint16(6,20,true);w.setUint16(8,0x800,true);w.setUint16(14,33,true);w.setUint32(16,crc,true);w.setUint32(20,size,true);w.setUint32(24,size,true);w.setUint16(28,name.length,true);w.setUint32(42,offset,true);c.set(name,46);
  local.push(h,file.bytes);central.push(c);offset+=h.length+size;total+=c.length;
 });
 const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,total,true);e.setUint32(16,offset,true);
 const out=new Uint8Array(offset+total+22);let p=0;for(const b of [...local,...central,end]){out.set(b,p);p+=b.length;}return out;
}
