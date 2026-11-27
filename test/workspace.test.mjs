import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {workspace,applications} from '../workspace.mjs';
test('registration persists and removal does not delete application',t=>{
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ic3o-ws-'));
    t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
    const pep=path.join(dir,'demo.pep');fs.writeFileSync(pep,'demo');
    const root=path.join(dir,'state'),ws=workspace(root);
    ws.add(pep);assert.throws(()=>ws.add(pep),/already registered/);
    const items=workspace(root).list();assert.equal(items.length,1);
    assert.equal(items[0].pep,fs.realpathSync(pep));
    ws.remove(items[0].id);assert.equal(ws.list().length,0);assert.ok(fs.existsSync(pep));
});
test('workspace delegates execution with exact argument boundaries',async()=>{
    const replies=['1','run','body=hello world','count=2','','b'],calls=[];
    await applications({list:()=>[{id:'a',name:'demo',pep:'/demo.pep'}]}, {run:args=>calls.push(args)},()=>{},async()=>replies.shift(),()=>{});
    assert.deepEqual(calls,[['run','/demo.pep','body=hello world','count=2']]);
});
