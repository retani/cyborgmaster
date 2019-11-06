mediaserver_address = process.env.CYBORGMASTER_MEDIASERVER_HOST || "192.168.178.30:3000"
mediaserver_path = process.env.CYBORGMASTER_MEDIASERVER_PATH || "media/"
local_media_path = process.env.CYBORGMASTER_LOCAL_MEDIA_PATH || "/Users/holger/Documents/Projekte/playmaster/media/"
key_path = '/Users/internil/server.key'
cert_path = '/Users/internil/server.crt'
enable_media_server = true


console.log("mediaserver_address:", mediaserver_address)
console.log("mediaserver_path:", mediaserver_path)
console.log("local_media_path:", local_media_path)


/* HOLGER OFFICE 
mediaserver_address = "192.168.178.150"
mediaserver_path = "media/"
local_media_path = "/Library/WebServer/Documents/media/"
key_path = '/Users/holger/Documents/Projekte/staatenlos/cyborgmaster/private/hmbp.local-selfsigned.key'
cert_path = '/Users/holger/Documents/Projekte/staatenlos/cyborgmaster/private/hmbp.local-selfsigned.cert'
*/

/* HOLGER HOME 
mediaserver_address = "192.168.0.66"
mediaserver_path = "media/"
local_media_path = "/Library/WebServer/Documents/media/"
key_path = '/Users/holger/Documents/Projekte/staatenlos/cyborgmaster/private/hmbp.local-selfsigned.key'
cert_path = '/Users/holger/Documents/Projekte/staatenlos/cyborgmaster/private/hmbp.local-selfsigned.cert'
*/
