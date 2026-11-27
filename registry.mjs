import fs from 'node:fs';
import path from 'node:path';
export const upstream='Affect-Dynamics/ic3o-developer-preview';
const kinds=new Set(['.capability','.pep','.context','.contract']);
const clean=s=>String(s).replace(/[\x00-\x1f\x7f-\x9f]/g,' ');
export function catalog(root){
    const entries=[];
    function visit(dir){
        if(!fs.existsSync(dir))return;
        for(const e of fs.readdirSync(dir,{withFileTypes:true})){
            const file=path.join(dir,e.name);
            if(e.isDirectory())visit(file);
            else if(e.isFile()&&kinds.has(path.extname(e.name))){
                const relative=path.relative(root,file).split(path.sep).join('/');
                const body=fs.readFileSync(file,'utf8');
                entries.push({path:relative,name:e.name,kind:path.extname(e.name).slice(1),description:body.split(/\r?\n/).find(l=>l.trim()&&!l.trim().startsWith('#'))||'',body});
            }
        }
    }
    visit(path.join(root,'registry'));visit(path.join(root,'mode'));
    return entries.sort((a,b)=>a.path.localeCompare(b.path));
}
export function search(entries,term=''){
    const q=term.toLowerCase();
    return entries.filter(e=>(e.path+' '+e.description+' '+e.body).toLowerCase().includes(q));
}
export function sourceUrl(entry,sha){
    if(!/^[a-f0-9]{40}$/.test(sha))throw Error('Invalid revision');
    return 'https://github.com/'+upstream+'/blob/'+sha+'/'+entry.path.split('/').map(encodeURIComponent).join('/');
}
export function attribution(entry,sha,query){
    const commits=query(['api','--hostname','github.com','-X','GET','repos/'+upstream+'/commits','-f','sha='+sha,'-f','path='+entry.path,'-f','per_page=1']);
    const last=Array.isArray(commits)?commits[0]:null;
    if(!last||!/^[a-f0-9]{40}$/.test(last.sha))return {author:null,pulls:[],commit:null};
    const pulls=query(['api','--hostname','github.com','repos/'+upstream+'/commits/'+last.sha+'/pulls']);
    return {author:last.author?.login||null,commit:last.sha,pulls:Array.isArray(pulls)?pulls.filter(p=>p.merged_at&&p.base?.repo?.full_name===upstream&&Number.isSafeInteger(p.number)).map(p=>({number:p.number,author:p.user?.login||null})):[]};
}
export function examples(root){
    const dir=path.join(root,'projects');
    if(!fs.existsSync(dir))return [];
    return fs.readdirSync(dir,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>({name:e.name,pep:path.join(dir,e.name,'pep',e.name+'.pep')})).filter(e=>fs.existsSync(e.pep)&&fs.lstatSync(e.pep).isFile()).sort((a,b)=>a.name.localeCompare(b.name));
}
export async function registry(manager,ask,print,query){
    const snapshot=manager.snapshot();
    const entries=catalog(snapshot.root);
    for(;;){
        const term=await ask('Registry search (blank = all, b = back) > ');
        if(term==='b')return;
        const found=search(entries,term);
        if(!found.length){print('No matching definitions');continue;}
        print(found.map((e,i)=>(i+1)+'  '+clean(e.path)+' | '+clean(e.description)).join('\n'));
        const choice=await ask('Inspect entry number (blank = search, b = back) > ');
        if(choice==='b')return;
        if(!/^\d+$/.test(choice)||!found[Number(choice)-1])continue;
        const e=found[Number(choice)-1];
        print(e.body.split(/\r?\n/).map(clean).join('\n'));
        print('Source: '+sourceUrl(e,snapshot.sha));
        const a=attribution(e,snapshot.sha,query);
        print('Last changing commit author: '+clean(a.author||'unavailable'));
        if(a.commit)print('Commit: https://github.com/'+upstream+'/commit/'+a.commit);
        print(a.pulls.length?a.pulls.map(p=>'Associated merged PR: https://github.com/'+upstream+'/pull/'+p.number+' (@'+clean(p.author||'unknown')+')').join('\n'):'Associated merged PR unavailable');
        await ask('Enter to continue > ');
    }
}
