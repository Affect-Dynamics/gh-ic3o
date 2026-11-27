import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {catalog,search,sourceUrl,attribution,examples} from '../registry.mjs';
test('catalog and examples use installed native definitions',t=>{
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'ic3o-reg-'));
    t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
    for(const f of ['registry/capability/add.capability','mode/sample/pep/sample.pep','projects/order/pep/order.pep','registry/no.txt']){
        const dest=path.join(root,f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,'Example\nIntake\n');
    }
    const entries=catalog(root);assert.equal(entries.length,2);
    assert.equal(search(entries,'ADD').length,1);
    assert.equal(examples(root)[0].name,'order');
    assert.match(sourceUrl(entries[0],'a'.repeat(40)),/blob\/a{40}\//);
});
test('attribution is pinned and does not invent missing authors',()=>{
    const sha='a'.repeat(40),commit='b'.repeat(40),calls=[];
    const a=attribution({path:'registry/add.capability'},sha,args=>{calls.push(args);return calls.length===1?[{sha:commit,author:{login:'alice'}}]:[{number:7,merged_at:'date',base:{repo:{full_name:'Affect-Dynamics/ic3o-developer-preview'}},user:{login:'bob'}}];});
    assert.ok(calls[0].includes('sha='+sha));
    assert.equal(a.author,'alice');assert.equal(a.pulls[0].author,'bob');
    assert.equal(attribution({path:'x'},sha,()=>null).author,null);
});
