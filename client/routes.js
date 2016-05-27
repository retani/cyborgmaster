FlowRouter.route('/', {
    name: "home",
    subscriptions: function(params) {
      this.register('media', Meteor.subscribe('media'));
      this.register('players', Meteor.subscribe('players'));
    },    
    action: function(params) {
      BlazeLayout.render("home");
    }
});

FlowRouter.route('/player/:id', {
    name: "player",
    subscriptions: function(params) {
      this.register('media', Meteor.subscribe('media'));
      this.register('players', Meteor.subscribe('players'));
    },
    action: function(params) {
      playerId = params.id;
      BlazeLayout.render("player")
    }
});

FlowRouter.route('/master', {
    name: "master",
    subscriptions: function(params) {
      this.register('media', Meteor.subscribe('media'));
      this.register('players', Meteor.subscribe('players', {noPing:true}));
    },    
    action: function(params) {
      BlazeLayout.render("master");
    }
});
