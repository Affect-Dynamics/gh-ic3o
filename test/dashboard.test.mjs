import test from 'node:test';
import assert from 'node:assert/strict';
import {account,screen,dashboard} from '../dashboard.mjs';
test('actual GitHub author filter and merged count',()=>{
    const calls=[];
    const identity=account(args=>{calls.push(args);return calls.length===1?{login:'alice'}:{total_count:4};});
    assert.deepEqual(identity,{login:'alice',merged:4});
    assert.ok(calls[1].includes('q=repo:Affect-Dynamics/ic3o-developer-preview is:pr is:merged author:alice'));
});
test('unavailable GitHub data is not represented as zero',()=>{
    assert.equal(account(()=>null),null);
    assert.match(screen({active:null},null),/unavailable/);
    assert.equal(account(args=>args.includes('user')?{login:'alice'}:null).merged,null);
});
test('noninteractive invocation prints dashboard without mutations',async()=>{
    let text='';
    await dashboard({status:()=>({active:null})},()=>assert.fail('unexpected action'),{input:{isTTY:false},output:{isTTY:false,write:s=>text+=s},query:()=>null});
    assert.match(text,/not installed/);
});
