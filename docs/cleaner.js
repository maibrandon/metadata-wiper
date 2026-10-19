const pngSignature = [137,80,78,71,13,10,26,10];
function join(parts) {
  const result = new Uint8Array(parts.reduce((n,p)=>n+p.length,0));
  let offset=0; for(const part of parts){result.set(part,offset);offset+=part.length;} return result;
}
const text = bytes => new TextDecoder().decode(bytes);
function orientationSegment(data) {
  if(text(data.subarray(0,6))!=='Exif\0\0')return null;
  try {
    const t=data.subarray(6),v=new DataView(t.buffer,t.byteOffset,t.byteLength),le=text(t.subarray(0,2))==='II';
    const off=v.getUint32(4,le),count=v.getUint16(off,le);
    for(let k=0;k<count;k++) {
      const p=off+2+k*12;
      if(v.getUint16(p,le)===0x112&&v.getUint16(p+2,le)===3&&v.getUint32(p+4,le)===1){
        const orientation=v.getUint16(p+8,le);
        if(orientation>1&&orientation<=8)return new Uint8Array([255,225,0,34,69,120,105,102,0,0,77,77,0,42,0,0,0,8,0,1,1,18,0,3,0,0,0,1,0,orientation,0,0,0,0,0,0]);
      }
    }
  } catch { throw new Error('This JPEG has malformed EXIF. Use a fresh export.'); }
  return null;
}
export function cleanImage(input) {
  const b = input instanceof Uint8Array ? input : new Uint8Array(input);
  const removed=[]; const parts=[];
  if (pngSignature.every((v,i)=>b[i]===v)) {
    const view=new DataView(b.buffer,b.byteOffset,b.byteLength);
    parts.push(b.subarray(0,8));let i=8,ended=false;
    const remove=new Map([['caBX','C2PA / Content Credentials'],['eXIf','EXIF'],['iTXt','XMP / international text'],['tEXt','Text metadata'],['zTXt','Compressed text metadata'],['tIME','Modification timestamp']]);
    while(i<b.length){
      if(i+12>b.length)throw new Error('This PNG is truncated. Try the original file.');
      const n=view.getUint32(i),end=i+n+12;
      if(end>b.length)throw new Error('This PNG has an invalid chunk length.');
      const type=text(b.subarray(i+4,i+8));
      if(remove.has(type))removed.push(remove.get(type));else parts.push(b.subarray(i,end));
      i=end;if(type==='IEND'){ended=true;break;}
    }
    if(!ended)throw new Error('This PNG is missing its end marker.');
    if(i<b.length)removed.push('Trailing file data');
    return {bytes:join(parts),removed:[...new Set(removed)],type:'image/png',extension:'png'};
  }
  if(b[0]===255&&b[1]===216){
    parts.push(b.subarray(0,2));let i=2,ended=false;
    while(i<b.length){
      const start=i;if(b[i++]!==255)throw new Error('This JPEG has an invalid marker.');
      while(b[i]===255)i++;
      const marker=b[i++];
      if(marker===0xda){
        if(i+2>b.length)throw new Error('This JPEG is truncated.');
        const n=(b[i]<<8)|b[i+1];if(n<2||i+n>b.length)throw new Error('This JPEG has an invalid scan header.');
        // Stop at the next unstuffed marker; filter metadata between scans too.
        let next=i+n;
        while(next<b.length){
          if(b[next]!==255){next++;continue;}
          let code=next+1;while(b[code]===255)code++;
          if(code>=b.length)throw new Error('This JPEG has an incomplete scan.');
          if(b[code]===0||(b[code]>=0xd0&&b[code]<=0xd7)){next=code+1;continue;}
          break;
        }
        parts.push(b.subarray(start,next));i=next;continue;
      }
      if(marker===0xd9){parts.push(b.subarray(start,i));if(i<b.length)removed.push('Trailing file data');ended=true;break;}
      if(marker===0x01||(marker>=0xd0&&marker<=0xd7)){parts.push(b.subarray(start,i));continue;}
      if(i+2>b.length)throw new Error('This JPEG is truncated.');
      const n=(b[i]<<8)|b[i+1],end=i+n;if(n<2||end>b.length)throw new Error('This JPEG has an invalid segment length.');
      // Retain JFIF, ICC color profiles, and Adobe rendering information.
      const icc=marker===0xe2&&text(b.subarray(i+2,i+14))==='ICC_PROFILE\0';
      const adobe=marker===0xee&&text(b.subarray(i+2,i+7))==='Adobe';
      if((marker>=0xe1&&marker<=0xef&&!icc&&!adobe)||marker===0xfe){
        if(marker===0xe1){const orientation=orientationSegment(b.subarray(i+2,end));if(orientation)parts.push(orientation);}
        removed.push(marker===0xe1?'EXIF / XMP':marker===0xeb?'C2PA / Content Credentials':marker===0xed?'IPTC / Photoshop metadata':marker===0xfe?'Comments':'Application metadata');
      }else parts.push(b.subarray(start,end));i=end;
    }
    if(!ended)throw new Error('This JPEG is incomplete.');
    return {bytes:join(parts),removed:[...new Set(removed)],type:'image/jpeg',extension:'jpg'};
  }
  throw new Error('Choose a PNG or JPEG file. Other formats are not supported yet.');
}
