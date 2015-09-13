Media = new Mongo.Collection('media');

Players = new Mongo.Collection('players');

Connections = new Mongo.Collection('connections');

Globals = new Mongo.Collection('globals');

Mediaavail = new Mongo.Collection('mediaavail');

if (Globals.find({"name":"show_labels"}).count() == 0) {
  Globals.insert({"name":"show_labels", "value":true})
}