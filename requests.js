const http = require('http');


const axios = require('axios');
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.baseURL = 'http://localhost:20800';


function addDocument(path,md5){
  return axios.put('/insert',{
    "doc":{"path":path,"md5":md5},
    "collection":"images"
  })
};





/*
function addDocument(path,md5){
  console.log('add document function called !');
  const data = new TextEncoder().encode(
    JSON.stringify({
    "doc":{"path":path,"md5":md5},
    "collection":"images"
  }
  ));

  const options = {
    hostname: 'localhost',
    port: 20800,
    path: '/insert',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  doRequest(options,data);



};
*/

module.exports.mediaStatus = function (hash){
  return axios.get('/get/images/byhash/'+hash);


}
/*
function mediaStatus(hash){
  console.log('mediaStatus function called !');


  const options = {
    hostname: 'localhost',
    port: 20800,
    path: '/get/images/byhash/'+hash,
    method: 'GET'

  };

  return doRequest(options,null);
};
*/
function doRequest(options,data){
  var response = '';
  const req = http.request(options, res => {
    //console.log(`statusCode: ${res.statusCode}`);

    res.on('data', d => {
        response = d;
        console.log('request done:'+d);
        process.stdout.write(d)
      });
  });

  req.on('error', error => {
    console.error(error)
  });
  if(data){
    req.write(data);
  }

  console.log('before end;');
  req.end();
  return response;

};

module.exports.addDoc = addDocument;
