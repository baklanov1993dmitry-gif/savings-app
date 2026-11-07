require('../src/crypto.js');
(async()=>{
  const t0=Date.now();
  const data={positions:[{n:'тест Ё',a:123}]};
  const {blob,recovery,session}=await Vault.create('correct horse battery staple',data);
  console.log('create ms',Date.now()-t0,'recovery',recovery);
  const u=await Vault.unlock(blob,'correct horse battery staple');
  console.log('unlock ok',JSON.stringify(u.data)===JSON.stringify(data));
  try{await Vault.unlock(blob,'wrong');console.log('FAIL')}catch(e){console.log('wrong pw ->',e.message)}
  const r=await Vault.unlockRecovery(blob,recovery.toLowerCase().replace(/-/g,' '));
  console.log('recovery ok',r.data.positions[0].a===123);
  data.positions[0].a=999; const b2=await session.save(data);
  console.log('resave ok',(await Vault.unlock(b2,'correct horse battery staple')).data.positions[0].a===999);
  const b3=await session.setPassword('new password 2026!');
  try{await Vault.unlock(b3,'correct horse battery staple');console.log('FAIL old pw')}catch(e){console.log('old pw rejected')}
  console.log('new pw',(await Vault.unlock(b3,'new password 2026!')).data.positions[0].a===999, 'recovery still works',(await Vault.unlockRecovery(b3,recovery)).data.positions[0].a===999);
  b3.ct=b3.ct.slice(0,-4)+'AAAA'; try{await Vault.unlock(b3,'new password 2026!');console.log('FAIL tamper')}catch(e){console.log('tamper detected')}
  console.log(['123','Password1','correct horse battery staple','Xk9#mQ2!vL7$pR4z'].map(p=>Vault.strength(p).score));
})();
