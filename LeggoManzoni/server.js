var http = require('http');         // Tipo di server che ti serve , in questo caso HTTP

var server = http.createServer(function (req, res) {  // req e res stanno per request e response

    if (req.url == '/') {                       // Url di destinazione della richiesta
        
        res.writeHead(200, { 'Content-Type': 'text/html' });    //  200 è il tipo di risposta (200 sarebbe OK) , la seconda indica il tipo di pagina da servire, in questo caso html
        res.write('<html><body><p><h1> Home Page </h1></p></body></html>');             // Pagina HTML scritta brutta, puoi ovviamente anche linkare un file html
        res.end();                  // Indica che la richiesta è stata servita e si chiude
    
    }
    else if (req.url == "/giulia") {
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<html><body><p><h3> Ciao mondo! </h3></p> <p> <h1> <3 </h1> </p> </body></html>');
        res.end();
    
    }

    else if (req.url == '/json') {          // Esempio per rispondere alle richieste con un Json

        res.writeHead(200, { 'Content-Type': 'application/json' });         // Come prima ma qui è un JSON
        res.write(JSON.stringify({ message: "Hello World"}));               // Crei un json da utilizzare come risposta
        res.end();
        
    }
    
    else
        res.end('Invalid Request!');                // Tutti gli altri URL daranno Invalid Request perchè non esiste un path

});

server.listen(5000);            // Metti il server in ascolto su una porta

console.log('Node.js web server at port 5000 is running.')         // Per avviare il server scrivi sul terminale "node server.js"