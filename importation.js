import { RxHR } from '@akanass/rx-http-request';
import { map } from 'rxjs/operators';
import { combineLatest, Subject } from 'rxjs';
import fs from 'fs';
import crypto from 'crypto';

let fileTemplate = {
  filename:'',
  repoStatus:''
}

const BASE_PATH = 'http://localhost:20800';
var filesToImport = new Map(Object.entries(fileTemplate));
var scanAndCheckDone = new Subject();
export var logging = new Subject();
export var progress = new Subject();

var scanAndCheck = function(){

  fs.readdir('./import',{withFileTypes:true}, (err, files) => {
    if (err)
        console.log(err);
    else {
        const onlyFiles = files.filter(file => file.isFile()).map(file => file.name);
        //TODO: global array file : [filename] - md5+statusCode
        //selon le tableau, on élimine les fichiers non désirés, si plusieurs ont le même md5 dans le lot à importer...on en garde un seul.
        console.log('scan folder starting...');

        logging.next({level:'INFO',msg:'scan folder starting...'});
        progress.next({current:0,total:onlyFiles.length});
        //io.emit("message",{type:'progress',info:'total',value:files.length});
        var i=0;
        for (const file of onlyFiles) {
          i = i+1;

          console.log('file:'+file);
          //calcul du md5 pour le fichier en cours
          const fileBuffer = fs.readFileSync('./import/'+file);
          const hash = crypto.createHash('md5');
          hash.update(fileBuffer);
          const md5 = hash.digest('hex');
          logging.next({level:'INFO',msg:'scan folder running..., file '+i+'/'+files.length+' (md5:'+md5+')'});
          console.log('scan folder running..., file '+i+'/'+files.length+' (md5:'+md5+')');

          //pas de check nécessaire, map ne garde que le dernier rencontré avec ce md5...
          if(filesToImport.has(md5)){
            console.log('[WARN]file ignored because md5 already in import folder...');
            logging.next({level:'WARN',msg:'file ignored because md5 already in import folder...'});
            //TODO:move to ignored folder...
          }else{
            filesToImport.set(md5,{filename:file,repoStatus:'0'});
          }
        }
        console.log('scan folder finished...'+JSON.stringify(filesToImport));
        logging.next({level:'INFO',msg:'scan folder finished...'});

        const observables$ = [];
        filesToImport.forEach(function(value, key) {
          const imageForMd5$ =  RxHR.get(`${BASE_PATH}/get/images/byhash/${key}`, {json: true}).pipe(map(response => response.body));
          observables$.push(imageForMd5$);

        });
        //results est un tableau, chaque élément représente les données émises par l'observable correspondant
        console.log('check md5 for each file vs repository...starting');
        logging.next({level:'INFO',msg:'check md5 for each file vs repository...starting...'});
        combineLatest(observables$).subscribe(results => {
          results.forEach((item, i) => {
            if(item){
                const obj = filesToImport.get(item.md5);
                obj.repoStatus = 1;
                filesToImport.set(item.md5,obj);
            }
            progress.next({current:i,total:files.length});

          });
          scanAndCheckDone.next(true);
        });
    }
  });
};

var insertFile = async function(path,md5){
  console.log('insertFile for:'+path+', md5:'+md5);
    logging.next({level:'INFO',msg:'insert file for:'+path+', md5:'+md5});
    const promiseTagsFile = await readMetaForFile(path);

    promiseTagsFile.then(function(){
      console.log('TAGS PROMISE DONE, we have tag!!!!');
    });

    //AWAIT DOESNT WORD
    console.log('tags for file:'+tagsForFile);

    //TODO: read file meta_path and add to doc json (tags array)
    const options = {
        body: {
//TODO: date from exif, geoloc
          doc:{title:'_untitled',path:path,md5:md5,isnew:true,date:Date.now(),tags:tagsForFile},
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
            //TODO: move file to date-lot (20210412-001)
        },
        (err) => {
          console.error(err) // Show error in console
          //TODO: move file to error folder
        }
    );

};

var readMetaForFile = async function(path){
  var tags = [];

  const data = await fs.readFile('./import/meta/meta_'+path,'utf-8');
  const jsonData = JSON.parse(data);
  tags = jsonData.tags;
  return tags;
  /*
  await fs.readFile('./import/meta/meta_'+path,'utf-8',(err,data) => {
      if(err){
        console.error(err);
        return new Promise(resolve => {

        });
      }
      console.log('meta data tag:'+data);
      const jsonData = JSON.parse(data);
      tags = jsonData.tags;
      return tags;
  });
  */

};


export function startImportation (){
  console.log('--------->START IMPORTATION FOR GOOD');

  scanAndCheckDone.subscribe(val=>{
    console.log('check md5 for each file vs repository...finished');
    logging.next({level:'INFO',msg:'check md5 for each file vs repository...finished!'});
    console.log('print results:');
    // iterate over [key, value] entries

    for (const [key, value] of filesToImport) {
      console.log(`${key} = ${value.filename}`);
      console.log(`${key} = ${value.repoStatus}`);
      if(value.repoStatus==0){
        console.log(`[INFO] - ${value.filename} will be added to repo `);
        logging.next({level:'INFO',msg:`${value.filename} will be added to repo `});

        insertFile(value.filename,key);

      }else{
          console.log(`[WARN] - ${value.filename} will be ignored, already in repo `);
          logging.next({level:'WARN',msg:`${value.filename} will be ignored, already in repo `});
      }
      //insertFile(value.filename,key);
      //insertFile(value.filename,key);
    }
  });
  scanAndCheck();


};
