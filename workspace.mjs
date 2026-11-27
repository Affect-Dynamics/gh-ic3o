import {examples} from './registry.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export function workspace(root){
    fs.mkdirSync(root,{recursive:true});
    const file=path.join(root,'applications.json'),lock=file+'.lock';
    function list(){return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];}
    function change(fn){
        fs.mkdirSync(lock);
        const tmp=file+'.'+randomUUID();
        try{const result=fn(list());fs.writeFileSync(tmp,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});fs.renameSync(tmp,file);return result;}
        finally{fs.rmSync(tmp,{force:true});fs.rmdirSync(lock);}
    }
    function add(entry){
        const pep=fs.realpathSync(path.resolve(entry));
        if(path.extname(pep)!=='.pep'||!fs.statSync(pep).isFile())throw Error('Select a native .pep file');
        return change(items=>{if(items.some(x=>x.pep===pep))throw Error('Application already registered');return [...items,{id:randomUUID(),name:path.basename(pep,'.pep'),pep}];});
    }
    function remove(id){return change(items=>items.filter(x=>x.id!==id));}
    return {list,add,remove};
}
export async function applications(ws,manager,call,ask,print){
    for(;;){
        const apps=ws.list();
        print('\nic3o / APPLICATIONS\n'+apps.map((a,i)=>'  '+(i+1)+'  '+a.name+(fs.existsSync(a.pep)?'':' [missing]')).join('\n')+'\n  n  New application\n  a  Register local PEP\n  i  Import GitHub repository\n  e  Browse bundled examples\n  b  Back');
        const choice=await ask('applications > ');
        if(choice==='b'||choice==='')return;
        try{
            if(choice==='a'){const file=await ask('PEP path > ');if(file)ws.add(file);}
            else if(choice==='n'){
                const name=await ask('Application name (created in current directory) > ');
                if(!/^[a-z][a-z0-9-]{0,62}$/.test(name))throw Error('Invalid application name');
                manager.run(['init',name]);ws.add(path.join(process.cwd(),name,'pep',name+'.pep'));
            }else if(choice==='e'){
                const items=examples(manager.snapshot().root);
                print(items.map((e,i)=>(i+1)+'  '+e.name).join('\n')||'No bundled examples');
                const selected=await ask('Register example number (blank = cancel) > ');
                if(/^\d+$/.test(selected)&&items[Number(selected)-1])ws.add(items[Number(selected)-1].pep);
            }else if(choice==='i'){
                const repo=await ask('GitHub owner/repository > ');
                if(!/^[a-zA-Z0-9][a-zA-Z0-9-]*\/[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(repo))throw Error('Invalid GitHub repository');
                const dest=await ask('New local directory > ');
                if(!dest)continue;
                const target=path.resolve(dest);
                if(fs.existsSync(target))throw Error('Destination already exists');
                call('gh',['repo','clone',repo,target]);
                print('Cloned. Register an entry PEP from '+target+' using a.');
            }else if(/^\d+$/.test(choice)&&apps[Number(choice)-1]){
                const app=apps[Number(choice)-1];
                print(app.pep+'\n  inspect | test | run | remove | back');
                const action=await ask('action > ');
                if(action==='remove'){if(await ask('Unregister only, keep files? [y/N] ')==='y')ws.remove(app.id);}
                else if(['inspect','test'].includes(action))manager.run([action,app.pep]);
                else if(action==='run'){
                    const args=[];
                    print('Enter one key=value per line; blank line executes.');
                    for(;;){const arg=await ask('input > ');if(!arg)break;if(!/^[A-Za-z_]\w*=/.test(arg))throw Error('Expected key=value');args.push(arg);}
                    manager.run(['run',app.pep,...args]);
                }
            }
        }catch(e){print('FAIL: '+e.message);}
    }
}
