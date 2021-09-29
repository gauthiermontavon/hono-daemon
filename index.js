var fs = require('fs');
const crypto = require('crypto');
const request = require('./requests.js');
var INTERVAL = 100000;

var cycle_stop = false;
var daemon = false;
var timer;


process.argv.forEach(function (arg) {
    if (arg === '-d') daemon = true;
});

process.on('SIGTERM', function () {
    console.log('Got SIGTERM signal.');
    stop();
});

runTask();
/*
(function cycle () {
    timer = setTimeout(function () {
        runTask();
        if (!cycle_stop) cycle();
    }, INTERVAL);
})();
*/
function runTask () {
  var data = new Date().getTime() + ": OK\n";
  fs.appendFileSync('./tmp/daemon-test.txt', data);


  fs.readdir('./import',  (err, files) => {
    if (err)
      console.log(err);
    else {


      for (const file of files) {
        const fileBuffer = fs.readFileSync('./import/'+file);
        const hash = crypto.createHash('md5');


        hash.update(fileBuffer);
        const md5 = hash.digest('hex');
        console.log('md5 for file '+file+' is :'+md5);
        var result = null;
        //result = request.mediaStatus(md5);
        request.mediaStatus(md5).then(function(response){
            console.log('response:'+JSON.stringify(response.data));
        });
      }




      /*
      files.forEach(file => {
        const fileBuffer = fs.readFileSync('./import/'+file);
        const hash = crypto.createHash('md5');


        hash.update(fileBuffer);
        const md5 = hash.digest('hex');
        console.log('md5 for file '+file+' is :'+md5);
        var result = null;
        //result = request.mediaStatus(md5);
        await request.mediaStatus(md5).then(function(response){
            console.log('response:'+JSON.stringify(response.data));
        });


      });*/
    }
  });

}


function stop () {
    cycle_stop = true;
    clearTimeout(timer);
}



if (daemon) require('daemon')();
