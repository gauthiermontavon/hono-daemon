import { RxHR } from '@akanass/rx-http-request';
import { map } from 'rxjs/operators';
import { combineLatest, Subject } from 'rxjs';
import fs from 'fs';
import crypto from 'crypto';

//var fs = require('fs');
//const crypto = require('crypto');
//const request = require('./requests.js');

const BASE_PATH = 'http://localhost:20800';


var data = new Date().getTime() + ": OK\n";
fs.appendFileSync('./tmp/daemon-test.txt', data);

var scanAndCheckDone = new Subject();
let fileTemplate = {
  filename:'',
  repoStatus:''
}
var filesToImport = new Map(Object.entries(fileTemplate));
var filesToImport = new Map();


fs.readdir('./import', (err, files) => {
  if (err)
      console.log(err);
  else {
      //TODO: global array file : [filename] - md5+statusCode
      //selon le tableau, on élimine les fichiers non désirés, si plusieurs ont le même md5 dans le lot à importer...on en garde un seul.
      console.log('scan folder starting...');
      var i=0;
      for (const file of files) {
        i = i+1;

        //calcul du md5 pour le fichier en cours
        const fileBuffer = fs.readFileSync('./import/'+file);
        const hash = crypto.createHash('md5');
        hash.update(fileBuffer);
        const md5 = hash.digest('hex');

        console.log('scan folder running..., file '+i+'/'+files.length+' (md5:'+md5+')');

        //pas de check nécessaire, map ne garde que le dernier rencontré avec ce md5...
        if(filesToImport.has(md5)){
          console.log('[WARN]file ignored because md5 already in import folder...');
          //TODO:move to ignored folder...
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
      //results est un tableau, chaque élément représente les données émises par l'observable correspondant
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
scanAndCheckDone.subscribe(val=>{
  console.log('check md5 for each file vs repository...finished');
  console.log('print results:');
  // iterate over [key, value] entries

  for (const [key, value] of filesToImport) {
    console.log(`${key} = ${value.filename}`);
    console.log(`${key} = ${value.repoStatus}`);
    if(value.repoStatus==0){
      console.log(`[INFO] - ${value.filename} will be added to repo `);

      insertFile(value.filename,key);

    }else{
        console.log(`[WARN] - ${value.filename} will be ignored, already in repo `);
    }
    //insertFile(value.filename,key);
    //insertFile(value.filename,key);
  }
});

function insertFile(path,md5){
  console.log('insertFile for:'+path+', md5:'+md5);

    const options = {
        body: {
          doc:{title:'_untitled',path:path,md5:md5},
          collection:"images"
        },
        json: true // Automatically stringifies the body to JSON
    };
    console.log('insertFile json options'+JSON.stringify(options));

    RxHR.put(`${BASE_PATH}/insert`, options).subscribe(
        (data) => {
            console.log('DATA CALLBACK');
            if (data.response.statusCode === 201) {
                console.log(data.body); // Show the JSON response object.
            }
        },
        (err) => console.error(err) // Show error in console
    );
}
