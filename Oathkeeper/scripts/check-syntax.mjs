import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
for(const dir of ['web','repair-service'])for(const file of await readdir(dir))if(/\.(js|mjs)$/.test(file)){const result=spawnSync(process.execPath,['--check',dir+'/'+file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1)}
console.log('Application and repair-service syntax checks passed');
