require('../src/crypto.js');const V=globalThis.Vault;
(async()=>{
const {blob,session}=await V.create('pw-test-12345',{a:1});
await session.save({a:2}); const b2=session.blob; console.log('rev',b2.rev);
console.log('openBlob',JSON.stringify(await session.openBlob(b2)));
const raw=crypto.getRandomValues(new Uint8Array(32));
const b3=await session.setPasskey(raw);
const r=await V.unlockKey(b3,raw); console.log('passkey',JSON.stringify(r.data));
try{await V.unlockKey(b3,crypto.getRandomValues(new Uint8Array(32)))}catch(e){console.log('wrong key',e.message)}
const other=await V.create('x',{z:1});
try{await session.openBlob(other.blob)}catch(e){console.log('foreign',e.message)}
session.dropPasskey(); console.log('dropped',!session.blob.wk);
})();
