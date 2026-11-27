import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {manager} from './sync.mjs';
const [major,minor]=process.versions.node.split('.').map(Number);
const help=`gh ic3o — contributor preview

  sync                 Verify and activate framework + registry
  check                Check upstream revision
  status               Show active revision
  rollback             Restore previous snapshot
  login                GitHub authentication
  whoami               GitHub identity
  init NAME            Scaffold application (requires contributor CLI)
  registry search TERM Search local registry (requires contributor CLI)
  run FILE [key=value] Execute a native network
  test FILE            Run application fixtures
  contribute           Submit a pull request (requires contributor CLI)
  report               Open an issue

Run sync before using framework commands. Preview capabilities depend on
the active upstream revision. No background updater or telemetry.
`;
try{
    if(major<22||(major===22&&minor<13))throw Error('Node 22.13+ required');
    const [action='help',...args]=process.argv.slice(2);
    const call=(exe,argv)=>{
        const r=spawnSync(exe,argv,{stdio:'inherit',shell:false});
        if(r.error)throw r.error;
        if(r.status!==0)throw Error(exe+' exited '+r.status);
    };
    if(['help','--help','-h'].includes(action))console.log(help);
    else if(action==='login'&&!args.length)call('gh',['auth','login','--hostname','github.com','--web']);
    else if(action==='whoami'&&!args.length)call('gh',['api','--hostname','github.com','user','--jq','.login']);
    else{
        const m=manager(path.join(os.homedir(),'.ic3o','preview'));
        if(['sync','check','status','rollback'].includes(action)&&!args.length)console.log(JSON.stringify(m[action](),null,2));
        else if(['init','registry','run','test','inspect','validate','resolve','modes','frontends','repo','contribute','report'].includes(action)){
            if(!m.status().active)throw Error('Run gh ic3o sync first');
            m.run([action,...args]);
        }else throw Error('Unknown command; run gh ic3o help');
    }
}catch(e){console.error('FAIL:',e.message);process.exitCode=1;}
