import os from 'node:os';
import path from 'node:path';
import {workspace,applications} from './workspace.mjs';
import {createInterface} from 'node:readline/promises';
import {spawnSync} from 'node:child_process';
const upstream='Affect-Dynamics/ic3o-developer-preview';
function github(args){
    const r=spawnSync('gh',args,{encoding:'utf8',shell:false,stdio:['ignore','pipe','pipe'],timeout:15000});
    if(r.error||r.status!==0)return null;
    try{return JSON.parse(r.stdout);}catch{return null;}
}
export function account(query=github){
    const user=query(['api','--hostname','github.com','user']);
    if(!user?.login||!/^[-a-zA-Z0-9]+$/.test(user.login))return null;
    const result=query(['api','--hostname','github.com','-X','GET','search/issues','-f','q=repo:'+upstream+' is:pr is:merged author:'+user.login]);
    return {login:user.login,merged:Number.isInteger(result?.total_count)?result.total_count:null};
}
export function screen(state,identity){
    return [
        'ic3o / CONTRIBUTOR PREVIEW',
        '──────────────────────────────────────────────────',
        'GitHub     '+(identity?'@'+identity.login:'Unavailable / not authenticated'),
        'Merged PRs '+(identity?.merged??'unavailable')+'  (framework repository)',
        'Runtime    '+(state.active?.slice(0,12)??'not installed'),
        'Registry   '+(state.active?'bundled with active runtime':'not installed'),
        '',
        '  1  Applications       Manage registered applications',
        '  2  Registry           Browse installed Modes',
        '  3  Contributions      Open GitHub pull requests',
        '  4  Community          Open GitHub issues',
        '  5  Environment        Verify and synchronize',
        '  6  Rollback           Restore previous snapshot',
        '  7  Identity           GitHub authentication',
        '  8  Activity           Refresh actual GitHub activity',
        '  q  Quit',
        '──────────────────────────────────────────────────'
    ].join('\n');
}
export async function dashboard(manager,call,{input=process.stdin,output=process.stdout,query=github}={}){
    let identity=account(query);
    const print=s=>output.write(s+'\n');
    if(!input.isTTY||!output.isTTY){print(screen(manager.status(),identity));return;}
    const ws=workspace(path.join(os.homedir(),'.ic3o','preview','workspace'));
    const rl=createInterface({input,output});
    const ask=async prompt=>(await rl.question(prompt)).trim();
    try{
        for(;;){
            print(screen(manager.status(),identity));
            const choice=await ask('ic3o > ');
            if(choice==='q'||choice==='')break;
            try{
                if(choice==='1'){
                    await applications(ws,manager,call,ask,print);
                }else if(choice==='2')manager.run(['modes']);
                else if(choice==='3')call('gh',['pr','list','--repo',upstream,'--web']);
                else if(choice==='4')call('gh',['issue','list','--repo',upstream,'--web']);
                else if(choice==='5'){
                    if(await ask('Fetch and execute upstream verification tests? [y/N] ')==='y')print('Active: '+manager.sync().active);
                }else if(choice==='6'){
                    if(await ask('Restore previous runtime (not application data)? [y/N] ')==='y')print('Active: '+manager.rollback().active);
                }else if(choice==='7'){
                    call('gh',['auth','login','--hostname','github.com','--web']);
                    identity=account(query);
                }else if(choice==='8')identity=account(query);
                else print('Unknown selection');
            }catch(error){print('FAIL: '+error.message);}
        }
    }finally{rl.close();}
}
