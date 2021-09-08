const http = require('http');

function addDocument(){
  console.log('add document function called !');
  const data = new TextEncoder().encode(
    JSON.stringify({
    "doc":{"title":"hello"},
    "collection":"test"
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

  const req = http.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`)

    res.on('data', d => {
      process.stdout.write(d)
    });
  });

  req.on('error', error => {
    console.error(error)
  });

  req.write(data);
  req.end();

}



module.exports.addDoc = addDocument;
