/*import { RxHR } from '@akanass/rx-http-request';
import { map } from 'rxjs/operators';
import { combineLatest, Subject } from 'rxjs';
import fs from 'fs';
import crypto from 'crypto';
*/
import { logging,progress, startImportation} from './importation.js';
import { Server } from "socket.io";




const io = new Server(4444, { cors:{origin:"http://localhost:4200"} });

logging.subscribe(val=>{
  console.log('info from process importation:'+val);
  io.emit("message",{type:'logging',msg:val.msg,level:val.level});
});

progress.subscribe(val=>{
    console.log('progress info from process importation:'+JSON.stringify(val));
  io.emit("message",{type:'progress',current:val.current,total:val.total});
})

io.on("connection", (socket) => {
   console.log('a user connected');
   socket.on('disconnect', () => {
     console.log('user disconnected');
   });

   socket.on('start-import', (msg) => {
     console.log('start importing...: ' + msg);
     startImportation();



     //HERE subscribe to task imports

    });
});


var ok = false;
if(ok){


var data = new Date().getTime() + ": OK\n";
fs.appendFileSync('./tmp/daemon-test.txt', data);

//var scanAndCheckDone = new Subject();


console.log('[INFO] waiting on socket client...');

/*
setTimeout(()=>{
  console.log('finish waiting on socket client...');


fs.readdir('./import', (err, files) => {
  if (err)
      console.log(err);
  else {

      console.log('scan folder starting...');
      io.emit("message",{type:'progress',info:'total',value:files.length});
      var i=0;
      for (const file of files) {
        i = i+1;
        io.emit("message",{type:'progress',info:'current',value:i});

        const fileBuffer = fs.readFileSync('./import/'+file);
        const hash = crypto.createHash('md5');
        hash.update(fileBuffer);
        const md5 = hash.digest('hex');

        console.log('scan folder running..., file '+i+'/'+files.length+' (md5:'+md5+')');


        if(filesToImport.has(md5)){
          console.log('[WARN]file ignored because md5 already in import folder...');
        }else{
          filesToImport.set(md5,{filename:file,repoStatus:'0'});
        }
      }
      console.log('scan folder finished...'+JSON.stringify(filesToImport));

      const observables$ = [];
      filesToImport.forEach(function(value, key) {
        const imageForMd5$ =  RxHR.get(`${BASE_PATH}/get/images/byhash/${key}`, {json: true}).pipe(map(response => response.body));
        observables$.push(imageForMd5$);

      });

      console.log('check md5 for each file vs repository...starting');
      combineLatest(observables$).subscribe(results => {
        results.forEach((item, i) => {
          if(item){
              const obj = filesToImport.get(item.md5);
              obj.repoStatus = 1;
              filesToImport.set(item.md5,obj);
            }
        });
        scanAndCheckDone.next(true);
      });
  }
});

},10000);

*/
scanAndCheckDone.subscribe(val=>{
  console.log('check md5 for each file vs repository...finished');
  console.log('print results:');
  // iterate over [key, value] entries

  for (const [key, value] of filesToImport) {
    console.log(`${key} = ${value.filename}`);
    console.log(`${key} = ${value.repoStatus}`);
    if(value.repoStatus==0){
      console.log(`[INFO] - ${value.filename} will be added to repo `);

      //insertFile(value.filename,key);

    }else{
        console.log(`[WARN] - ${value.filename} will be ignored, already in repo `);
    }
    //insertFile(value.filename,key);
    //insertFile(value.filename,key);
  }
});

}else{
  console.log('cant start process...');
}
